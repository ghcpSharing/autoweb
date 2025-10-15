# 知识检索节点 (Knowledge Retrieval) - 自动化配置与测试指南

> 基于模块化 Playwright 测试框架，详细描述 Dify Workflow 知识检索节点的配置、使用和测试策略。支持 RAG（检索增强生成）工作流的端到端自动化验证。

---

## 🎯 功能定位与模块化支持

### 核心功能
- **查询检索**：将上游输入（如用户问题）作为查询语句，对已选知识库执行向量/关键词检索
- **结果返回**：返回若干文档片段，包含文本内容、来源ID、匹配分数等元数据
- **RAG 集成**：输出变量可被后续 LLM 节点引用，实现检索增强生成

### 测试框架集成
```typescript
// 自动化配置支持
import { configureKnowledgeRetrievalNode, type KnowledgeRetrievalConfig } from '../src';

const config: KnowledgeRetrievalConfig = {
  queryVariable: 'question',
  knowledgeBase: 'autogen.txt'
};

await configureKnowledgeRetrievalNode(page, 'KnowledgeRetrieval', config);
```

---

## 🏗️ 模块化配置接口

### TypeScript 类型定义
```typescript
export interface KnowledgeRetrievalConfig {
  queryVariable: string;    // 查询变量名（通常来自 Start 节点）
  knowledgeBase: string;    // 知识库名称（必须已存在并就绪）
}
```

### 预设配置（COMMON_CONFIGS）
```typescript
const KNOWLEDGE_RETRIEVAL_RAG = {
  knowledgeRetrieval: {
    title: 'KnowledgeRetrieval',
    queryVariable: 'question',
    knowledgeBase: 'autogen.txt'
  },
  // ...其他配置
};
```

---

## 🔧 自动化配置流程

### 1. 节点创建与配置
```typescript
/**
 * 完整的知识检索节点配置流程
 * 1. 检查节点是否存在，不存在则创建
 * 2. 选择知识库
 * 3. 配置查询变量绑定
 */
export async function configureKnowledgeRetrievalNode(
  page: Page,
  title: string,
  config: KnowledgeRetrievalConfig
): Promise<boolean>
```

### 2. 知识库选择策略
```typescript
// 智能知识库选择
async function selectKnowledgeBase(page: Page, knowledgeBaseName: string) {
  // 1. 检查是否已选择
  const existingChip = page.locator(`text=/${knowledgeBaseName}/i`).first();
  
  // 2. 点击添加按钮
  const plusIcon = page.locator('.p-1 > .remixicon').first();
  
  // 3. 在对话框中选择知识库
  const dialog = page.getByRole('dialog').filter({ 
    hasText: /Select reference Knowledge|选择引用知识库/ 
  });
  
  // 4. 确认选择
  const addBtn = dialog.getByRole('button', { name: /Add|添加/ });
}
```

### 3. 查询变量配置
```typescript
// 使用模块化变量配置器
async function configureKnowledgeRetrievalQueryVariable(
  page: Page, 
  queryVariableName: string
) {
  const queryVariable: VariableSelector = {
    text: queryVariableName,
    type: 'string',
    source: 'Start'
  };
  
  // 使用健壮的变量选择策略
  return await configureVariable(page, queryVariable, 'bySection', RETRY_CONFIGS.STANDARD);
}
```

---

## 🧪 完整测试用例实现

