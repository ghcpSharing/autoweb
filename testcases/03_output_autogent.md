# 用例 03：知识检索 RAG Workflow 创建和执行验证

## 1. 用例概述
- 目标：验证可以成功创建一个知识检索 + LLM 的 RAG Workflow（Start -> Knowledge Retrieval -> LLM -> End），配置好节点连接和知识库，并成功执行工作流。
- 优先级：P0
- 类型：功能冒烟 / RAG 基础路径
- 注意：此测试关注 RAG 工作流的创建、配置和执行流程，验证知识检索节点能够正确工作。

## 2. 前置条件
- 已登录 Dify 控制台。
- 具备可用的通用 LLM 模型（如 GPT-4o）。
- 能够访问 /apps 页面创建新应用。
- **知识库 output-autogen.txt 已存在且 embedding provider 已正确配置**。

## 3. 流程配置步骤
1. 导航到 /apps 页面。
2. 点击 "Create from Blank" 创建新应用。
3. 在弹出的对话框中选择 "Workflow" 类型。
4. 配置应用信息：
   - 名称：`Knowledge Retrieval RAG`
   - 描述：`Knowledge retrieval workflow using RAG to answer questions based on uploaded documents`
5. 点击 "Create" 创建应用。
6. 等待工作流编辑器加载完成（等待 3 秒）。
7. 检查并配置 Start 节点：
   - 确认存在输入变量 `question`（字符串类型，最大长度 48 字符）
8. 检查并配置 Knowledge Retrieval 节点：
   - 如果不存在，从搜索面板添加 "Knowledge Retrieval" 节点
   - 点击节点进入配置
   - 节点标题：`KnowledgeRetrieval`
   - 查询变量：连接到 Start 节点的 `question` 变量
   - 知识库选择：选择包含 "autogen" 的知识库
   - Top-K 设置：默认值（通常 3-5）
9. 检查并配置 LLM 节点：
   - 如果不存在 LLM 节点，从搜索面板添加
   - 点击 LLM 节点进入配置
   - 节点标题：`AnswerSynthesizer`
   - 系统提示：`You are a helpful assistant. Use the provided context to answer the user's question. If the information is not available in the context, say so clearly.\n\nContext:\n{{#context#}}`
   - 用户消息：通过 UI 操作添加变量引用：
     - 输入基础文本：`Question: `
     - 输入 `/` 或 `{` 触发变量选择器
     - 选择 Start 节点的 `question` 变量（包含动态节点 ID）
   - Context 变量：连接到 Knowledge Retrieval 节点的 `result` 输出
10. 检查并配置 End 节点：
    - 如果不存在 End 节点，点击 "Select Next Block" 添加 End 节点
    - 点击 End 节点进入配置
    - 添加输出变量（如果按钮可见则点击添加按钮）
    - 输出变量名：`answer`
    - 点击 "Set variable" 连接到 LLM 节点的 `text` 输出
11. 等待自动保存完成（等待 2 秒）。

## 4. 运行测试步骤（详细）
| 步骤 | 操作 | 期望 |
| ---- | ---- | ---- |
| 1 | 点击 "Run" 按钮（精确匹配） | 启动工作流执行或弹出输入面板 |
| 2 | 如果弹出输入面板，输入测试问题：`What are agent types?` | 输入被接受，字符数 < 48 |
| 3 | 点击执行按钮 | 开始执行工作流 |
| 4 | 等待 "Running" 状态显示（可选，最多 3 秒） | 可能出现 "Running" 状态指示器 |
| 5 | 轮询等待 "SUCCESS" 状态（最大 30 秒） | SUCCESS 状态可见 |
| 6 | 在第 5 秒时点击 "详情" 或 "DETAIL" 标签（容错） | 查看执行详细信息 |
| 7 | 验证 Knowledge Retrieval 节点执行成功 | 节点显示 SUCCESS，输出包含检索结果 |
| 8 | 验证 LLM 节点执行成功 | 节点显示 SUCCESS，生成基于检索内容的回答 |
| 9 | 验证工作流执行完成 | 整体 SUCCESS 状态确认可见 |

**重要说明**：测试使用预设的简单问题验证 RAG 工作流能够成功创建、配置和执行。

## 5. 断言要点
- 工作流创建成功，应用名称为 "Knowledge Retrieval RAG"。
- Start 节点有 `question` 输入变量，限制 < 48 字符。
- Knowledge Retrieval 节点配置正确，标题为 "KnowledgeRetrieval"。
- 知识库正确选择包含 "autogen" 的库。
- LLM 节点配置正确，标题为 "AnswerSynthesizer"。
- 系统提示包含 context 变量引用 `{{#context#}}`。
- 用户消息通过 UI 变量选择器正确引用 Start 节点的 `question` 变量（包含动态节点 ID）。
- End 节点输出变量 "answer" 正确连接到 LLM 的 text 输出。
- 工作流执行状态最终显示为 "SUCCESS"。
- Knowledge Retrieval 节点成功检索到文档片段。
- LLM 节点基于检索结果生成合理回答。

