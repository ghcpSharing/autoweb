# Dify Workflow FAQ - 常见问题解答

## 目录
1. [变量引用问题](#1-变量引用问题)
2. [节点配置问题](#2-节点配置问题)
3. [运行和调试问题](#3-运行和调试问题)
4. [End 节点配置问题深度解析](#4--end-节点配置问题深度解析)
5. [Playwright MCP 等待策略最佳实践](#5--playwright-mcp-等待策略最佳实践)


---

## 1. 变量引用问题

### Q1.1: 在 LLM 节点的提示词中如何正确引用变量？

**❌ 错误方式**:
```
直接在文本框中输入：
商品名称：{product_name}
商品特点：{product_features}
```

**✅ 正确方式**:
必须通过 UI 变量选择器操作：

**手动操作步骤**:
1. 在提示词文本框中输入固定文本: `商品名称：`
2. 输入 `{` 或 `/` 字符触发变量选择器
3. 在弹出的变量列表中点击 `product_name` 变量
4. 继续输入下一段文本: `\n商品特点：`
5. 再次输入 `{` 触发选择器
6. 点击 `product_features` 变量
7. 继续输入剩余内容

**Playwright 自动化代码**:
```typescript
// 1. 点击文本框
await page.getByRole('textbox').nth(2).click();

// 2. 输入文本 + 触发选择器 + 选择变量
await page.getByRole('textbox').nth(2).type('商品名称：');
await page.getByRole('textbox').nth(2).type('{');
await page.waitForSelector('text=product_name');
await page.getByText('product_name', { exact: true }).click();

// 3. 继续下一个变量
await page.getByRole('textbox').nth(2).type('\n商品特点：');
await page.getByRole('textbox').nth(2).type('{');
await page.getByText('product_features', { exact: true }).click();

// 4. 输入剩余内容
await page.getByRole('textbox').nth(2).type('\n\n请生成文案...');
```

**原理说明**:
- Dify 的变量引用包含**动态节点 ID**
- 实际格式: `{{#1760410682158.product_name#}}`
- 节点 ID 在每次创建时动态生成
- 只有通过 UI 选择器才能获得正确的节点 ID
- 直接输入 `{variable_name}` 只是普通文本，不会被解析

---

### Q1.2: Context 变量和普通变量有什么区别？

**Context 变量**:
- 用于 LLM 节点的 Context 配置区域
- 可以在系统提示中直接使用 `{{#context#}}` 语法
- 需要在 LLM 节点的 "context" 配置项中建立连接
- 示例：
  ```
  系统提示：
  You are a helpful assistant. Use the provided context to answer the user's question.
  
  Context:
  {{#context#}}
  ```

**普通变量**:
- 来自其他节点的输出（如 Start 节点的输入字段）
- **必须**通过 UI 变量选择器插入
- 包含动态节点 ID
- 示例：`{{#1760410682158.question#}}`

**配置差异**:

| 方面 | Context 变量 | 普通变量 |
|------|-------------|---------|
| 插入方式 | 直接输入 `{{#context#}}` | 必须通过 UI 选择器 |
| 节点 ID | 不需要 | 需要（动态生成） |
| 配置位置 | LLM 节点的 Context 区域 | 提示词文本框 |
| 数据来源 | 通常来自 Knowledge Retrieval | 来自任意节点输出 |

**参考用例**: `testcases/03_output_autogent.md` 第 37-41 行

---

### Q1.3: 为什么变量选择器没有弹出？

**可能原因和解决方案**:

1. **文本框未获得焦点**
   - 解决: 先点击文本框 `await page.getByRole('textbox').nth(2).click()`
   
2. **触发字符输入错误**
   - 解决: 确保输入的是 `{` 或 `/` 字符
   - 使用 `type('{')` 而不是 `fill('{...')`
   
3. **变量选择器加载延迟**
   - 解决: 添加等待 `await page.waitForSelector('text=product_name')`
   
4. **当前位置不支持变量插入**
   - 解决: 确认光标在正确的输入位置

**调试技巧**:
```typescript
// 输入触发字符后截图
await page.getByRole('textbox').nth(2).type('{');
await page.screenshot({ path: 'variable-selector.png' });

// 等待并验证选择器出现
await page.waitForSelector('[role="tooltip"]', { timeout: 5000 });
```

---

### Q1.4: 如何验证变量是否正确插入？

**UI 验证**:
- 正确插入的变量会显示为**特殊样式**
- 通常是徽章（badge）或高亮文本
- 鼠标悬停可能显示完整的变量路径

**运行时验证**:
```typescript
// 1. 运行 workflow
await page.getByText('Run').click();
await page.getByRole('textbox', { name: 'Please input' }).first().fill('测试商品');
await page.getByRole('button', { name: 'Start Run' }).click();

// 2. 等待完成
await page.waitForSelector('text=Run', { timeout: 30000 });

// 3. 检查结果是否包含输入的值
const result = await page.locator('[data-testid="result"]').textContent();
expect(result).toContain('测试商品');
```

**调试方法**:
- 切换到 DETAIL 或 TRACING 标签查看变量传递
- 查看每个节点的输入输出
- 检查是否有变量未定义的错误

---

### Q1.5: 多个变量如何按顺序插入？

**完整示例**:

```typescript
const textbox = page.getByRole('textbox').nth(2);

// 第一段文本
await textbox.type('你是一个专业的商品文案撰写专家。\n\n');

// 第一个变量
await textbox.type('商品名称：');
await textbox.type('{');
await page.getByText('product_name', { exact: true }).click();

// 第二段文本
await textbox.type('\n商品特点：');

// 第二个变量
await textbox.type('{');
await page.getByText('product_features', { exact: true }).click();

// 剩余文本
await textbox.type('\n\n请生成包含以下部分的文案：\n1. 标题\n2. 亮点\n3. 场景\n4. 理由');
```

**注意事项**:
- 每次插入变量后，光标会自动移到变量后面
- 可以继续输入文本或插入下一个变量
- 不要使用 `fill()` 方法，会清空已有内容
- 使用 `type()` 方法逐步构建提示词

---

## 2. 节点配置问题

### Q2.1: 如何添加 Start 节点的输入字段？

**步骤**:
1. 点击 Start 节点打开配置面板
2. 找到 "Input Field" 区域
3. 点击 "+" 按钮
4. 在弹出对话框中配置:
   - Field type: Short Text / Paragraph / Select / Number
   - Variable Name: 变量名（必填）
   - Label Name: 显示标签（必填）
   - Max length: 最大长度
   - Required: 是否必填

**Playwright 代码**:
```typescript
// 点击 Start 节点
await page.getByRole('button', { name: 'Start' }).click();

// 点击添加按钮
await page.locator('.p-1 > .remixicon').click();

// 选择字段类型（如 Paragraph）
await page.locator('div').filter({ hasText: /^Paragraph$/ }).click();

// 填写变量名
await page.getByRole('textbox', { name: 'Please input' }).first().fill('product_features');

// 填写标签
await page.getByRole('textbox', { name: 'Please input' }).nth(1).fill('商品特点');

// 保存
await page.getByRole('button', { name: 'Save' }).click();
```

---

### Q2.2: 如何配置 End 节点的输出变量？

**步骤**:
1. 点击 End 节点
2. 在 "output variable" 区域点击 "+" 按钮
3. 填写变量名
4. 点击 "Set variable" 按钮
5. 在变量选择器中选择源变量（如 LLM.text）

**Playwright 代码**:
```typescript
// 点击 End 节点
await page.locator('div').filter({ hasText: /^End$/ }).first().click();

// 添加输出变量
await page.locator('.p-1 > .remixicon').click();

// 填写变量名
await page.getByRole('textbox', { name: 'Variable name' }).fill('result');

// 打开变量选择器
await page.locator('div').filter({ hasText: /^Set variable$/ }).click();

// 选择 LLM 节点的 text 输出
await page.getByText('textstring').click();
// 或者
await page.getByText('LLM').click();
await page.getByText('text').click();
```

---

### Q2.3: 节点之间如何建立连接？

**自动连接**:
- 使用 "Select Next Block" 按钮会自动创建连接
- 连接线会自动绘制

**手动连接**:
- 拖拽节点的输出端口到下一个节点的输入端口
- 不推荐在自动化测试中使用

**验证连接**:
```typescript
// 检查连接线是否存在
const edgeExists = await page.locator('button[aria-label*="Edge from"]').count();
expect(edgeExists).toBeGreaterThan(0);
```

---

## 3. 运行和调试问题

### Q3.1: Workflow 运行一直处于 "Running" 状态怎么办？

**可能原因**:
1. LLM API 响应慢
2. 网络问题
3. 节点配置错误
4. 变量未正确传递

**解决方案**:
```typescript
// 使用轮询等待完成
async function waitForWorkflowCompletion(page, timeout = 60000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    // 检查是否完成
    const isRunning = await page.getByText('Running').isVisible().catch(() => false);
    if (!isRunning) {
      // 检查是否成功
      const isSuccess = await page.getByText('Run').isVisible().catch(() => false);
      if (isSuccess) {
        return 'success';
      }
    }
    
    // 等待 1 秒再检查
    await page.waitForTimeout(1000);
  }
  
  throw new Error('Workflow execution timeout');
}

// 使用
await waitForWorkflowCompletion(page, 60000); // 60秒超时
```

---

### Q3.2: 如何查看 Workflow 的执行详情？

**步骤**:
1. 运行 workflow 后，点击 "DETAIL" 或 "详情" 标签
2. 查看每个节点的执行状态
3. 查看节点的输入输出数据

**Playwright 代码**:
```typescript
// 点击详情标签
await page.getByText('DETAIL').or(page.getByText('详情')).click();

// 读取节点状态
const startNodeStatus = await page.locator('[data-node="start"]').getAttribute('data-status');
console.log('Start node status:', startNodeStatus);

// 读取节点输出
const llmOutput = await page.locator('[data-node="llm"] [data-output]').textContent();
console.log('LLM output:', llmOutput);
```

---

### Q3.3: 运行结果在哪里查看？

**结果位置**:
- **RESULT 标签页**: 显示最终输出
- **DETAIL 标签页**: 显示每个节点的详细信息
- **TRACING 标签页**: 显示执行追踪信息

**读取结果**:
```typescript
// 点击 RESULT 标签
await page.getByText('RESULT').click();

// 读取结果文本
const result = await page.locator('[data-testid="workflow-result"]').textContent();

// 或者更通用的方式
const resultPanel = page.locator('[role="tabpanel"]').filter({ hasText: 'RESULT' });
const resultText = await resultPanel.textContent();

console.log('Workflow result:', resultText);
```

---



## 4. ⭐ End 节点配置问题深度解析

### 问题背景
在实现"商品文案生成"测试用例时，遇到了 End 节点无法配置输出变量的问题。测试代码在（配置 End 节点输出变量）阶段持续超时，无法找到 "Variable name" 输入框和 "Set variable" 按钮。

### 问题现象
```typescript
// ❌ 失败的代码
const varNameInput = page.getByRole('textbox', { name: 'Variable name' });
await varNameInput.clear();
await varNameInput.fill('copywriting');
// Error: Timeout 30000ms exceeded. Element not found.
```

**观察到的现象**:
1. End 节点配置面板可以打开
2. 显示 "output variable" 标题
3. 但是**没有任何输入字段或按钮**
4. 测试代码一直等待元素出现，最终超时

### 问题根因分析

#### 第一步：MCP 浏览器探索
使用 Playwright MCP 工具导航到实际的 workflow 页面进行探索：

```typescript
// 使用 MCP 浏览器导航
await mcp_playwright_browser_navigate({
  url: "https://dify.xxx.com/app/f6e9a93d-a259-49c8-8558-aa0d30e3cbd3/workflow"
});

// 获取页面快照
await mcp_playwright_browser_snapshot();
```

**发现 1：End 节点配置面板结构**
```yaml
- generic [ref=e355]:
  - generic [ref=e357]: output variable
  - img [ref=e361] [cursor=pointer]  # ⚠️ 这是一个可点击的图标！
```

只有标题和一个图标按钮，**没有输入字段**！

#### 第二步：点击 + 按钮
```typescript
await mcp_playwright_browser_click({
  ref: "e361",
  element: "output variable 旁的添加按钮"
});
```

**发现 2：点击后显示配置字段**
```yaml
- generic [ref=e499]:
  - textbox "Variable name" [ref=e500]
  - generic [ref=e503] [cursor=pointer]:
    - img [ref=e505]
    - generic [ref=e514]: Set variable
  - img [ref=e516] [cursor=pointer]  # 删除按钮
```

**现在变量配置字段出现了！**

### 根本原因总结

🔑 **关键发现**：End 节点添加后，**默认不显示变量配置字段**！

End 节点的输出变量配置是一个**两阶段流程**：
1. **阶段 1**：点击 `+` 按钮添加输出变量槽位
2. **阶段 2**：在出现的字段中配置变量名和绑定源变量

这与其他节点（如 Start 节点）不同，其他节点的配置字段是默认显示的。

### 解决方案

#### 完整的 End 节点配置代码
```typescript
// 步骤 0: 点击 "output variable" 旁的 + 按钮来添加输出变量
// ⚠️ 这一步是必须的！End 节点默认不显示变量配置字段
const addOutputVarButton = page.locator('.p-1 > .remixicon').first();
await addOutputVarButton.click();
await page.waitForTimeout(500);
console.log('  ✓ 点击 + 按钮，显示变量配置字段');

// 步骤 1: 清空并输入输出变量名 "copywriting"
const varNameInput = page.getByRole('textbox', { name: 'Variable name' });
await varNameInput.clear();
await varNameInput.fill('copywriting');
await page.waitForTimeout(500);
console.log('  ✓ 输出变量名设置为: copywriting');

// 步骤 2: 点击 "Set variable" 按钮打开变量选择器
await page.getByText('Set variable').click();
await page.waitForTimeout(1000);
console.log('  ✓ 变量选择器已打开');

// 步骤 3: 等待变量选择器加载完成，应该能看到 LLM 节点的 text 变量
await page.waitForSelector('text=LLM', { timeout: 5000 });

// 步骤 4: 点击 LLM 节点下的 text 变量选项
const llmSection = page.locator('[role="tooltip"]').locator('text=LLM').locator('..');
const textVarOption = llmSection.locator('text=text').locator('..').locator('..').first();

try {
  await textVarOption.click({ timeout: 3000 });
  console.log('  ✓ 策略 1 成功：点击了 text 变量选项');
} catch (e) {
  // 备用策略 2: 直接在 tooltip 内查找并点击包含"text"的可点击元素
  console.log('  ⚠️ 策略 1 失败，尝试备用策略 2');
  const tooltip = page.locator('[role="tooltip"]');
  await tooltip.locator('div', { hasText: /^text$/ }).first().click({ timeout: 3000 });
}

await page.waitForTimeout(1000);
console.log('  ✓ LLM.text 变量已选择');

// 验证配置成功：检查 End 节点按钮是否显示变量信息
const endNodeButton = page.locator('button').filter({ hasText: /End/ }).filter({ hasText: /LLM/ });
const isConfigured = await endNodeButton.isVisible({ timeout: 3000 }).catch(() => false);

if (isConfigured) {
  console.log('✅ End 节点配置成功：copywriting → LLM.text\n');
} else {
  console.log('⚠️ End 节点配置可能未完全成功，继续测试\n');
}
```

### 关键选择器总结

| 元素 | 选择器 | 说明 |
|------|--------|------|
| **添加输出变量按钮** | `.p-1 > .remixicon` | ⚠️ 必须先点击才能显示配置字段 |
| 变量名输入框 | `getByRole('textbox', { name: 'Variable name' })` | 点击 + 后才出现 |
| 设置变量按钮 | `getByText('Set variable')` | 打开变量选择器 |
| 变量选择器容器 | `[role="tooltip"]` | Tooltip 弹出框 |
| LLM 节点分组 | `[role="tooltip"] >> text=LLM` | 变量按节点分组 |
| text 变量选项 | `locator('text=text').locator('..')` | 需要向上找到可点击的父元素 |

### 验证配置成功的方法

#### 方法 1：检查 End 节点按钮文本
```typescript
// 成功配置后，End 节点按钮会显示绑定的变量信息
// 格式：End [节点名] [变量名] [类型]
const endButtonText = await page.locator('button').filter({ hasText: /End/ }).textContent();
console.log('End node button:', endButtonText);
// 预期输出: "End LLM text string"
```

#### 方法 2：检查配置面板内容
```yaml
# 配置成功后的面板结构
- generic [ref=e499]:
  - textbox "Variable name" [ref=e500]: copywriting  # 显示变量名
  - generic [ref=e503]:
    - img [ref=e505]                    # LLM 图标
    - generic "LLM" [ref=e404]           # 节点名
    - img [ref=e405]                     # 连接线图标
    - generic "text" [ref=e408]          # 变量名
  - generic "string" [ref=e409]          # 变量类型
```

### 教训与启示

#### 1. 不要假设 UI 元素始终可见
- **错误假设**：End 节点打开后，配置字段应该自动显示
- **实际情况**：需要用户主动点击 `+` 按钮才会显示
- **教训**：在自动化测试中，必须完全模拟用户的真实操作流程

#### 2. MCP 浏览器是调试的利器
- **问题场景**：测试代码超时，不知道页面实际状态
- **解决方案**：使用 Playwright MCP 工具实时查看页面结构
- **价值**：
  - 查看实际的 DOM 结构
  - 发现隐藏的交互步骤
  - 验证选择器的准确性

#### 3. 多层级选择器需要谨慎处理
- **问题**：变量选项是嵌套的 div 结构，直接点击文本可能失败
- **解决**：使用 `locator('..')` 向上查找可点击的父元素
- **备用方案**：准备多个选择器策略，使用 try-catch 处理

#### 4. 参考已有测试用例的局限性
- **参考**：`03-knowledge-retrieval-rag.case.spec.ts` 使用 `configureEndNode` 辅助函数
- **问题**：该函数在 Case 04 中失败（元素拦截错误）
- **原因**：不同 workflow 的页面状态可能不同
- **教训**：辅助函数不是万能的，需要根据实际情况调整


---

## 5. ⭐ Playwright MCP 等待策略最佳实践

### MCP 等待的价值

在测试过程中，我们发现标准的 Playwright 等待机制有时不够，特别是：
1. 需要等待后台进程完成（如测试运行）
2. 需要观察页面状态变化
3. 需要在不干扰测试进程的情况下验证

这时 **Playwright MCP 的 `mcp_playwright_browser_wait_for`** 工具就非常有用。

### MCP 等待 vs Playwright 等待

#### Playwright 标准等待
```typescript
// 这些方法在测试代码中运行
await page.waitForTimeout(5000);        // 阻塞当前测试
await page.waitForSelector('text=Run'); // 等待元素出现
await page.waitForLoadState('networkidle'); // 等待网络空闲
```

**限制**：
- 在测试进程中执行，会阻塞测试流程
- 无法在测试运行时进行观察
- 不适合长时间等待（如 workflow 执行）

#### MCP 等待
```typescript
// 这个在 MCP 浏览器中运行，不干扰测试进程
await mcp_playwright_browser_wait_for({ time: 30 });

// 等待后可以立即查看页面状态
await mcp_playwright_browser_snapshot();
```

**优势**：
- **独立进程**：不干扰正在运行的测试
- **状态观察**：等待期间测试继续运行，等待后查看结果
- **长时间等待**：适合等待 30-90 秒的长操作
- **验证工具**：用于验证测试是否成功

### 实际应用场景

#### 场景 1：监控测试执行进度

**问题**：测试启动后，不知道当前执行到哪一步了

**解决方案**：
```typescript
// 1. 启动测试（后台运行）
await run_in_terminal({
  command: "npx playwright test src/cases/04-product-copywriting-generation.case.spec.ts 2>&1 | tee test.log",
  explanation: "运行测试",
  isBackground: true  // ⚠️ 后台运行
});

// 2. 使用 MCP 等待一段时间
await mcp_playwright_browser_wait_for({ time: 30 });

// 3. 检查测试输出
await run_in_terminal({
  command: "tail -50 test.log",
  explanation: "查看测试进度",
  isBackground: false
});
```
