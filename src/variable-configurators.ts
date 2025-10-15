import { Page } from '@playwright/test';
import type { VariableSelector, RetryConfig, SetVariableStrategy } from './types';
import { waitForElementWithRetry } from './workflow-helpers';

/**
 * 查找并点击"Set variable"按钮的通用逻辑
 * 这是01和03测试中最复杂的重复逻辑
 */
export async function findAndClickSetVariable(
  page: Page,
  strategy: SetVariableStrategy = 'byPosition',
  positions: number[] = [1, 3, 2, 0]
): Promise<boolean> {
  console.log('Finding and clicking Set variable button...');

  // 综合选择器：div/button 均匹配，大小写不敏感
  const locatorCandidates = [
    'button:has-text("Set variable")',
    'div:has-text("Set variable")',
    'button:has-text("设置变量")',
    'div:has-text("设置变量")'
  ];

  let setVariableButtons = page.locator(locatorCandidates.join(', '));
  let buttonCount = await setVariableButtons.count();

  // 如果初次未找到，尝试滚动或轻微等待
  if (buttonCount === 0) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(200);
    setVariableButtons = page.locator(locatorCandidates.join(', '));
    buttonCount = await setVariableButtons.count();
  }

  console.log(`Found ${buttonCount} potential Set variable buttons`);
  if (buttonCount === 0) return false;

  let clickPositions: number[] = [];
  switch (strategy) {
    case 'byPosition':
      clickPositions = positions.filter(pos => pos < buttonCount);
      break;
    case 'bySection':
      clickPositions = [buttonCount - 1, 1, 0].filter(pos => pos >= 0 && pos < buttonCount);
      break;
    case 'byText':
      clickPositions = Array.from({ length: Math.min(3, buttonCount) }, (_, i) => i);
      break;
  }

  for (const pos of clickPositions) {
    try {
      await setVariableButtons.nth(pos).scrollIntoViewIfNeeded().catch(() => {});
      await setVariableButtons.nth(pos).click({ trial: true });
      await setVariableButtons.nth(pos).click();
      console.log(`Clicked "Set variable" button at index ${pos}`);
      return true;
    } catch (e) {
      console.debug(`Failed to click Set variable button at index ${pos}:`, (e as Error).message);
    }
  }
  return false;
}

/**
 * 从变量下拉选择器中选择变量
 */
export async function selectVariableFromDropdown(
  page: Page, 
  variable: VariableSelector
): Promise<boolean> {
  console.log(`Selecting variable: ${variable.text}`);
  
  // 等待变量选择器出现 - 使用工作版本的等待策略
  try {
    // Wait for variable selector to appear - based on MCP observation
    await page.waitForSelector('textbox[placeholder*="Search variable"], input[placeholder*="Search variable"]', { timeout: 10000 });
    console.log('Variable selector appeared');
  } catch (error) {
    console.error('Variable selector did not appear:', error);
    return false;
  }
  
  // 多策略查找变量 - 基于工作版本的成功模式
  const variableSelectors = [
    () => page.getByText(`${variable.source} ${variable.text}`), // 如 "Start context"
    () => page.getByText(variable.text).filter({ hasText: variable.type || 'string' }),
    () => page.locator('div').filter({ hasText: new RegExp(variable.source || '') }).getByText(variable.text),
    () => page.getByText(variable.source || '').locator('..').getByText(variable.text),
    () => page.getByText(new RegExp(variable.text, 'i')).first(),
  ];
  
  for (const selector of variableSelectors) {
    try {
      const element = selector();
      await element.waitFor({ timeout: 3000 });
      await element.click();
      console.log(`Selected variable: ${variable.text}`);
      return true;
    } catch (e) {
      continue;
    }
  }
  
  console.error(`Could not find variable: ${variable.text}`);
  return false;
}

/**
 * 完整的变量配置流程（Set variable + 选择变量）
 */
export async function configureVariable(
  page: Page,
  variable: VariableSelector,
  strategy: SetVariableStrategy = 'byPosition',
  retryConfig: RetryConfig = { maxAttempts: 2, delayMs: 2000, timeoutMs: 5000 }
): Promise<boolean> {
  let attempts = 0;
  
  while (attempts < retryConfig.maxAttempts) {
    attempts++;
    console.log(`Variable configuration attempt ${attempts}...`);
    
    try {
      // 步骤1：点击"Set variable"按钮
      const setVariableClicked = await findAndClickSetVariable(page, strategy);
      if (!setVariableClicked) {
        throw new Error('Could not click "Set variable" button');
      }
      
      // 步骤2：选择变量
      const variableSelected = await selectVariableFromDropdown(page, variable);
      if (!variableSelected) {
        throw new Error(`Could not select variable: ${variable.text}`);
      }
      
      // 步骤3：等待选择器关闭
      await page.waitForTimeout(1000);
      
      return true;
      
    } catch (error) {
      console.log(`Attempt ${attempts} failed:`, (error as Error).message);
      if (attempts < retryConfig.maxAttempts) {
        await page.waitForTimeout(retryConfig.delayMs);
        continue;
      }
    }
  }
  
  return false;
}

