import { expect, Page } from '@playwright/test';
import type { AppConfig, RetryConfig, ElementSelector } from './types';

/**
 * 创建空白工作流应用
 */
export async function createBlankWorkflow(page: Page, config: AppConfig): Promise<void> {
  await page.goto('/apps', { timeout: 60000 }); // 增加超时到60秒
  await page.waitForLoadState('domcontentloaded'); // 先等待 DOM 加载
  await page.waitForSelector('text=Create from Blank', { timeout: 30000 }); // 等待关键元素出现
  
  await page.getByText('Create from Blank', { exact: true }).click();
  
  const nameInput = page.getByPlaceholder('Give your app a name');
  await nameInput.waitFor();
  
  const dialogPanel = page.locator('[id^="headlessui-dialog-panel"]');
  await expect(dialogPanel).toBeVisible();
  
  const workflowCard = dialogPanel.getByText('Workflow', { exact: true });
  const trial = await workflowCard.click({ trial: true }).then(() => true).catch(() => false);
  if (!trial) {
    await workflowCard.locator('xpath=..').click();
  } else {
    await workflowCard.click();
  }
  
  // 填写应用信息
  await page.fill('input[placeholder="Give your app a name"]', config.name);
  await page.fill('textarea[placeholder="Enter the description of the app"]', config.description);
  await page.click('button:has-text("Create")');
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000); // 等待画布渲染
}

/**
 * 通用元素等待和点击
 */
export async function waitAndClick(page: Page, selector: ElementSelector): Promise<boolean> {
  const timeout = selector.timeout || 10000;
  
  // 尝试主选择器
  try {
    const element = page.locator(selector.primary);
    await element.waitFor({ state: 'visible', timeout });
    await element.click();
    return true;
  } catch (error) {
    console.debug(`Primary selector failed: ${selector.primary}`);
  }
  
  // 尝试备用选择器
  for (const fallback of selector.fallbacks) {
    try {
      const element = page.locator(fallback);
      await element.waitFor({ state: 'visible', timeout: timeout / 2 });
      await element.click();
      console.debug(`Fallback selector succeeded: ${fallback}`);
      return true;
    } catch (error) {
      console.debug(`Fallback selector failed: ${fallback}`);
      continue;
    }
  }
  
  return false;
}

/**
 * 带重试的元素等待
 */
export async function waitForElementWithRetry(
  page: Page, 
  selector: string, 
  config: RetryConfig = { maxAttempts: 3, delayMs: 1000, timeoutMs: 5000 }
): Promise<boolean> {
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      await page.waitForSelector(selector, { timeout: config.timeoutMs });
      return true;
    } catch (error) {
      console.debug(`Attempt ${attempt} failed for selector: ${selector}`);
      if (attempt < config.maxAttempts) {
        await page.waitForTimeout(config.delayMs);
      }
    }
  }
  return false;
}

/**
 * 稳健的"Select Next Block"点击
 * 使用原始工作版本的逻辑
 */
export async function clickSelectNextBlock(page: Page): Promise<void> {
  // Primary text match
  let trigger = page.getByText('Select Next Block').first();
  const appeared = await trigger.isVisible().catch(() => false);
  if (!appeared) {
    // Fallback: look for a button with a plus icon near the right panel (heuristic)
    const plusButtons = page.locator('button:has(svg)').filter({ hasText: '+' });
    if (await plusButtons.count()) {
      trigger = plusButtons.first();
      console.debug('[helper] Using fallback plus button for Select Next Block');
    }
  }
  await trigger.waitFor({ state: 'visible', timeout: 15000 });
  await trigger.click();
  console.debug('[helper] Clicked Select Next Block');
}

/**
 * 添加节点到工作流
 */
export async function addNodeToWorkflow(page: Page, nodeType: string, nodeTitle: string): Promise<void> {
  // 点击 Select Next Block
  await clickSelectNextBlock(page);
  
  // 在面板中选择节点类型
  const nodeItem = page.getByText(nodeType, { exact: true });
  await nodeItem.waitFor({ state: 'visible', timeout: 10000 });
  await nodeItem.click();
  
  // 配置节点标题
  const titleBox = page.getByPlaceholder('Add title...');
  await titleBox.waitFor({ state: 'visible', timeout: 15000 });
  await titleBox.fill(nodeTitle);
  
  console.debug(`[addNodeToWorkflow] Added ${nodeType} node with title: ${nodeTitle}`);
}

/**
 * 检查节点是否已存在
 */
export async function nodeExists(page: Page, nodeTitle: string): Promise<boolean> {
  const existingNode = page.locator('button').filter({ hasText: new RegExp(`^${nodeTitle}$`) }).first();
  return await existingNode.count() > 0;
}

/**
 * 聚焦到指定节点（如果存在）
 */
export async function focusNode(page: Page, nodeTitle: string): Promise<boolean> {
  try {
    const nodeButton = page.locator('button').filter({ hasText: new RegExp(`^${nodeTitle}$`) }).first();
    await nodeButton.waitFor({ state: 'visible', timeout: 5000 });
    await nodeButton.click();
    await page.waitForTimeout(500);
    return true;
  } catch (error) {
    console.debug(`Failed to focus node: ${nodeTitle}`);
    return false;
  }
}

/**
 * 等待网络稳定
 */
export async function waitForNetworkStability(page: Page, timeout = 10000): Promise<void> {
  console.log('Waiting for network stability...');
  try {
    await page.waitForLoadState('networkidle', { timeout });
    await page.waitForTimeout(500); // 额外缓冲
  } catch (error) {
    console.debug('Network stability timeout, continuing...');
  }
}