### RAG 工作流端到端测试
```typescript
test('Knowledge Retrieval RAG Workflow', async ({ page }) => {
  const config = COMMON_CONFIGS.KNOWLEDGE_RETRIEVAL_RAG;
  
  // 1. 创建工作流
  await createBlankWorkflow(page, config.app);
  
  // 2. 配置 Start 变量
  await configureStartVariable(page, config.startVariable.name, config.startVariable.label);
  
  // 3. 配置知识检索节点
  await configureKnowledgeRetrievalNode(page, config.knowledgeRetrieval.title, {
    queryVariable: config.knowledgeRetrieval.queryVariable,
    knowledgeBase: config.knowledgeRetrieval.knowledgeBase
  });
  
  // 4. 配置 LLM 节点（使用检索结果）
  await configureLLMNode(page, config.llm.title, {
    systemPrompt: config.llm.systemPrompt,  // 包含 {#context#} 占位符
    userMessage: config.llm.userMessage,
    contextVariable: config.llm.contextVariable  // 'result' from Knowledge Retrieval
  });
  
  // 5. 配置 End 节点
  await configureEndNode(page, config.endVariable);
  
  // 6. 执行工作流（增加 RAG 处理时间）
  const result = await runWorkflowAndWaitForSuccess(page, config.testInput, config.validation, {
    fixedWaitMs: 10000  // RAG 处理需要更长时间
  });
  
  // 7. 验证结果
  expect(result.success).toBe(true);
  expect(result.answer.toLowerCase()).toMatch(/autogen|agent|system|ai/);
});
```

---

## 🔍 变量流与数据绑定

### 数据流图
```
Start.question → Knowledge Retrieval → result (array[object]) → LLM (context) → answer
```

### 关键绑定点
```typescript
// 1. 查询变量绑定
queryVariable: 'question'  // 来自 Start 节点

// 2. 上下文变量绑定（在 LLM 节点中）
contextVariable: 'result'  // Knowledge Retrieval 的输出

// 3. 系统提示中的占位符
systemPrompt: `
You are a helpful assistant. Use the provided context to answer questions.

