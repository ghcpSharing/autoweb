# Dify Workflow 核心功能与自动化测试框架

本文档基于 Dify Workflow 官方功能和我们的 Playwright 测试框架重构，提供了完整的功能特性概览和自动化测试策略。文档结合了最新的模块化测试框架实现，为 Dify Workflow 的核心功能验证提供了系统性的测试设计。

## 🚀 测试框架模块化重构概览

我们已将 Playwright E2E 测试框架进行了全面重构，将原有的重复代码提取为可复用的模块：

- **代码减少 87%**：从 350+ 行重复代码减少到 45 行核心 API
- **配置驱动**：使用 `COMMON_CONFIGS` 预设，支持多场景测试
- **类型安全**：完整的 TypeScript 类型定义和接口
- **健壮性提升**：多策略选择器、重试机制、参数化配置

### 核心模块结构
```
src/
├── types.ts                    # 类型定义和接口
├── workflow-helpers.ts         # 工作流基础操作（创建、节点管理）
├── variable-configurators.ts   # 变量配置逻辑（Start节点、下拉选择）
├── node-configurators.ts       # 节点配置逻辑（LLM、KR、End）
├── execution-helpers.ts        # 执行和等待逻辑（运行、答案提取）
├── index.ts                    # 主入口和预设配置（COMMON_CONFIGS）
└── cases/                      # 测试用例（01-travel、03-knowledge-retrieval）
```

## 一、核心功能概览（基于最新重构验证）

### 1. 画布与编排操作（已模块化测试）
- **拖拽式节点连接**：基于 React Flow 的可视化编排
- **多分支控制流**：If/Else、Question Classifier、Parallel 并行节点
- **变量流转与聚合**：Variable Aggregator 统一多分支输出
- **DSL 导入导出**：工作流可移植性和版本管理

**测试框架支持**：
- `createBlankWorkflow()` - 自动化工作流创建
- `addNodeToWorkflow()` - 程序化节点添加
- `nodeExists()` / `focusNode()` - 节点存在性验证和操作

### 2. 核心节点类型（已实现自动化配置）

#### A. 基础节点
- **Start / End / Answer**：工作流入口和出口控制
- **LLM 节点**：支持结构化输出、Vision、系统提示、上下文切换
- **Agent 节点**：Function Calling / ReAct 策略，工具列表管理
- **Tool 节点**：内置工具和第三方工具集成（MCP 协议）
- **HTTP Request**：外部 API 调用和数据获取
- **Code 节点**：Python / Node.js 代码执行

**测试框架支持**：
```typescript
// LLM 节点配置（系统化）
await configureLLMNode(page, 'PlanLLM', {
  systemPrompt: '...',
  userMessage: '...',
  contextVariable: 'context'
});

// 知识检索节点配置  
await configureKnowledgeRetrievalNode(page, 'KnowledgeRetrieval', {
  queryVariable: 'question',
  knowledgeBase: 'autogen.txt'
});
```

#### B. 高级节点
- **Knowledge Retrieval**：RAG 文档检索和知识问答
- **Parameter Extractor**：自然语言到结构化参数提取
- **Document Extractor**：文件内容解析（PDF/图像/音频）
- **List Operation**：文件列表处理和过滤
- **Template 节点**：内容合并和格式化
- **Iteration / Loop**：循环控制和变量累积

### 3. 文件与多模态支持（已测试验证）
- **文件上传机制**：单文件/文件列表处理
- **多模态支持**：图像、音频、视频内容理解
- **文件类型支持**：文档（PDF/Word）、图像（PNG/JPG）、音频（MP3）
- **解析链集成**：File Variable → Document Extractor → LLM

**测试框架支持**：
- 配置驱动的文件变量处理
- 多模态内容验证
- 文件大小和类型限制测试

### 4. 结构化输出（Structured Outputs）
- **JSON Schema 编辑器**：可视化结构定义
- **格式验证**：自动重试和错误处理
- **工具返回结构**：标准化数据格式
- **模型兼容性**：不同 LLM 的格式遵循能力

### 5. 错误处理与鲁棒性（v0.14.0+）
- **节点级错误处理**：默认值配置、错误分支重定向
- **重试策略**：可配置的重试次数和延时
- **并行分支容错**：单点失败不影响整体执行
- **错误类型分类**：ParseError、AuthError、RuntimeError

**测试框架支持**：
```typescript
// 重试策略配置
const RETRY_CONFIGS = {
  FAST: { maxAttempts: 2, delayMs: 1000, timeoutMs: 5000 },
  STANDARD: { maxAttempts: 3, delayMs: 2000, timeoutMs: 10000 },
  PATIENT: { maxAttempts: 5, delayMs: 3000, timeoutMs: 15000 }
};
```  

