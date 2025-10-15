import { test, expect, Page } from '@playwright/test';
import {
  createBlankWorkflow,
  configureStartVariable,
  configureLLMNode,
  configureEndNode,
  runWorkflowAndWaitForSuccess,
  configureLLMContextVariable,
  COMMON_CONFIGS,
  type EndConfig
} from '../index';

/**
 * 用例 01：基础 Travel LLM Workflow 验证
 * 关注点：创建 -> 配置 -> 执行 -> SUCCESS
 * 不校验具体输出语义，只校验执行成功及基本结构
 */

test.describe('Case 01 - Travel Basic LLM Workflow', () => {
  test('should create, configure and execute successfully', async ({ page }) => {
    test.setTimeout(120000); // 增加超时到2分钟，和原始测试一致
    const cfg = COMMON_CONFIGS.TRAVEL_BASIC_LLM;

    // 1. 创建空白工作流应用
    await createBlankWorkflow(page, cfg.app);
    await expect(page.getByText(cfg.app.name).first()).toBeVisible();

    // 2. 配置 Start 节点输入变量
    const startVarConfigured = await configureStartVariable(page, cfg.startVariable.name, cfg.startVariable.label);
    expect(startVarConfigured, 'Start variable configuration failed').toBeTruthy();
    
    // 验证 Start 变量已创建
    await page.getByText('Start').first().click();
    const contextVar = page.locator(`text=/^${cfg.startVariable.name}$/i`).first();
    await expect(contextVar).toBeVisible({ timeout: 5000 });
    console.log(`✅ Verified Start '${cfg.startVariable.name}' variable exists`);

    // 3. 配置 LLM 节点 (PlanLLM)
    const llmConfigured = await configureLLMNode(page, cfg.llm.title, {
      systemPrompt: cfg.llm.systemPrompt,
      userMessage: cfg.llm.userMessage,
      contextVariable: '' // 使用专用函数配置，这里传空字符串
    });
    console.log('LLM node configuration result:', llmConfigured);

    // 3.1 配置 LLM Context 变量 (使用工作版本的专用函数)
    const contextConfigured = await configureLLMContextVariable(page);
    console.log('Context variable configuration result:', contextConfigured);

    // 等待一段时间，确保 LLM 节点配置完全保存
    await page.waitForTimeout(1000);
    
    // 4. 配置 End 节点输出 (travel_plan <- PlanLLM.text)
    const endConfig: EndConfig = {
      outputVariable: cfg.endVariable.name,
      sourceVariable: cfg.endVariable.sourceField, // text
      sourceNode: cfg.endVariable.sourceNode,
      sourceField: cfg.endVariable.sourceField
    };
    const endConfigured = await configureEndNode(page, endConfig);
    console.log('End node configuration result:', endConfigured);

    // 5. 等待自动保存
    await page.waitForTimeout(1000);

    // 6. 执行工作流并等待 SUCCESS
    const result = await runWorkflowAndWaitForSuccess(page, cfg.testInput, cfg.validation, { fixedWaitMs: 5000 });

    // 7. 断言执行成功
    expect(result.success, `Execution failed: ${result.reason}\nAnswer snippet: ${result.answer.substring(0,120)}`).toBeTruthy();

    // 8. 额外断言：答案长度
    expect(result.answer.length).toBeGreaterThanOrEqual(cfg.validation.minAnswerLength);
  });
});
