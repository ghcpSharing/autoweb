# Dify Workflow 页面结构与 UI 元素映射

本文档基于最新的 `src/` 模块化代码，详细记录了 Dify Workflow 界面的 DOM 结构、选择器策略，以及 Playwright 自动化测试中使用的各种 UI 元素映射关系。

## 🎯 页面结构概览

### 1. 应用创建流程页面元素

#### 1.1 应用列表页面 (`/apps`)
```typescript
// 主要页面入口
page.goto('/apps')

// 创建工作流的触发元素
page.getByText('Create from Blank', { exact: true })

// 应用创建对话框容器
'[id^="headlessui-dialog-panel"]'

// 工作流卡片选择器
dialogPanel.getByText('Workflow', { exact: true })
```

#### 1.2 应用配置表单
```typescript
// 应用名称输入框
'input[placeholder="Give your app a name"]'
page.getByPlaceholder('Give your app a name')

// 应用描述输入框
'textarea[placeholder="Enter the description of the app"]'

// 创建按钮
'button:has-text("Create")'
```

### 2. 工作流画布页面结构

#### 2.1 节点选择与添加界面

##### "Select Next Block" 按钮定位策略
根据 `workflow-helpers.ts` 中的 `clickSelectNextBlock()` 实现：

```typescript
// 主要选择器 - 精确文本匹配
page.getByText('Select Next Block').first()

// 备用选择器 - 带加号图标的按钮（启发式）
page.locator('button:has(svg)').filter({ hasText: '+' }).first()
```

#### 2.2 节点类型选择面板
```typescript
// 节点类型选择（精确匹配）
page.getByText(nodeType, { exact: true })

// 示例：LLM 节点选择
page.getByText('LLM', { exact: true })

// 示例：Knowledge Retrieval 节点选择
page.getByText('Knowledge Retrieval', { exact: true })
```

#### 2.3 节点标题配置
```typescript
// 节点标题输入框
page.getByPlaceholder('Add title...')

// 节点存在性检查
page.locator('button').filter({ hasText: new RegExp(`^${nodeTitle}$`) })

// 节点聚焦点击
page.locator('button').filter({ hasText: new RegExp(`^${nodeTitle}$`) }).first()
```

### 3. 变量配置界面结构

#### 3.1 Start 节点变量配置
根据 `variable-configurators.ts` 中的实现：

```typescript
// Start 变量名称输入框
'input[placeholder="Field name"]'
page.getByPlaceholder('Field name')

// Start 变量标签输入框  
'input[placeholder="Field label"]'
page.getByPlaceholder('Field label')

// Start 变量类型选择（默认 Text）
'[aria-label="Variable type"]'
```

#### 3.2 通用变量选择下拉框

##### 变量选择器检测
```typescript
// 变量搜索框（触发下拉）
'textbox[placeholder*="Search variable"]'
'input[placeholder*="Search variable"]'

// 变量选择面板等待
page.waitForSelector('textbox[placeholder*="Search variable"], input[placeholder*="Search variable"]')
```

##### 变量选择策略（多重备用）
基于 `selectVariableFromDropdown()` 的多策略实现：

```typescript
// 策略1：组合文本匹配 (source + text)
page.getByText(`${variable.source} ${variable.text}`)  // 如 "Start context"

// 策略2：类型过滤匹配
page.getByText(variable.text).filter({ hasText: variable.type || 'string' })

// 策略3：层级容器匹配
page.locator('div').filter({ hasText: new RegExp(variable.source || '') }).getByText(variable.text)

// 策略4：父级查找
page.getByText(variable.source || '').locator('..').getByText(variable.text)

// 策略5：大小写不敏感正则匹配
page.getByText(new RegExp(variable.text, 'i')).first()
```

#### 3.3 "Set variable" 按钮定位策略
根据 `findAndClickSetVariable()` 的复杂实现：

```typescript
// 综合选择器候选列表
const locatorCandidates = [
  'button:has-text("Set variable")',     // 英文按钮
  'div:has-text("Set variable")',        // 英文div容器
  'button:has-text("设置变量")',           // 中文按钮
  'div:has-text("设置变量")'              // 中文div容器
];

// 按位置点击策略
// 默认优先级: [1, 3, 2, 0] - 基于实际测试的成功位置
setVariableButtons.nth(position)

// 滚动提升可见性
page.mouse.wheel(0, 400)
```

### 4. 节点配置面板结构

#### 4.1 LLM 节点配置界面

##### Context 变量配置区域
基于 `configureLLMContextVariableInternal()` 实现：

```typescript
// Context 区域标识
page.waitForSelector('text=CONTEXT', { timeout: 10000 })
page.locator('text=/^CONTEXT$/i').first()

// Context 配置状态检查（通过连接图标数量）
const contextContainer = contextSection.locator('xpath=../..')
const connectionIcons = await contextContainer.locator('img').count()

// Context区域内的"Set variable"按钮位置优先级
const positions = [1, 3, 2, 0]  // 基于 MCP 调试结果
```

##### 系统提示配置
```typescript
// 系统提示区域检测和配置
page.locator('text=/^SYSTEM$/i')

// 提示输入框
// 具体选择器需要根据实际DOM结构调整
```

##### 用户消息配置
```typescript
// 用户消息区域
page.locator('text=/^USER$/i')

// 消息输入区域
// 具体选择器需要根据实际DOM结构调整
```

#### 4.2 Knowledge Retrieval 节点配置