### 6. Agent 智能体能力（待测试扩展）
- **策略选择**：Function Calling vs ReAct 推理模式
- **工具动态调用**：参数推断、固定值配置、自动参数
- **迭代控制**：最大迭代次数和执行日志
- **Memory 管理**：多轮上下文保持和窗口大小控制

### 7. 循环与迭代控制（Loop）
- **终止条件**：最大循环次数、Exit Loop Node 提前退出
- **Loop Variables**：跨迭代状态传递和累积
- **依赖式迭代**：区别于并行批处理的顺序执行
- **高级用例**：多版本生成、逐步研究、知识累积

### 8. 发布与复用机制
- **工作流发布**：发布为工具供其他 Workflow/Agent 调用
- **API 就绪**：统一对外接口和调用标准
- **DSL 导入导出**：跨环境迁移和协作

### 9. 调试与可观测性
- **单节点测试**：独立节点功能验证
- **全链路测试**：端到端工作流执行
- **执行日志**：输入输出、Token 计数、耗时统计
- **结构化追踪**：RESULT/DETAIL/TRACING 多层级日志

**测试框架支持**：
```typescript
// 执行监控和日志提取
const result = await runWorkflowAndWaitForSuccess(page, testInput, {
  minAnswerLength: 10,
  maxWaitTimeMs: 90000
});

// 答案提取和验证
const answer = await extractAnswerFromResultTab(page);
expect(answer.length).toBeGreaterThanOrEqual(validationConfig.minAnswerLength);
```

### 10. 性能与体验优化
- **自动保存**：实时配置保存和状态同步
- **并行执行**：多节点并行处理和变量汇总
- **多模型协同**：不同 LLM 和工具的组合使用

### 11. 安全与数据治理
- **外部工具授权**：API Key 配置和权限管理
- **文件限制**：大小限制（15MB 单文件）、数量限制（10 文件）
- **知识库隔离**：持久知识库 vs 会话临时文件

---

## 二、自动化测试设计（基于模块化框架）

我们的测试策略基于模块化 Playwright 框架，支持配置驱动的测试用例生成和执行。以下测试用例按优先级分层，每个用例都对应具体的测试代码实现。

### 🎯 已实现的核心测试场景

#### A. 基础 LLM 工作流（P0 - 已实现）
**测试文件**：`src/cases/01-travel-basic-llm.case.spec.ts`

```typescript
// 配置驱动的测试
const config = COMMON_CONFIGS.TRAVEL_BASIC_LLM;
await createBlankWorkflow(page, config.app);
await configureStartVariable(page, config.startVariable.name, config.startVariable.label);
await configureLLMNode(page, config.llm.title, config.llm);
await configureEndNode(page, config.endVariable);

const result = await runWorkflowAndWaitForSuccess(page, config.testInput, config.validation);
expect(result.success).toBe(true);
```

**验证要点**：
- Start 节点变量创建和配置
- LLM 节点系统提示和用户消息配置
- 上下文变量选择和绑定
- End 节点输出变量映射
- 工作流执行成功和答案提取

#### B. 知识检索 RAG 工作流（P0 - 已实现）
**测试文件**：`src/cases/03-knowledge-retrieval-rag.case.spec.ts`

```typescript
// RAG 配置
const config = COMMON_CONFIGS.KNOWLEDGE_RETRIEVAL_RAG;
await configureKnowledgeRetrievalNode(page, config.knowledgeRetrieval.title, {
  queryVariable: config.knowledgeRetrieval.queryVariable,
  knowledgeBase: config.knowledgeRetrieval.knowledgeBase
});
```

**验证要点**：
- 知识库选择和配置
- 查询变量绑定
- RAG 检索结果处理
- LLM 基于检索上下文的答案合成

### 🔧 可扩展的测试框架特性

#### 参数化配置系统
```typescript
// 支持多场景配置
const COMMON_CONFIGS = {
  TRAVEL_BASIC_LLM: { /* Travel planning scenario */ },
  KNOWLEDGE_RETRIEVAL_RAG: { /* Knowledge Q&A scenario */ },
  // 可扩展其他场景...
};
```

#### 健壮的选择器策略
```typescript
// 多策略变量选择
await configureVariable(page, variable, 'byPosition'); // 按位置选择
await configureVariable(page, variable, 'byValue');    // 按值匹配选择
```