/**
 * 验证变量配置是否成功
 * 通过检查是否还有"Set variable"文本或出现了连接图标
 */
export async function verifyVariableConfiguration(
  page: Page, 
  sectionSelector: string
): Promise<boolean> {
  try {
    // 方法1：检查该区域是否还有"Set variable"文本
    const stillHasSetVariable = await page.locator(sectionSelector)
      .locator('text="Set variable"')
      .isVisible()
      .catch(() => false);
    
    if (!stillHasSetVariable) {
      console.log('Variable configuration verified: "Set variable" text disappeared');
      return true;
    }
    
    // 方法2：检查是否有连接图标
    const hasConnectionIcon = await page.locator(sectionSelector)
      .locator('img')
      .count() > 1;
    
    if (hasConnectionIcon) {
      console.log('Variable configuration verified: connection icons present');
      return true;
    }
    
    return false;
  } catch (error) {
    console.debug('Error verifying variable configuration:', (error as Error).message);
    return false;
  }
}



/**
 * Start节点变量配置专用函数 - 基于工作版本的完整实现
 */
export async function configureStartVariable(
  page: Page, 
  variableName: string, 
  label: string
): Promise<boolean> {
  console.log(`Configuring Start variable: ${variableName}`);
  
  // 点击Start节点
  const startNode = page.getByText('Start').first();
  await startNode.click();
  await page.waitForTimeout(400);
  
  // 检查变量是否已存在
  const variableLabel = page.locator(`text=/^${variableName}$/i`).first();
  if (await variableLabel.isVisible().catch(() => false)) {
    console.log(`Start variable '${variableName}' already exists`);
    return true;
  }
  
  // 添加变量的逻辑（模态或内联）- 改进版本
  const deadline = Date.now() + 8000; // 8s hard ceiling
  let added = false;
  
  while (Date.now() < deadline && !added) {
    console.debug(`[configureStartVariable] loop tick; remainingMs=${deadline - Date.now()}`);
    
    // 查找添加按钮
    const header = page.locator('text=/Input Field|输入字段/').first();
    if (await header.isVisible().catch(() => false)) {
      const container = header.locator('xpath=..');
      // 优先选择带指针光标的img或svg
      const plusIcon = container.locator('button, img, svg').filter({ hasNotText: /Input Field|输入字段/ }).first();
      if (await plusIcon.isVisible().catch(() => false)) {
        await plusIcon.click().catch(() => {});
        await page.waitForTimeout(200);
      }
    }
    
    // 备用触发器 (如果模态/内联未显示)
    if (!(await page.locator('text=/Add Input Field|添加输入字段|添加输入/').first().isVisible().catch(() => false))) {
      const triggerCandidates = [
        page.getByRole('button', { name: /Add Input Field|Add Input|Add variable|添加输入|新增输入/ }).first(),
        page.locator('button:has-text("+")').first(),
        page.locator('.p-1 > .remixicon').first(),
      ];
      for (const t of triggerCandidates) {
        if (await t.isVisible().catch(() => false)) { 
          await t.click().catch(() => {}); 
          break; 
        }
      }
    }
    
    // 分支: 模态样式
    const modalHeading = page.getByText(/Add Input Field|添加输入字段|添加输入/).first();
    if (await modalHeading.isVisible().catch(() => false)) {
      const modal = modalHeading.locator('xpath=../../..');
      const inputs = modal.locator('input');
      
      const nameField = inputs.first();
      if (await nameField.isVisible().catch(() => false)) {
        await nameField.fill(variableName);
      }
      
      const labelField = inputs.nth(1);
      if (await labelField.isVisible().catch(() => false)) {
        await labelField.fill(label || variableName);
      }
      
      const save = modal.getByRole('button', { name: /Save|保存/ }).first();
      if (await save.isVisible().catch(() => false)) {
        await save.click().catch(() => {});
      }
      await page.waitForTimeout(300);
    } else {
      // 内联样式: 查找输入占位符
      const placeholders = ['Variable name', 'Please input', '变量名', '变量名称'];
      for (const ph of placeholders) {
        const field = page.getByPlaceholder(ph).first();
        if (await field.isVisible().catch(() => false)) {
          await field.fill(variableName);
          const saveBtn = page.getByRole('button', { name: /Save|保存|Set variable|设置变量/ }).first();
          if (await saveBtn.isVisible().catch(() => false)) {
            await saveBtn.click().catch(() => {});
          }
          await page.waitForTimeout(300);
          break;
        }
      }
    }
    
    // 检查是否成功
    if (await variableLabel.isVisible().catch(() => false)) { 
      added = true; 
      console.debug('[configureStartVariable] variable visible; exiting loop'); 
      break; 
    }
    await page.waitForTimeout(250);
    console.debug(`[configureStartVariable] loop continue; variable visible? ${await variableLabel.isVisible().catch(() => false)}`);
  }
  
  console.log(`Start variable configuration ${added ? 'succeeded' : 'failed'}`);
  return added;
}