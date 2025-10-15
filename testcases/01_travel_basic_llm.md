# 用例 01：基础 Travel 主题 LLM Workflow 创建和执行验证

## 1. 用例概述
- 目标：验证可以成功创建一个基础的 Travel 规划 Workflow（Start -> LLM -> End），配置好节点连接，并成功执行工作流。
- 优先级：P0
- 类型：功能冒烟 / 基础路径
- 注意：此测试关注工作流的创建、配置和执行流程，不验证具体的输入输出内容。

## 2. 前置条件
- 已登录 Dify 控制台。
- 具备可用的通用 LLM 模型（如 GPT-4o）。
- 能够访问 /apps 页面创建新应用。

## 3. 流程配置步骤
1. 导航到 /apps 页面。
2. 点击 "Create from Blank" 创建新应用。
3. 在弹出的对话框中选择 "Workflow" 类型。
4. 配置应用信息：
   - 名称：`Travel Basic LLM`
   - 描述：`Basic travel planning workflow using LLM to generate travel itineraries`
5. 点击 "Create" 创建应用。
6. 等待工作流编辑器加载完成（等待 3 秒）。
7. 检查并配置 LLM 节点：
   - 如果不存在 LLM 节点，从搜索面板添加（搜索 "LLM"）
   - 点击 LLM 节点进入配置
   - 节点标题：`PlanLLM`
   - 系统提示：`You are a helpful travel planning assistant. Produce a concise 3-day plan with specific recommendations for attractions, dining, and transportation.`
   - 点击 "Add Message" 添加用户消息
   - 用户消息：`Please create a travel plan for: {context}`（通过输入 `{` 触发变量选择器，选择 context）
8. 检查并配置 End 节点：
   - 如果不存在 End 节点，点击 "Select Next Block" 添加 End 节点
   - 点击 End 节点进入配置
   - 添加输出变量（如果按钮可见则点击添加按钮）
   - 输出变量名：`travel_plan`
   - 点击 "Set variable" 连接到 LLM 节点的 `text` 输出
9. 等待自动保存完成（等待 2 秒）。

## 4. 运行测试步骤（详细）
| 步骤 | 操作 | 期望 |
| ---- | ---- | ---- |
| 1 | 点击 "Run" 按钮（精确匹配） | 启动工作流执行 |
| 2 | 等待 "Running" 状态显示（可选，最多 3 秒） | 可能出现 "Running" 状态指示器 |
| 3 | 轮询等待 "SUCCESS" 状态（最大 30 秒） | SUCCESS 状态可见 |
| 4 | 在第 5 秒时点击 "详情" 或 "DETAIL" 标签（容错） | 查看执行详细信息 |
| 5 | 验证工作流执行完成 | SUCCESS 状态确认可见 |

**重要说明**：测试不输入任何具体的旅行请求内容，只验证工作流能够成功创建、配置和执行。

## 5. 断言要点
- 工作流创建成功，应用名称为 "Travel Basic LLM"。
- LLM 节点配置正确，标题为 "PlanLLM"。
- 系统提示包含旅行助手角色定义和具体要求。
- 用户消息正确使用 context 变量。
- End 节点输出变量 "travel_plan" 正确连接到 LLM 的 text 输出。
- 工作流执行状态最终显示为 "SUCCESS"。
- 执行过程中所有节点状态正常。

## 6. 异常与边界补充测试
- 工作流编辑器加载超时：等待最多 15 秒后重试。
- 节点不存在时的处理：自动从面板添加所需节点。
- 配置面板加载延迟：使用适当的等待机制确保元素可见。
- 执行状态轮询：最大等待 30 秒，支持中途点击详情标签。

## 7. 可自动化提示（Playwright）
- 应用创建：`page.getByText('Create from Blank', { exact: true })`
- 工作流类型选择：`dialogPanel.getByText('Workflow', { exact: true })`
- 应用名称输入：`page.fill('input[placeholder="Give your app a name"]', 'Travel Basic LLM')`
- 应用描述输入：`page.fill('textarea[placeholder="Enter the description of the app"]', 'Basic travel planning workflow using LLM to generate travel itineraries')`
- 创建按钮：`page.click('button:has-text("Create")')`
- LLM 节点检查：`page.locator('button[title*="LLM"]').or(page.getByText('LLM', { exact: true })).first()`
- LLM 节点配置：`page.getByPlaceholder('Add title...').fill('PlanLLM')`
- 系统提示设置：`page.getByRole('textbox').nth(2).fill(systemPrompt)`
- 用户消息配置：`page.getByRole('textbox').nth(3).type('Please create a travel plan for: {')`
- 变量选择：`page.getByText('context', { exact: true }).click()`
- End 节点检查：`page.locator('button[title*="End"]').or(page.getByText('End', { exact: true })).first()`
- End 节点输出：`page.getByPlaceholder('Variable name').fill('travel_plan')`
- 变量连接：`page.getByText('Set variable').click()`
- LLM 输出选择：`page.getByText('textstring').or(page.getByText('text')).first()`
- 执行按钮：`page.getByText('Run', { exact: true }).click()`
- 状态验证：`page.getByText('SUCCESS').first().isVisible()`
- 详情标签：`page.getByText('详情').or(page.getByText('DETAIL'))`

## 8. 输出采样（示例，仅校验结构不校验具体措辞）
```
测试不验证具体输出内容，只确认：
- 工作流执行状态为 SUCCESS
- travel_plan 变量成功连接到 LLM 的 text 输出
- 所有节点配置正确并能正常执行
```

---
## 附录：统一自动化注意事项
- 所有选择器基于实际 Playwright 测试代码验证，使用稳定的文本选择器和角色定位器。
- 工作流创建和配置过程包含适当的等待机制，处理异步加载。
- 节点配置使用索引定位（如 nth(2), nth(3)）需要根据实际 UI 结构调整。
- 执行状态验证使用轮询机制，最大等待时间 30 秒。
- 错误处理包含重试机制和优雅降级（如点击详情标签的容错处理）。
- 变量连接和输出配置基于实际 UI 交互流程设计。
- **测试用例关注工作流创建和基础执行，不依赖具体的输入内容验证**。
- 测试只验证工作流能够成功执行并返回 SUCCESS 状态，不检查具体的旅行规划内容。