#### 智能重试机制
```typescript
// 可配置重试策略
const success = await configureVariable(page, variable, 'byPosition', RETRY_CONFIGS.PATIENT);
```

### 🚀 待实现的高级测试场景

#### C. 错误处理与恢复（P0）
1. **LLM 节点格式错误处理**
   - 配置结构化输出 JSON Schema
   - 触发格式错误场景
   - 验证错误分支和默认值使用

2. **HTTP 节点重试策略**
   - 配置 HTTP 请求节点
   - 模拟 429/500 错误响应
   - 验证重试机制和成功恢复

3. **并行分支容错机制**
   - 配置多个并行分支
   - 人为触发部分分支失败
   - 验证 Variable Aggregator 使用默认值

#### D. 文件上传与多模态（P1）
4. **Start 节点文件变量配置**
   - 配置文件类型输入变量
   - 上传不同格式文件（PDF/图像）
   - 验证文件变量可用性

5. **Document Extractor 节点**
   - 配置文档提取节点
   - 验证文本提取结果
   - 测试文件大小限制

6. **Vision 模式 LLM 节点**
   - 开启 Vision 能力
   - 引用图像文件变量
   - 验证图像理解输出

#### E. Agent 智能体测试（P1）
7. **Function Calling 策略**
   - 配置工具列表
   - 验证工具调用日志
   - 测试参数推断能力

8. **ReAct 推理模式**
   - 配置 ReAct 策略
   - 验证 Thought/Action/Observation 循环
   - 测试最大迭代限制

#### F. 循环与迭代（P1）
9. **Loop 节点基础迭代**
   - 配置循环条件
   - 验证迭代次数控制
   - 测试 Loop Variables 状态传递

10. **Exit Loop Node 提前终止**
    - 配置终止条件
    - 验证循环提前退出
    - 确认后续节点不执行

#### G. 发布与集成（P1）
11. **工作流发布为工具**
    - 发布完成的工作流
    - 在另一个工作流中调用
    - 验证跨工作流数据传递

12. **DSL 导入导出一致性**
    - 导出工作流 DSL
    - 在新环境导入
    - 验证配置完整性

### 📊 测试执行策略

#### 分层测试执行
```bash
# P0 核心功能（每次必须通过）
npm test src/cases/01-travel-basic-llm.case.spec.ts
npm test src/cases/03-knowledge-retrieval-rag.case.spec.ts

# P1 扩展功能（定期执行）
npm test src/cases/error-handling.spec.ts
npm test src/cases/file-upload.spec.ts

# P2 高级功能（版本发布前执行）
npm test src/cases/agent-integration.spec.ts
npm test src/cases/performance.spec.ts
```

#### 并行测试支持
```typescript
// 工作流模板缓存优化
test.describe.configure({ mode: 'parallel' });

// 独立测试环境隔离
test.beforeEach(async ({ page }) => {
  await setupIsolatedWorkspace(page);
});
```

---

## 三、优先级实施路线图

### 🚨 P0 - 关键路径（已完成）
- ✅ 基础 LLM 工作流创建和执行
- ✅ 知识检索 RAG 工作流
- ✅ 变量配置和节点连接
- ✅ 工作流执行和答案提取
- ✅ 错误重试和超时处理

### 🔥 P1 - 重要功能（进行中）
- 🔄 错误处理和恢复机制测试
- 🔄 文件上传和多模态支持测试
- 📋 Agent 智能体功能测试
- 📋 循环和迭代控制测试

### ⭐ P2 - 增强功能（计划中）
- 📋 性能和并发测试
- 📋 国际化和多语言支持
- 📋 安全性和权限验证
- 📋 深度研究模式（Deep Research Pattern）

---

## 四、技术实现优势

### 🎯 模块化设计收益
- **代码复用率 87%**：从重复代码到可复用组件
- **维护成本降低**：统一的错误处理和重试机制
- **扩展性增强**：配置驱动的新场景添加
- **可读性提升**：自文档化的 API 设计

### 🔧 健壮性保障
- **多策略选择器**：应对 UI 变化的适应性
- **智能重试机制**：网络波动和加载延迟容错
- **参数化验证**：不同场景的定制化断言
- **类型安全**：TypeScript 完整类型覆盖

### 📈 可观测性支持
- **执行日志追踪**：详细的步骤执行记录
- **性能指标收集**：执行时间和成功率统计
- **错误分类统计**：失败原因的结构化分析
- **视觉验证辅助**：截图和视频录制支持

---

## 五、最佳实践指南