Context:
{#context#}  // 自动替换为检索结果
`

// 4. End 节点输出绑定
sourceNode: 'AnswerSynthesizer',
sourceField: 'text'  // LLM 的文本输出
```

---

## 🎛️ 高级配置选项

### 1. 重试策略配置
```typescript
import { RETRY_CONFIGS } from '../src';

// 针对知识库选择的重试策略
await configureVariable(page, queryVariable, 'bySection', RETRY_CONFIGS.PATIENT);
```

### 2. 错误处理模式
```typescript
// 前置条件检查
const validationConfig = {
  minAnswerLength: 15,          // 最小答案长度
  maxWaitTimeMs: 10000,        // 最大等待时间
  requireKnowledgeBase: true   // 必须配置知识库
};
```

### 3. 多策略选择器
```typescript
// 支持多种变量选择策略
await configureVariable(page, variable, 'byPosition');  // 按位置选择
await configureVariable(page, variable, 'byValue');     // 按值匹配
await configureVariable(page, variable, 'bySection');   // 按区域选择
```

---

## 🚨 常见问题与解决方案

### 1. Embedding Provider 未配置
**错误**：`'NoneType' object has no attribute 'provider'`

**解决方案**：
```typescript
// 前置检查知识库状态
beforeEach(async () => {
  // 确认知识库 embedding model 已设置且状态为 READY
  // 这通常需要在 Dify 后台预先配置
});
```

### 2. 输入长度限制
**错误**：`"question in input form must be less than 48 characters"`

**解决方案**：
```typescript
const testInput = {
  text: 'What are agent types?'  // 确保 < 48 字符
};

// 在配置中验证输入长度
if (config.testInput.text.length >= 48) {
  throw new Error('Test input exceeds 48 character limit');
}
```

### 3. 知识库选择失败
```typescript
// 健壮的知识库选择验证
async function validateKnowledgeBaseSelection(page: Page, knowledgeBaseName: string) {
  const chip = page.locator(`text=/${knowledgeBaseName}/i`).first();
  await expect(chip).toBeVisible({ timeout: 5000 });
}
```

---

## 📊 断言与验证策略

### 核心断言类型
```typescript
interface KnowledgeRetrievalAssertions {
  hasResultFragments: boolean;      // 检索到片段 ≥ 1
  hasNoResult: boolean;             // 空结果提示
  answerUsesFragments: boolean;     // 答案使用了检索片段
  answerDeclaresNoHit: boolean;     // 答案声明未找到相关信息
  noHallucinationOnMiss: boolean;   // 未命中时不产生幻觉
}
```

### 实际验证代码
```typescript
// 1. 检索结果验证
expect(result.success).toBe(true);
expect(result.answer).toBeTruthy();
expect(result.answer.length).toBeGreaterThan(config.validation.minAnswerLength);

// 2. 内容相关性验证
expect(result.answer.toLowerCase()).toMatch(/autogen|agent|system|ai/);

// 3. 时间性能验证
expect(result.executionTimeMs).toBeLessThan(30000);  // 30秒内完成

// 4. 知识库命中验证
const containsKnowledgeKeywords = /autogen|multi-agent|conversation/i.test(result.answer);
expect(containsKnowledgeKeywords).toBe(true);
```

---

## 🔧 UI 选择器策略

### 关键元素定位
```typescript
const selectors = {
  // 节点选择
  knowledgeRetrievalNode: page.getByText('Knowledge Retrieval').first(),
  
  // 知识库选择
  addKnowledgeBaseButton: page.locator('.p-1 > .remixicon').first(),
  knowledgeBaseDialog: page.getByRole('dialog').filter({ 
    hasText: /Select reference Knowledge|选择引用知识库/ 
  }),
  
  // 变量绑定验证
  queryVariableBinding: page.getByText('Start / question'),
  contextVariableDisplay: page.getByText(/result.*array\[object\]/i),
  
  // 执行状态
  nodeSuccess: page.getByText('SUCCESS'),
  nodeFailure: page.getByText('FAILED')
};
```

### 国际化支持
```typescript
// 中英文兼容的选择器
const title = await page.getByText('知识检索').or(page.getByText('Knowledge Retrieval')).first();
const addButton = dialog.getByRole('button', { name: /Add|添加/ });
const emptyResult = page.getByText(/未找到|no related/i);
```

---

## 🚀 扩展与优化

### 1. 性能监控
```typescript
// 添加性能指标收集
const startTime = Date.now();
const result = await runWorkflowAndWaitForSuccess(page, testInput);
const executionTime = Date.now() - startTime;

console.log(`Knowledge Retrieval execution time: ${executionTime}ms`);
```

### 2. 批量测试支持
```typescript
// 支持多个查询的批量测试
const testQueries = [
  'What are agent types?',
  'How does autogen work?',
  'Explain multi-agent conversation'
];

for (const query of testQueries) {
  await runSingleQueryTest(page, query);
}
```

### 3. 知识库管理
```typescript
// 知识库状态检查和管理
interface KnowledgeBaseStatus {
  name: string;
  status: 'READY' | 'PROCESSING' | 'ERROR';
  embeddingProvider: string;
  documentCount: number;
}

async function validateKnowledgeBaseReady(knowledgeBaseName: string): Promise<boolean> {
  // 通过 API 或 UI 检查知识库状态
}
```

---

## 📋 最佳实践总结

### 1. 配置管理
- ✅ 使用 `COMMON_CONFIGS` 预设配置
- ✅ 类型安全的配置接口
- ✅ 环境特定的配置覆盖

### 2. 错误处理
- ✅ 多策略重试机制
- ✅ 详细的错误日志记录
- ✅ 前置条件验证

### 3. 测试设计
- ✅ 端到端 RAG 工作流验证
- ✅ 边界条件和错误场景测试
- ✅ 性能和稳定性监控

### 4. 维护性
- ✅ 模块化组件设计
- ✅ 可配置的选择器策略
- ✅ 国际化支持

这个更新的文档全面反映了最新模块化测试框架中知识检索节点的实现，提供了完整的配置、测试和维护指南。# 2. 典型配置字段（右侧面板）
| 字段 | 说明 | 备注 / 选择器建议 |
| ---- | ---- | ---------------- |
| 查询变量 (Query Variable) | 绑定 Start 节点的字符串变量，如 `question` | 通常以面包屑形式 `Start / question` 展示；可用 `getByText('Start / question')` |
| 知识库选择 (Knowledge Base) | 下拉或列表选择一个已存在的知识库 | 选择后显示名称 + 标签（如"output-autogen.txt... ECO · INVERTED"）|
| 召回数 / Top-K (若存在) | 限定返回片段数量 | 文本框或数字步进控件；未出现则在当前版本忽略 |
| 返回变量 (Output) | 实际输出变量名为 `result` (array[object]) | 包含检索片段的数组结构 |

> **前置条件**：知识库必须已配置 embedding provider 且状态为 READY，否则会出现 `'NoneType' object has no attribute 'provider'` 错误。Retrieval）页面与测试要点

> 目的：描述 Dify Workflow 中“知识检索”节点的界面结构、交互行为、变量流、典型失败模式与 Playwright 自动化选择器策略，支撑用例 03（知识库检索 + LLM 回答）以及后续扩展测试。

---
## 1. 功能定位
- 将上游输入（通常是用户问题 `question`）作为查询语句，对已选知识库执行检索（向量 / 倒排等内部策略）。
- 返回若干文档片段（含文本片段、来源 ID/文件名、匹配分数等元数据 — 具体字段取决于平台版本）。
- 输出变量可被后续 LLM、Code、Agent 等节点引用，用于 RAG 生成或事实核验。

## 2. 典型配置字段（右侧面板）
| 字段 | 说明 | 备注 / 选择器建议 |
| ---- | ---- | ---------------- |
| 查询变量 (Query Variable) | 绑定 Start 节点的字符串变量，如 `question` | 通常以面包屑形式 `Start / question` 展示；可用 `getByText('Start / question')` |
| 知识库选择 (Knowledge Base) | 下拉或列表选择一个已存在的知识库 | 选择后显示名称 + 标签（如“经济 - 倒排索引”）|
| 召回数 / Top-K (若存在) | 限定返回片段数量 | 文本框或数字步进控件；未出现则在当前版本忽略 |
| 返回变量 (Output) | 系统内部命名（例如自动生成） | 暂无显式 UI 可更名时忽略 |

> 版本差异：若未来加入“检索模式 (向量/关键词)”等，下方测试策略需同步扩展。

## 3. 变量与数据流
```
Start.question  --(绑定为查询)-->  知识检索节点  --result(array[object])-->  下游 LLM
```
- 实际输出变量名为 `result`（类型：array[object]），包含文档片段集合。
- LLM 节点中通过 context 字段引用：在系统提示中使用 `{#context#}` 占位符。
- 变量引用语法：`{{#Start.question#}}` (用户消息), `{#context#}` (系统提示中的检索结果)。

## 4. 运行期日志结构（观察到的通用模式）
| 区域 | 可能内容 | 自动化抓取策略 |
| ---- | -------- | -------------- |
| 节点执行状态 | SUCCESS / FAILED | `getByText('SUCCESS')` 限定节点容器范围（必要时先点击节点）|
| 片段列表 | 多行文本，每行含片段开头或来源名 | 以知识库文件名关键字搜索，如 `output-autogen` |
| 空结果 | 可能提示“未找到相关内容” | 断言用于 R3（未命中场景）|

## 5. Playwright 选择器策略
| 目标 | 推荐写法 | 说明 |
| ---- | -------- | ---- |
| 选中节点 | `page.getByText('知识检索').first()` | 若英文环境：回退 `getByText('Knowledge Retrieval')` |
| 查询变量绑定验证 | `page.getByText('Start / question')` | 存在即可视为绑定成功 |
| 选择知识库 | `page.getByText('output-autogen', { exact: false })` | 模糊匹配避免后缀变化 |
| Context 设置验证 | `page.getByText(/result.*array\[object\]/i)` | LLM 节点中检查 context 已绑定 Knowledge Retrieval 结果 |
| End 节点输出变量 | `page.getByRole('textbox', { name: 'Variable name' }).fill('answer')` | 设置 End 节点输出变量名 |
| 片段命中检测 | `page.getByText(/output-autogen/i)` 或统计包含关键短语的段落 | 需在节点日志上下文中执行 |
| 空结果检测 | `page.getByText(/未找到|no related/i)` | 中英文兼容 |
| 输入长度检查 | 确保测试输入 `< 48` 字符 | 避免 "question in input form must be less than 48 characters" 错误 |

## 6. 典型自动化步骤片段
```ts
// 1. 添加节点（若不存在）
await page.getByPlaceholder('Search block').waitFor();
await page.getByText('知识检索').or(page.getByText('Knowledge Retrieval')).click();

// 2. 绑定查询变量（如果需要手工选择）
// 观察版本：如果 UI 自动推断，可跳过。否则：
//  - 点击变量选择框
//  - 选择 Start/question

// 3. 选择知识库
await page.getByText('output-autogen', { exact: false }).click();

// 4. 验证已显示所选库标签
await expect(page.getByText(/output-autogen/i)).toBeVisible();

// 5. 配置 LLM context（在 LLM 节点中）
await page.getByText('Set variable').click(); // context 部分
await page.getByText('resultarray[object]').click(); // 选择 Knowledge Retrieval 的 result

// 6. 设置 End 节点输出变量
await page.getByRole('textbox', { name: 'Variable name' }).fill('answer');
await page.getByText('Set variable').click(); // End 节点
await page.getByText('textstring').click(); // 选择 LLM 的 text 输出
```

## 7. 断言模式
| 断言 | 描述 |
| ---- | ---- |
| hasResultFragments | 片段 >=1；用于命中用例 R1/R2 |
| hasNoResult | 空结果提示；用于 R3 |
| answerUsesFragments | Answer 中出现片段关键词集合之一 |
| answerDeclaresNoHit | Answer 中出现“未在知识库/未找到”类短语 |
| noHallucinationOnMiss | 未命中时 Answer 不包含知识库关键词集合 |

## 8. 边界与失败模式
| 场景 | 现象 | 建议处理 |
| ---- | ---- | -------- |
| 未选择知识库直接运行 | 节点失败或返回空 | 在日志中捕获 error_message；测试做宽松记录 |
| **Embedding Provider 未配置** | **错误：`'NoneType' object has no attribute 'provider'`** | **前置检查：确认知识库 embedding model 已设置且状态 READY** |
| 知识库被删除 | 选择器仍显示旧名称但运行失败 | 触发 FAIL -> 记录并截图 |
| 查询为空 | 检索返回空 | 在 Answer 中提示提供有效问题 |
| **输入超长度** | **UI 错误："question in input form must be less than 48 characters"** | **测试输入限制在 <48 字符** |
| Top-K 超范围 | UI 截断或报错 | 记录实际行为，不立即 fail |



## 11. 自动化可扩展点
- 后续可统计：命中率 (R1/R2 成功片段出现次数 / 总运行数)。
- 收集片段长度、模型响应长度、是否声明来源（可在 LLM Prompt 中要求列出 `Sources:`）。
- 引入更严格验证：解析 DSL / 后端 API 获取结构化检索结果而非 UI 文本。

## 12. 维护说明
- 若 UI 增加 data-testid，请优先迁移到该属性。
- 一旦知识库名称改动，需要同步：
  1. 本文档中的示例名称
  2. 测试用例断言关键字集合
- 若未来支持多库合并检索，需新增：
  - 多库选择 UI 行为
  - 融合/去重逻辑验证用例

---
**结论：** 本文档将“知识检索”节点的操作步骤、元素定位与断言契约固化，供 Playwright 测试和后续自动生成脚本复用。若运行中发现 DOM 结构差异，请回填更新。