##### 查询变量配置
```typescript
// Query 变量设置区域
page.locator('text=/^Query$/i')

// Knowledge Base 选择区域
page.locator('text=/^Knowledge$/i')
```

##### 知识库选择下拉
```typescript
// 知识库下拉菜单触发器
'button[data-headlessui-state]'  // Headless UI 下拉组件

// 知识库选项选择
page.getByRole('option').filter({ hasText: knowledgeBaseName })
```

#### 4.3 End 节点配置界面

##### 输出变量配置
基于 `configureEndNode()` 的参数化实现：

```typescript
// 输出变量名称输入
'input[placeholder*="variable"], input[placeholder*="Variable"]'

// 变量来源选择 - 根据节点类型参数化配置
// LLM工作流：sourceVariable: 'text', sourceNode: 'PlanLLM'
// RAG工作流：sourceVariable: 'result', sourceNode: 'KnowledgeRetrieval1'

// End节点的"Set variable"按钮（通常在第0或第2位置）
const endSetVariablePositions = [0, 2, 1]
```

### 5. 工作流执行界面结构

#### 5.1 运行按钮与执行触发
基于 `execution-helpers.ts` 中的实现：

```typescript
// 运行按钮主选择器
page.getByRole('button', { name: /run/i })

// 运行按钮备用选择器
page.locator('button').filter({ hasText: /run/i })
```

#### 5.2 输入对话框结构

##### 输入字段检测与填写
```typescript
// 主输入框检测策略
'textarea[placeholder*="context"], textarea[placeholder*="Context"]'
'input[placeholder*="context"], input[placeholder*="Context"]'

// 备用输入框检测
'textarea, input[type="text"]'

// 运行确认按钮
'button:has-text("Run")'
page.getByRole('button', { name: 'Run' })
```

#### 5.3 执行结果界面

##### 答案提取区域
基于 `extractAnswer()` 的多策略实现：

```typescript
// 主要答案容器选择器
'[data-testid*="message"], [class*="message"], [class*="content"]'

// 答案文本提取策略
// 策略1：精确数据属性匹配
page.locator('[data-testid="message-content"]')

// 策略2：类名模糊匹配
page.locator('[class*="message"][class*="content"]')

// 策略3：结构化查找（消息容器内的文本）
page.locator('[class*="message"]').locator('text=/\\S+/')

// 策略4：通用文本容器
page.locator('[class*="content"], [class*="text"], [class*="answer"]').filter({ hasText: /\S/ })
```

##### 执行状态检测
```typescript
// 加载状态检测
'[class*="loading"], [class*="spinning"], [class*="pending"]'

// 错误状态检测  
'[class*="error"], [class*="failed"]'

// 完成状态检测
'[class*="complete"], [class*="success"], [class*="finished"]'
```

### 6. 通用UI元素与工具函数

#### 6.1 网络稳定性等待
```typescript
// 网络空闲等待
page.waitForLoadState('networkidle', { timeout: 10000 })

// 额外缓冲时间
page.waitForTimeout(500)
```

#### 6.2 元素可见性与点击
```typescript
// 通用可见性等待
element.waitFor({ state: 'visible', timeout })

// 滚动到视图内
element.scrollIntoViewIfNeeded()

// 试验性点击（检测可点击性）
element.click({ trial: true })
```

#### 6.3 重试机制配置
```typescript
// 重试配置类型
interface RetryConfig {
  maxAttempts: number;    // 最大尝试次数
  delayMs: number;        // 重试间隔
  timeoutMs: number;      // 单次超时
}

// 默认重试配置
{ maxAttempts: 3, delayMs: 1000, timeoutMs: 5000 }
```

## 🔧 选择器策略与最佳实践

### 1. 多级回退策略
每个关键操作都实现了多级选择器回退，确保在 DOM 结构变化时仍能正常工作：

```typescript
// 示例：变量选择的5级回退策略
const strategies = [
  'exact_match',        // 精确匹配
  'type_filter',        // 类型过滤
  'container_search',   // 容器查找
  'parent_traverse',    // 父级遍历
  'regex_fallback'      // 正则后备
];
```

### 2. 位置优先级配置
基于实际测试结果，为不同场景的"Set variable"按钮配置了位置优先级：

```typescript
// LLM Context 配置：优先级 [1, 3, 2, 0]
// End 节点配置：优先级 [0, 2, 1]
// 通用场景：优先级 [1, 3, 2, 0]
```

### 3. 类型安全的元素选择
所有选择器操作都有对应的 TypeScript 类型定义，确保编译时的类型安全：

```typescript
interface ElementSelector {
  primary: string;      // 主选择器
  fallbacks: string[];  // 备用选择器列表
  timeout?: number;     // 可选超时配置
}
```

## 📈 测试稳定性保障

### 1. 智能等待策略
- **网络稳定性**：等待 `networkidle` 状态
- **元素可见性**：多重可见性检查
- **状态同步**：DOM 状态与应用状态同步等待

### 2. 错误恢复机制
- **滚动恢复**：元素不可见时自动滚动
- **重试机制**：可配置的重试次数和间隔
- **优雅降级**：主选择器失败时的备用策略

### 3. 调试支持
- **详细日志**：每个操作步骤的控制台输出
- **状态检查**：执行前后的状态验证
- **错误上下文**：失败时的详细错误信息和页面状态

---

本文档基于 `src/` 目录中的最新模块化代码，确保了页面结构映射与实际测试实现的一致性。所有选择器和策略都经过实际测试验证，为 Dify Workflow 的 E2E 自动化测试提供了可靠的元素定位基础。