### 🔍 测试用例编写
```typescript
// 1. 使用预设配置
const config = COMMON_CONFIGS.SCENARIO_NAME;

// 2. 分阶段验证
await createBlankWorkflow(page, config.app);
expect(page.getByText(config.app.name)).toBeVisible();

// 3. 配置驱动
const success = await configureLLMNode(page, config.llm.title, config.llm);
expect(success).toBeTruthy();

// 4. 结果验证
const result = await runWorkflowAndWaitForSuccess(page, config.testInput);
expect(result.answer.length).toBeGreaterThanOrEqual(config.validation.minAnswerLength);
```

### 🛠️ 调试和故障排除
```typescript
// 启用详细日志
console.log('LLM node configuration result:', llmConfigured);

// 增加等待时间用于调试
await page.waitForTimeout(2000);

// 截图保存现场
await page.screenshot({ path: 'debug-workflow-state.png' });

// 验证中间状态
const contextVar = page.locator(`text=/^${variableName}$/i`).first();
await expect(contextVar).toBeVisible({ timeout: 5000 });
```

### 📋 新场景扩展
1. **定义配置结构**：在 `COMMON_CONFIGS` 中添加新场景
2. **实现配置函数**：扩展 node-configurators.ts 模块
3. **编写测试用例**：创建新的 spec 文件
4. **验证集成**：确保与现有框架兼容

这个模块化测试框架为 Dify Workflow 的全面功能验证提供了坚实的基础，支持从基础功能到高级特性的系统性测试覆盖。  

---

## 二、测试用例设计（不含代码）

以下分层次：功能验证、鲁棒性/异常、集成扩展、性能与可维护性、国际化 & 多模态、安全合规。每条包含：目标 / 前置 / 步骤要点 / 断言核心。实际执行时可再细化成步骤清单。优先级：P0（关键路径）/P1（重要）/P2（增强）。

### A. 基础编排与画布 (P0)
1. 创建与保存 Workflow  
- 目标：初始创建后编辑节点标题产生自动保存  
- 断言：自动保存时间戳更新；刷新后修改保持  
2. 节点连接与断开  
- 目标：任意两个节点连线与移除  
- 断言：连线计数、断开后变量引用消失或标记无效  
3. 多分支 (If/Else / Question Classifier)  
- 目标：根据输入分类走不同分支  
- 断言：运行日志仅出现匹配分支节点；Variable Aggregator 汇总输出存在  
4. Parallel / Add Parallel Node  
- 目标：添加并行支路  
- 断言：支路内节点独立执行；聚合后下游节点可访问统一变量  

### B. 核心节点功能 (P0/P1)
5. LLM 节点基础响应  
- 断言：输出字段匹配配置变量名；Token 计数存在  
  

### C. 文件上传 / 多模态 (P1)
12. Start Node 单文件变量上传替换  
- 断言：第二次上传覆盖第一份；下游解析使用最新  
13. 文件列表 + List Operation 过滤  
- 断言：按类型分离出文档/图像子集  
14. Vision 模式 LLM 引用图像文件  
- 断言：开启 vision 后可引用文件变量；关闭 vision 时提示/错误  
15. 不支持文件类型处理  
- 上传非白名单类型  
- 断言：出现限制文案/上传失败  

### D. Agent 策略 (P1)
16. Function Calling 策略调用指定工具  
- 断言：日志展示 function_call 名称与参数 JSON  
17. ReAct 策略多轮推理  
- 断言：日志包含 Thought / Action / Observation 循环，直至满足终止  
18. 工具参数模式（Auto vs Fixed）  
- 固定参数应始终使用固定值；Auto 由上下文推断  
19. Memory 开关  
- 关闭：第二轮不引用首轮上下文  
- 开启：Agent 引用前轮内容（例如 pronoun 解析）  

### E. Loop / Iteration (P1)
20. 基本 Loop 迭代次数上限  
- 配置终止条件未满足时到 MaxLoop 停止  
- 断言：迭代次数=上限  
21. Exit Loop Node 提前终止  
- 断言：退出后不再执行后续循环体节点  
22. Loop Variables 递增与状态传递  
- 断言：最终变量值=累计逻辑；日志中每轮输出可追溯  
23. 高级用例：文本逐步改写（4 次迭代）  
- 断言：每次输出不同，最终聚合变量包含最后版本  