## 6. 异常与边界补充测试
- 工作流编辑器加载超时：等待最多 15 秒后重试。
- 节点不存在时的处理：自动从面板添加所需节点。
- 知识库未选择：配置面板提示选择知识库。
- Embedding Provider 未配置：运行失败，显示 `'NoneType' object has no attribute 'provider'` 错误。
- 输入超长度限制：UI 提示 "question in input form must be less than 48 characters"。
- 配置面板加载延迟：使用适当的等待机制确保元素可见。
- 执行状态轮询：最大等待 30 秒，支持中途点击详情标签。
- **变量引用配置问题**：
  - Context 变量使用 `{{#context#}}` 语法，但需要在 LLM 节点中正确设置 Context 变量连接
  - 其他节点变量必须通过 UI 变量选择器操作，直接输入变量名无效
  - 即使工作流执行成功（STATUS: SUCCESS），也可能出现变量传递问题

## 7. 可自动化提示（Playwright）
- 应用创建：`page.getByText('Create from Blank', { exact: true })`
- 工作流类型选择：`dialogPanel.getByText('Workflow', { exact: true })`
- 应用名称输入：`page.fill('input[placeholder="Give your app a name"]', 'Knowledge Retrieval RAG')`
- 应用描述输入：`page.fill('textarea[placeholder="Enter the description of the app"]', 'Knowledge retrieval workflow using RAG to answer questions based on uploaded documents')`
- 创建按钮：`page.click('button:has-text("Create")')`
- Knowledge Retrieval 节点检查：`page.locator('button[title*="Knowledge"]').or(page.getByText('Knowledge Retrieval', { exact: true })).first()`
- Knowledge Retrieval 节点配置：`page.getByPlaceholder('Add title...').fill('KnowledgeRetrieval')`
- 知识库选择：定位包含 "autogen" 的下拉选项
- LLM 节点检查：`page.locator('button[title*="LLM"]').or(page.getByText('LLM', { exact: true })).first()`
- LLM 节点配置：`page.getByPlaceholder('Add title...').fill('AnswerSynthesizer')`
- 系统提示设置：`page.getByRole('textbox').nth(2).fill(systemPrompt)`
- 用户消息配置：
  - 先输入基础文本：`page.getByRole('textbox').nth(3).type('Question: ')`
  - 触发变量选择器：`page.getByRole('textbox').nth(3).type('{')`
  - 选择 question 变量：`page.getByText('question', { exact: true }).click()`
- Context 变量设置：连接 Knowledge Retrieval 的 `result` 输出
- End 节点检查：`page.locator('button[title*="End"]').or(page.getByText('End', { exact: true })).first()`
- End 节点输出：`page.getByPlaceholder('Variable name').fill('answer')`
- 变量连接：`page.getByText('Set variable').click()`
- LLM 输出选择：`page.getByText('textstring').or(page.getByText('text')).first()`
- 执行按钮：`page.getByText('Run', { exact: true }).click()`
- 测试输入：`page.fill('input[placeholder*="question"]', 'What are agent types?')`
- 状态验证：`page.getByText('SUCCESS').first().isVisible()`
- 详情标签：`page.getByText('详情').or(page.getByText('DETAIL'))`

## 8. 测试数据集
| 编号 | 输入问题 | 期望行为 | 字符数 |
| ---- | -------- | -------- | ------ |
| R1 | `什么是AutoGen?` | 检索命中，基于知识库回答 | 20 |
| R2 | `AutoGen的优势是什么?` | 语义检索命中，相关回答 | 18 |
| R3 | `What is Mars geology?` | 检索未命中，回答说明未找到 | 20 |

## 9. 输出采样（示例，仅校验结构不校验具体措辞）
```
测试验证以下内容：
- 工作流执行状态为 SUCCESS
- Knowledge Retrieval 节点成功检索到文档片段（对于 R1, R2）
- LLM 节点基于检索结果生成回答
- answer 变量成功连接到 LLM 的 text 输出
- 对于 R3，回答明确说明未在知识库中找到相关信息
```

---
## 附录：统一自动化注意事项
- 所有选择器基于实际 Playwright 测试代码验证，使用稳定的文本选择器和角色定位器。
- 工作流创建和配置过程包含适当的等待机制，处理异步加载。
- 节点配置使用索引定位（如 nth(2), nth(3)）需要根据实际 UI 结构调整。
- 知识库选择需要确保库已存在且 embedding provider 配置正确。
- 执行状态验证使用轮询机制，最大等待时间 30 秒。
- 错误处理包含重试机制和优雅降级（如点击详情标签的容错处理）。
- 变量连接和输出配置基于实际 UI 交互流程设计。
- **测试用例关注 RAG 工作流创建和基础执行，验证知识检索功能正常工作**。
- 测试验证工作流能够成功执行并返回基于知识库的 SUCCESS 状态和合理回答。
- Knowledge Retrieval 节点的输出变量为 `result`，LLM 通过 `{{#context#}}` 引用。
- **变量引用注意事项**：
  - Context 变量可直接使用 `{{#context#}}` 语法
  - 其他节点变量需通过 UI 变量选择器操作，因为包含动态节点 ID
  - 在消息编辑器中输入 `/` 或 `{` 可触发变量选择器
- 输入问题限制在 48 字符以内，避免 UI 校验错误。