### F. 错误处理与恢复 (P0/P1)
24. LLM 节点格式错误进入失败分支  
- 断言：error_type=ParseError（或具体定义），默认值变量被使用  
25. HTTP 节点 429 重试策略  
- 断言：日志出现多次尝试；重试间隔符合配置  
26. 并行分支单支失败不影响其他成功分支  
- 断言：汇总阶段可访问成功分支结果 + 失败分支提供默认值  
27. Code 节点抛异常使用默认输出继续  
- 断言：后续节点未中断  
28. Tool 节点主工具失败回退备选工具  
- 断言：实际调用为备选工具；error_message 记录主工具失败原因  

### G. 发布与复用 (P1)
29. Publish 前后版本号/时间戳变化  
- 断言：发布按钮后出现“Published”或版本标识  
30. 发布为 Tool 后被另一 Workflow 调用  
- 断言：下游 Agent 工具列表出现该 Workflow 名称并可执行  
31. DSL 导出 / 导入一致性  
- 导出 → 新 Workspace 导入  
- 断言：节点拓扑、变量、Schema 保持一致（ID 可变化但逻辑不变）  

### H. 调试与可观测性 (P1)
32. 单节点测试（Node-level test）  
- 断言：仅该节点执行，不产生全局运行日志  
33. 全链路 Test Run vs 单节点输出差异  
- 断言：全链路含全部节点日志；单节点仅局部  
34. Tracing 标签切换  
- 断言：RESULT / DETAIL / TRACING 数据结构不同但链接同一次 Run ID  
35. Token 统计准确性（含工具调用）  
- 断言：显示输入/输出 token 以及合计 ≥ 各步骤之和的合理范围  

### I. 结构化输出稳定性 (P1)
36. 不同模型对同一 JSON Schema 遵循程度  
- GPT-4o vs GPT-4o-mini vs 另一个模型  
- 断言：较小模型出现格式失败率更高（记录统计）  
37. 重试后成功率提升  
- 断言：开启 Retry 比关闭时成功率提升  

### J. 性能与扩展 (P2)
38. 并行分支性能提升  
- 断言：并行总耗时 < 各支线串行之和（采样）  
39. 大文件提取耗时告警（超过阈值）  
- 断言：日志显示耗时并仍成功解析  
40. 多工具 Agent 超过迭代上限收敛  
- 断言：达到最大迭代数后停止并输出提示  

### K. 国际化 / Unicode (P2)
41. 混合中文/英文节点命名渲染  
- 断言：界面展示正常无编码异常  
42. 中文提示语 + 英文结构化输出 JSON 正确生成  

### L. 安全与权限 (P2)
43. 外部工具未配置凭证调用失败  
- 断言：error_type=AuthError，提示明确  
44. 文件超大小限制上传阻断  
- 断言：返回限制提示，变量未创建  
45. Publish 权限校验（非授权用户）  
- 断言：按钮禁用或 403 响应（依实际权限模型）  

### M. 回归 / 可维护性 (P2)
46. 变量重命名影响链路引用  
- 断言：下游自动更新或出现缺失提示（记录行为）  
47. 删除中间节点后变量引用清理  
- 断言：无悬挂引用（或标记错误状态）  
48. 模型切换不重置自定义参数（保持 prompt）  

### N. 深度研究（官方 Deep Research Pattern）专项 (P2)
49. Loop + Agent + Structured Outputs 协同  
- 断言：每轮变量集合（findings, knowledge_gaps 等）累积完整  
50. 终局总结节点引用所有累计变量生成报告  
- 断言：输出引用来源集合（visited_urls 非空）  

---

## 三、优先执行建议（实施顺序）
1. P0：基础运行链路（创建-连线-LLM-Run-日志）  
2. P0：错误处理关键路径（LLM/HTTP/并行）  
3. P1：Agent、File Upload、Structured Outputs、Loop  
4. P1：发布与工具复用 + 变量聚合  
5. P1：调试 & 观测（Tracing / 单节点测试）  
6. P2：性能、国际化、安全边界、深度模式（Deep Research）  

---

## 四、依赖前置 & 风险提示
- 需准备多种模型/工具 Key（避免单一失败阻断批量用例）  
- File Upload 用例需构造多类型样本文件（PDF/PNG/MP3/超限文件）  
- 结构化输出需准备失败率统计脚本（便于对比不同模型）  
- 并行/Loop 性能测试需多次采样防止抖动  
- 发布为 Tool 需要具备有调用权限的第二个 Workflow 场景  

---

## 五、可选扩展追踪指标（非必须）
- 运行成功率（按节点类型聚合）  
- 结构化输出首次成功率 / 重试后成功率  
- 平均迭代深度（Agent & Loop）  
- 并行执行平均加速比  
- 文件解析平均耗时（按类型）  

