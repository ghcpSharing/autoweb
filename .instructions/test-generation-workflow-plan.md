# Dify Workflow 测试生成完整工作流程计划

本文档定义了从用户场景到最终测试代码的完整工作流程，包括需求分析、设计规划、任务分解和代码实现的全流程。

## 工作流程概览

```
用户场景 → Web探索 → Requirements.md → Design.md → Tasks.md → 测试代码 → 验证迭代
```

---

## 阶段 0: 初始化和场景理解

### 0.1 接收用户场景
- **输入**: 用户提供的 Dify workflow 测试场景描述
- **输出**: 明确的场景理解和确认

### 0.2 创建场景目录结构
```
scenarios/
  └── <scenario-name>/          # 根据场景生成描述性文件夹名
      ├── requirements.md       # 待生成
      ├── design.md            # 待生成
      ├── tasks.md             # 待生成
      └── exploration-notes.md # Web探索过程记录
```

**文件夹命名规范**:
- 使用小写字母和连字符
- 描述性命名，反映场景核心功能
- 示例：`knowledge-retrieval-rag`、`multi-step-llm-chain`、`conditional-workflow`

### 0.3 验证前置条件
- [ ] Playwright MCP 工具可用
- [ ] 登录态已配置（`auth/user.json`）
- [ ] Dify 环境可访问（`dify.xxx.com`）
- [ ] 参考文档完整（`doc/` 文件夹）

---

## 阶段 1: Web 探索和信息收集

### 1.1 启动浏览器探索
**目标**: 通过 Playwright MCP 工具真实交互 Dify 页面，理解实际的 UI 结构、交互流程和技术细节。

#### 1.1.1 导航到应用列表页面

#### 1.1.2 创建测试应用流程探索
**步骤**:
1. **点击 "Create from Blank"**
   - 使用 `browser_snapshot` 获取页面结构
   - 记录按钮定位器和交互方式
   
2. **选择 Workflow 类型**
   - 观察弹出对话框结构
   - 记录对话框选择器和类型选项
   
3. **填写应用信息**
   - 记录输入框的 placeholder、name、selector
   - 记录应用名称和描述的验证规则

4. **等待页面加载**
   - 记录加载指示器
   - 确定合适的等待策略（时间 vs 元素出现）

**记录内容**:
- 每步的 DOM 快照
- 关键元素的选择器
- 页面状态变化
- 异步加载行为
- 错误提示信息

#### 1.1.3 节点配置流程探索
对场景中涉及的每个节点类型进行探索：

**Start 节点**:
1. 定位节点在画布上的位置
2. 点击节点进入配置面板
3. 记录配置面板结构：
   - 变量名输入框
   - 变量类型选择器
   - 字段类型（文本/数字/下拉等）
   - 验证规则（最大长度等）
4. 测试添加/删除变量的交互
5. 记录保存行为（自动保存 vs 手动保存）

**Knowledge Retrieval 节点**（如果场景涉及）:
1. 从节点面板添加节点的流程
2. 配置面板的详细结构：
   - 标题输入框
   - 查询变量选择器（下拉 vs 手动输入）
   - 知识库选择器（搜索、下拉、多选等）
   - Top-K 参数输入
3. 变量连接的 UI 交互方式
4. 记录知识库列表的加载方式

**LLM 节点**:
1. 节点添加和配置面板打开
2. 详细记录配置项：
   - 模型选择器（下拉、搜索）
   - 系统提示输入框（多行文本）
   - 用户消息编辑器（富文本 vs 纯文本）
   - **变量插入机制**（重点）：
     - 触发方式（`/`、`{`、按钮）
     - 变量选择器 UI 结构
     - 变量引用格式（`{{#var#}}` vs 动态 ID）
   - Context 变量的特殊处理
   - 输出格式配置

**End 节点**:
1. 添加输出变量的流程
2. "Set variable" 按钮的交互
3. 变量连接选择器的 UI 结构
4. 输出类型显示（string、object 等）

**记录要点**:
- 每个配置项的完整选择器路径
- 输入框的验证规则和错误提示
- 下拉选择器的选项加载方式
- 变量引用的多种格式和适用场景
- 节点间连线的自动/手动处理
- 要将场景中提到的所有断言点都用 Playwright MCP 工具验证一遍，确保选择器和交互方式正确，并记录到 exploration-notes.md 中

#### 1.1.4 工作流执行流程探索
1. **运行按钮定位**
   - 记录按钮的文本、位置、状态变化
   
2. **输入面板（如果出现）**
   - 面板结构和字段映射
   - 输入验证和错误提示
   
3. **执行状态监控**
   - 状态指示器的类型（文本、图标、进度条）
   - 状态值列表（Running、Success、Failed）
   - 状态轮询机制
   
4. **结果展示**
   - 详情标签/按钮的位置
   - 结果展示面板的结构
   - 各节点执行结果的显示方式
   - 输出变量的提取路径

#### 1.1.5 记录探索结果
将所有观察和记录保存到 `exploration-notes.md`:
```markdown
# Web 探索笔记 - <场景名称>

## 1. 应用创建流程
- Create 按钮: selector, 交互方式
- 对话框: selector, 结构
- ...

## 2. 节点配置详情
### Start 节点
- 配置面板: selector
- 变量名输入: selector, 验证规则
- ...

### Knowledge Retrieval 节点
...

## 3. 执行流程
...

## 4. 关键发现
- 动态 ID 的处理方式
- 变量引用的两种格式
- ...

## 5. 注意事项
- 等待时间建议
- 容易出错的选择器
- ...
```

---

## 阶段 2: 生成 Requirements.md

### 2.1 需求文档结构
参考 `testcases/03_output_autogent.md` 的格式和粒度，生成结构化需求文档。

### 2.2 需求文档模板

```markdown
# 用例 XX：<场景名称> 创建和执行验证

## 1. 用例概述
- **目标**: <从用户场景和 Web 探索中提炼的核心目标>
- **优先级**: P0/P1/P2
- **类型**: 功能冒烟 / 集成测试 / 边界测试
- **注意**: <从 Web 探索中发现的关键注意事项>

## 2. 前置条件
- 已登录 Dify 控制台
- 具备可用的通用 LLM 模型（如 GPT-4o）
- 能够访问 /apps 页面创建新应用
- <根据场景添加特定前置条件，如知识库、特定配置等>

## 3. 流程配置步骤
<基于 Web 探索记录，详细列出每一步操作>

1. 导航到 /apps 页面
2. 点击 "Create from Blank" 创建新应用
3. 在弹出的对话框中选择 "Workflow" 类型
4. 配置应用信息：
   - 名称：`<应用名称>`
   - 描述：`<应用描述>`
5. 点击 "Create" 创建应用
6. 等待工作流编辑器加载完成（等待 X 秒）
7. 配置 Start 节点：
   - <详细的配置项>
   - <基于 Web 探索的实际 UI 交互步骤>
8. 配置 <节点类型> 节点：
   - <每个配置项的详细步骤>
   - <变量连接的具体操作方式>
9. ...
10. 配置 End 节点：
    - <输出变量的添加和连接步骤>
11. 等待自动保存完成（等待 X 秒）

## 4. 运行测试步骤（详细）
<基于 Web 探索的执行流程>

| 步骤 | 操作 | 期望 |
| ---- | ---- | ---- |
| 1 | 点击 "Run" 按钮 | 启动工作流执行或弹出输入面板 |
| 2 | <输入测试数据> | <预期行为> |
| 3 | 点击执行按钮 | 开始执行工作流 |
| 4 | 轮询等待 "SUCCESS" 状态（最大 X 秒） | SUCCESS 状态可见 |
| 5 | 点击 "详情" 或 "DETAIL" 标签 | 查看执行详细信息 |
| 6 | 验证 <节点名> 节点执行成功 | 节点显示 SUCCESS，输出符合预期 |
| ... | ... | ... |

## 5. 断言要点
<基于 Web 探索和用户场景的验证点>

- 工作流创建成功，应用名称为 "<名称>"
- Start 节点有 `<变量名>` 输入变量，<验证规则>
- <节点类型> 节点配置正确，标题为 "<标题>"
- <关键配置项> 设置正确
- 变量连接正确：<详细的连接关系>
- 工作流执行状态最终显示为 "SUCCESS"
- 输出结果符合预期：<具体的输出验证规则>

## 6. 异常与边界补充测试
<基于 Web 探索发现的边界情况>

- 工作流编辑器加载超时：等待最多 X 秒后重试
- 节点不存在时的处理：自动从面板添加所需节点
- <配置项> 未设置：配置面板提示 <错误信息>
- 输入超长度限制：UI 提示 "<错误信息>"
- 配置面板加载延迟：使用适当的等待机制确保元素可见
- 执行状态轮询：最大等待 X 秒，支持中途点击详情标签
- **变量引用配置问题**：
  - <基于 Web 探索发现的变量引用注意事项>
  - <动态 ID 的处理方式>

## 7. 可自动化提示（Playwright）
<基于 Web 探索记录的精确选择器>

- 应用创建：`page.getByText('Create from Blank', { exact: true })`
- <每个交互步骤的选择器和代码片段>
- <变量选择器的触发和选择方式>
- <状态验证的选择器>

## 8. 测试数据集
<不同的测试输入和预期输出>

| 编号 | 输入 | 期望行为 | 备注 |
| ---- | ---- | -------- | ---- |
| R1 | `<输入1>` | <预期结果1> | <说明> |
| R2 | `<输入2>` | <预期结果2> | <说明> |
| R3 | `<输入3>` | <预期结果3> | <边界情况> |

## 9. 输出采样（示例）
```
<期望的输出格式和内容示例>
```

---
## 附录：统一自动化注意事项
<从 Web 探索中总结的关键注意事项>

- 所有选择器基于实际 Web 探索验证，使用稳定的定位策略
- 工作流创建和配置过程包含适当的等待机制，处理异步加载
- 节点配置使用精确的选择器，避免索引定位（nth）的脆弱性
- 变量连接使用 <发现的最佳实践>
- 执行状态验证使用轮询机制，最大等待时间 X 秒
- 错误处理包含重试机制和优雅降级
- **变量引用注意事项**：
  - <Context 变量的特殊格式>
  - <其他变量的引用方式>
  - <动态 ID 的处理策略>
```

### 2.3 生成步骤
1. 从 `exploration-notes.md` 提取关键信息
2. 参考用户场景明确测试目标
3. 根据模板填充每个章节
4. 确保粒度和详细程度与参考文档一致
5. 保存到 `scenarios/<scenario-name>/requirements.md`

---

## 阶段 3: 生成 Design.md

### 3.1 设计文档目标
将需求转化为技术实现设计，参考现有的编程范式（如 `03-knowledge-retrieval-rag.case.spec.ts`），定义：
- 测试架构
- 辅助函数设计
- 数据结构定义
- 错误处理策略

### 3.2 设计文档模板

```markdown
# 设计文档：<场景名称> 测试实现

## 1. 设计概述
### 1.1 测试目标
<从 requirements.md 提炼的核心目标>， 结合这个测试场景阅读 `03-knowledge-retrieval-rag.case.spec.ts` 的实现方式，学习其设计思路和实现细节，规划本场景的测试实现。
同时需要参考 `doc/dify.workflow.faq.md` 中的常见问题解答，避免常见陷阱。

### 1.2 技术栈
- 测试框架：`@playwright/test`
- 辅助工具：
  - `AuthHelper` - 认证管理
  - `src/index.ts` - 工作流配置辅助函数
  - 自定义辅助函数（如需）

### 1.3 设计原则
- **模块化**: 使用现有的辅助函数，避免重复代码
- **可维护性**: 配置与逻辑分离
- **可读性**: 清晰的步骤注释和命名
- **健壮性**: 适当的等待和错误处理

## 2. 架构设计

### 2.1 测试文件结构
```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth-helper';
import {
  createBlankWorkflow,
  configureStartVariable,
  configure<NodeType>Node,
  runWorkflowAndWaitForSuccess,
  COMMON_CONFIGS,
  type <NodeType>Config
} from '../index';

test.describe('<场景名称>', () => {
  test('should <测试目标>', async ({ page }) => {
    // 步骤实现
  });
});
```

### 2.2 配置数据结构
<基于 requirements.md 的配置需求，定义配置对象>

```typescript
// 在 src/index.ts 的 COMMON_CONFIGS 中添加
export const COMMON_CONFIGS = {
  // ... 现有配置
  <SCENARIO_NAME>: {
    app: {
      name: '<应用名称>',
      description: '<应用描述>'
    },
    startVariable: {
      name: '<变量名>',
      label: '<变量标签>',
      type: '<类型>',
      maxLength: <长度>
    },
    <nodeType>: {
      title: '<节点标题>',
      <配置项>: '<值>',
      // ...
    },
    // ... 其他节点配置
    testInput: '<测试输入>',
    validation: {
      minLength: <最小长度>,
      expectedKeywords: ['<关键词1>', '<关键词2>']
    }
  }
};
```

### 2.3 需要的辅助函数
<基于 requirements.md 的操作步骤，判断是否需要新的辅助函数>

#### 2.3.1 现有函数评估
- `createBlankWorkflow`: ✅ 可直接使用
- `configureStartVariable`: ✅ 可直接使用
- `configure<NodeType>Node`: <评估是否存在，如不存在需新增>
- `runWorkflowAndWaitForSuccess`: ✅ 可直接使用，但可能需调整等待时间

#### 2.3.2 新增函数设计（如需）
```typescript
/**
 * 配置 <节点类型> 节点
 * @param page - Playwright Page 对象
 * @param title - 节点标题
 * @param config - 节点配置对象
 */
export async function configure<NodeType>Node(
  page: Page,
  title: string,
  config: <NodeType>Config
): Promise<void> {
  console.log(`Configuring <节点类型> node: ${title}`);
  
  // 步骤 1: 定位节点
  // 步骤 2: 打开配置面板
  // 步骤 3: 填充配置项
  // 步骤 4: 连接变量
  // 步骤 5: 保存配置
  
  console.log(`<节点类型> node configured successfully`);
}

/**
 * <NodeType>Config 类型定义
 */
export type <NodeType>Config = {
  <字段1>: string;
  <字段2>: number;
  // ...
};
```

## 3. 选择器设计

### 3.1 选择器策略
<基于 Web 探索的 exploration-notes.md，定义选择器策略>

| 元素 | 选择器策略 | 具体选择器 | 备用方案 |
| ---- | ---------- | ---------- | -------- |
| Create 按钮 | 文本精确匹配 | `getByText('Create from Blank', { exact: true })` | `getByRole('button', { name: 'Create from Blank' })` |
| <节点> 配置面板 | 标题定位 | `locator('[data-node-type="<type>"]')` | `getByTitle('<节点名>')` |
| <输入框> | Placeholder | `getByPlaceholder('<placeholder>')` | `locator('input[name="<name>"]')` |
| ... | ... | ... | ... |

### 3.2 动态元素处理
<针对 Web 探索中发现的动态 ID、动态加载等问题>

- **动态节点 ID**: 使用相对定位（父节点 + 相对位置）而非绝对 ID
- **变量选择器**: 触发方式 + 文本匹配
- **状态轮询**: 使用 `waitFor` 配合条件判断

## 4. 等待和同步策略

### 4.1 页面加载等待
<基于 Web 探索的加载时间观察>

- 工作流编辑器加载：`await page.waitForTimeout(3000)` 或 `await page.waitForSelector('<关键元素>')`
- 配置面板加载：`await panel.waitFor({ state: 'visible' })`
- 自动保存完成：`await page.waitForTimeout(2000)` 或等待保存指示器消失

### 4.2 执行状态轮询
```typescript
// 参考 runWorkflowAndWaitForSuccess 函数
// 根据场景调整：
// - maxWaitTime: 根据场景复杂度设置（LLM: 20s, RAG: 30s, 复杂链: 60s）
// - fixedWaitMs: 点击详情前的等待时间
```

## 5. 错误处理设计

### 5.1 预期错误场景
<从 requirements.md 第 6 节提取>

- 加载超时：重试逻辑
- 节点不存在：自动添加逻辑
- 配置项未设置：验证和提示
- 执行失败：错误信息提取和断言

### 5.2 错误处理实现
```typescript
// 示例：节点不存在时添加
const nodeExists = await page.locator('<节点选择器>').count() > 0;
if (!nodeExists) {
  console.log('Node not found, adding from panel...');
  await addNodeFromPanel(page, '<节点类型>');
}

// 示例：执行失败处理
if (result.status === 'FAILED') {
  const errorMsg = await extractErrorMessage(page);
  console.error('Workflow execution failed:', errorMsg);
  throw new Error(`Execution failed: ${errorMsg}`);
}
```

## 6. 测试数据设计

### 6.1 主要测试用例
<从 requirements.md 第 8 节映射>

```typescript
const TEST_CASES = [
  {
    id: 'R1',
    input: '<输入1>',
    expected: {
      status: 'SUCCESS',
      minLength: <长度>,
      keywords: ['<关键词1>', '<关键词2>']
    }
  },
  // ...
];
```

### 6.2 边界测试用例
<从 requirements.md 第 6 节映射>

```typescript
const BOUNDARY_CASES = [
  {
    id: 'B1',
    input: '<超长输入>',
    expected: {
      error: '<错误信息>'
    }
  },
  // ...
];
```

## 7. 断言设计

### 7.1 成功路径断言
<从 requirements.md 第 5 节映射>

```typescript
// 配置阶段断言
expect(await page.title()).toContain('<应用名称>');
expect(await startNode.isVisible()).toBe(true);

// 执行阶段断言
expect(result.success).toBe(true);
expect(result.answer).toBeTruthy();
expect(result.answer.length).toBeGreaterThan(<最小长度>);

// 内容验证断言
expect(result.answer.toLowerCase()).toMatch(/<关键词正则>/);
```

### 7.2 失败路径断言
```typescript
// 配置错误断言
await expect(errorMessage).toContainText('<预期错误信息>');

// 执行失败断言
expect(result.status).toBe('FAILED');
expect(result.error).toContain('<预期错误关键词>');
```

## 8. 性能和优化考虑

### 8.1 执行时间预估
<基于场景复杂度>

- 配置阶段：~20-30秒
- 执行阶段：~<X>秒（根据节点类型和数量）
- 总计：~<Y>秒

### 8.2 优化策略
- 减少不必要的 `waitForTimeout`，优先使用条件等待
- 并行化独立的配置步骤（如果可能）
- 复用已创建的工作流（如果测试允许）

## 9. 可维护性设计

### 9.1 配置集中化
所有配置数据放在 `COMMON_CONFIGS`，便于批量更新。

### 9.2 函数模块化
每个节点配置独立为函数，便于复用和测试。

### 9.3 选择器抽象
考虑将选择器提取为常量或配置，便于 UI 变更时集中更新。

```typescript
const SELECTORS = {
  CREATE_BUTTON: 'Create from Blank',
  WORKFLOW_TYPE: 'Workflow',
  // ...
};
```

## 10. 实现检查清单

- [ ] 配置对象定义完整
- [ ] 所有辅助函数已实现或可复用
- [ ] 选择器策略明确且稳定
- [ ] 等待策略合理且充分
- [ ] 错误处理覆盖主要场景
- [ ] 断言覆盖所有验证点
- [ ] 测试数据覆盖正常和边界情况
- [ ] 代码符合现有编程范式
- [ ] 注释清晰，便于维护

---

## 参考资料
- `src/cases/03-knowledge-retrieval-rag.case.spec.ts` - 编程范式参考
- `src/index.ts` - 辅助函数库
- `exploration-notes.md` - Web 探索记录
- `requirements.md` - 需求文档
```

### 3.3 生成步骤
1. 从 `requirements.md` 提取配置需求和操作步骤
2. 参考 `03-knowledge-retrieval-rag.case.spec.ts` 的编程范式
3. 参考 `src/index.ts` 中的现有辅助函数
4. 从 `exploration-notes.md` 获取选择器和技术细节
5. 设计配置对象、辅助函数、选择器策略
6. 定义错误处理和断言逻辑
7. 保存到 `scenarios/<scenario-name>/design.md`

---

## 阶段 4: 生成 Tasks.md

### 4.1 任务文档目标
将设计分解为可执行的开发任务，确保每个任务清晰、独立、可验证。

### 4.2 任务文档模板

```markdown
# 任务分解：<场景名称> 测试实现

## 任务概览
从设计到实现的分步任务列表，每个任务独立且可验证。

---

## 任务 1: 配置数据定义

### 1.1 目标
在 `src/index.ts` 中添加场景配置对象。

### 1.2 输入
- `design.md` 第 2.2 节的配置数据结构

### 1.3 输出
- `src/index.ts` 中 `COMMON_CONFIGS` 新增配置

### 1.4 具体步骤
1. 打开 `src/index.ts`
2. 定位到 `COMMON_CONFIGS` 对象
3. 添加新配置：
```typescript
<SCENARIO_NAME>: {
  app: {
    name: '<应用名称>',
    description: '<应用描述>'
  },
  // ... 完整配置
}
```
4. 确保格式正确，逗号完整

### 1.5 验证标准
- [ ] 配置对象语法正确
- [ ] 所有必需字段已定义
- [ ] 配置值与 `requirements.md` 一致

---

## 任务 2: 类型定义（如果需要新类型）

### 2.1 目标
定义新节点配置的 TypeScript 类型。

### 2.2 输入
- `design.md` 第 2.3.2 节的类型定义

### 2.3 输出
- `src/types.ts` 中新增类型定义

### 2.4 具体步骤
1. 打开 `src/types.ts`
2. 添加新类型：
```typescript
export type <NodeType>Config = {
  <字段1>: string;
  <字段2>: number;
  // ...
};
```
3. 在 `src/index.ts` 中导出该类型

### 2.5 验证标准
- [ ] 类型定义语法正确
- [ ] 所有字段类型准确
- [ ] 导出语句正确

---

## 任务 3: 实现新辅助函数（如果需要）

### 3.1 目标
实现 `design.md` 中定义的新辅助函数。

### 3.2 输入
- `design.md` 第 2.3.2 节的函数设计
- `exploration-notes.md` 中的选择器和交互细节

### 3.3 输出
- `src/<module>-configurators.ts` 或 `src/<module>-helpers.ts` 中新增函数

### 3.4 具体步骤
1. 选择合适的模块文件（参考现有组织方式）
2. 实现函数签名
3. 实现函数体：
   - 步骤 1: 定位节点
   - 步骤 2: 打开配置面板
   - 步骤 3: 填充配置项（使用 `exploration-notes.md` 中的选择器）
   - 步骤 4: 连接变量
   - 步骤 5: 等待保存
4. 添加日志输出（console.log）
5. 添加错误处理（try-catch）
6. 在 `src/index.ts` 中导出函数

### 3.5 验证标准
- [ ] 函数签名与设计一致
- [ ] 选择器稳定且精确
- [ ] 包含适当的等待逻辑
- [ ] 包含错误处理
- [ ] 日志输出清晰
- [ ] 函数已导出

---

## 任务 4: 创建测试文件骨架

### 4.1 目标
创建测试文件的基本结构，不包含具体实现。

### 4.2 输入
- `design.md` 第 2.1 节的测试文件结构

### 4.3 输出
- `src/cases/<XX>-<scenario-name>.case.spec.ts` 文件

### 4.4 具体步骤
1. 创建测试文件
2. 添加导入语句
3. 添加 `test.describe` 块
4. 添加 `test` 函数骨架
5. 添加步骤注释占位符

```typescript
import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth-helper';
import {
  // ... 导入所需函数
} from '../index';

test.describe('<场景名称>', () => {
  test('should <测试目标>', async ({ page }) => {
    console.log('=== Starting <场景名称> Test ===');
    
    // Step 1: Authenticate
    // TODO
    
    // Step 2: Create workflow
    // TODO
    
    // Step 3: Configure Start variable
    // TODO
    
    // ... 其他步骤
    
    console.log('=== Test Complete ===');
  });
});
```

### 4.5 验证标准
- [ ] 文件创建成功
- [ ] 导入语句完整
- [ ] 测试结构正确
- [ ] 步骤注释清晰

---

## 任务 5: 实现认证步骤

### 5.1 目标
实现测试的第一步：认证登录。

### 5.2 输入
- 现有的 `AuthHelper` 工具

### 5.3 输出
- 测试文件中认证代码实现

### 5.4 具体步骤
1. 在测试文件中添加：
```typescript
const authHelper = new AuthHelper(page);
await authHelper.ensureLoggedIn();
```

### 5.5 验证标准
- [ ] 代码语法正确
- [ ] 可以成功登录

---

## 任务 6: 实现工作流创建步骤

### 6.1 目标
调用 `createBlankWorkflow` 创建工作流。

### 6.2 输入
- 任务 1 中定义的配置对象
- `createBlankWorkflow` 函数

### 6.3 输出
- 测试文件中工作流创建代码

### 6.4 具体步骤
1. 获取配置：
```typescript
const config = COMMON_CONFIGS.<SCENARIO_NAME>;
```
2. 调用创建函数：
```typescript
await createBlankWorkflow(page, config.app);
```

### 6.5 验证标准
- [ ] 配置引用正确
- [ ] 函数调用语法正确
- [ ] 工作流创建成功

---

## 任务 7: 实现节点配置步骤

### 7.1 目标
配置场景中涉及的所有节点。

### 7.2 输入
- 任务 1 中的配置对象
- 任务 3 中实现的辅助函数（或现有函数）

### 7.3 输出
- 测试文件中节点配置代码

### 7.4 具体步骤
针对每个节点：

1. **Start 节点**:
```typescript
await configureStartVariable(
  page, 
  config.startVariable.name, 
  config.startVariable.label
);
```

2. **<节点类型 1>**:
```typescript
const <node>Config: <NodeType>Config = {
  <字段1>: config.<node>.<字段1>,
  <字段2>: config.<node>.<字段2>,
  // ...
};
await configure<NodeType>Node(page, config.<node>.title, <node>Config);
```

3. **<节点类型 2>**:
```typescript
// 类似步骤
```

4. **End 节点**:
```typescript
await configureEndNode(page, {
  outputVariable: config.endVariable.name,
  sourceVariable: config.endVariable.sourceField,
  sourceNode: config.endVariable.sourceNode,
  sourceField: config.endVariable.sourceField
});
```

### 7.5 验证标准
- [ ] 所有节点配置代码实现
- [ ] 配置参数来自配置对象
- [ ] 节点配置顺序正确
- [ ] 每步有清晰注释

---

## 任务 8: 实现工作流执行步骤

### 8.1 目标
运行工作流并等待结果。

### 8.2 输入
- `runWorkflowAndWaitForSuccess` 函数
- 任务 1 中的测试输入和验证配置

### 8.3 输出
- 测试文件中执行和等待代码

### 8.4 具体步骤
1. 调用执行函数：
```typescript
const result = await runWorkflowAndWaitForSuccess(
  page, 
  config.testInput,
  config.validation,
  { fixedWaitMs: <根据 design.md 的等待策略> }
);
```

### 8.5 验证标准
- [ ] 函数调用正确
- [ ] 参数来自配置对象
- [ ] 等待时间合理

---

## 任务 9: 实现断言验证

### 9.1 目标
添加所有必需的断言验证测试结果。

### 9.2 输入
- `design.md` 第 7 节的断言设计
- `requirements.md` 第 5 节的断言要点

### 9.3 输出
- 测试文件中完整的断言代码

### 9.4 具体步骤
根据 `design.md` 添加断言：

```typescript
// 基础断言
expect(result.success).toBe(true);
expect(result.answer).toBeTruthy();
expect(result.answer.length).toBeGreaterThan(config.validation.minLength);

// 内容验证
const keywords = config.validation.expectedKeywords;
const answerLower = result.answer.toLowerCase();
const hasKeyword = keywords.some(kw => answerLower.includes(kw.toLowerCase()));
expect(hasKeyword).toBe(true);

// 额外验证（根据场景）
// ...
```

### 9.5 验证标准
- [ ] 所有断言点已覆盖
- [ ] 断言逻辑正确
- [ ] 断言信息清晰

---

## 任务 10: 添加日志和注释

### 10.1 目标
完善日志输出和代码注释。

### 10.2 输入
- 已实现的测试代码

### 10.3 输出
- 带有完整日志和注释的测试代码

### 10.4 具体步骤
1. 每个主要步骤前添加注释：
```typescript
// Step X: <步骤描述>
```

2. 关键操作后添加日志：
```typescript
console.log('=== Starting <场景名称> Test ===');
console.log('Step X: <步骤描述>');
console.log('Final answer:', result.answer);
console.log('=== Test Complete ===');
```

### 10.5 验证标准
- [ ] 每个步骤有注释
- [ ] 关键点有日志输出
- [ ] 日志信息有助于调试

---

## 任务 11: 本地测试执行

### 11.1 目标
在本地环境运行测试，确保通过。

### 11.2 输入
- 完整的测试代码
- Dify 测试环境

### 11.3 输出
- 测试通过的记录

### 11.4 具体步骤
1. 运行测试：
```bash
npx playwright test src/cases/<XX>-<scenario-name>.case.spec.ts 2>&1 | tee test-output.log
```
不要通过 sleep 这样的 bash 来等待，因为当前的 vscode terminal 在执行这个命令时会把之前的npx playwright test给强制中断掉。可以参考上面的做法，把输出重定向到一个log文件中，然后用tee命令把输出打印到终端和log文件中。

2. 观察输出，记录任何错误. 

3. 如果失败，根据错误信息调试：
   - 参考 `src/cases` 下的已有测试用例代码的写法。
   - 如果测试执行失败后，发现是因为页面元素选择器不对，或者页面交互方式不对，则需要使用 Playwright MCP 工具重新探索页面 URL，确认正确的选择器和交互方式，然后再修改测试代码。

4. 修复问题后重新运行

5. 重复直到测试通过

### 11.5 验证标准
- [ ] 测试成功运行
- [ ] 所有断言通过
- [ ] 无错误或警告

---

## 任务 12: 文档更新

### 12.1 目标
更新相关文档，记录测试实现。

### 12.2 输入
- 完成的测试代码
- 实现过程中的发现

### 12.3 输出
- 更新的 `README.md` 或测试文档

### 12.4 具体步骤
1. 在 `src/README.md` 中添加测试用例说明
2. 记录测试覆盖的场景和用例编号
3. 记录执行命令和预期结果
4. 如果发现 `doc/` 文件夹中的文档有误，更新之

### 12.5 验证标准
- [ ] README 包含新测试说明
- [ ] 相关文档已更新
- [ ] 文档与实现一致

---

## 任务总结

### 完成检查清单
- [ ] 任务 1: 配置数据定义 ✅
- [ ] 任务 2: 类型定义 ✅
- [ ] 任务 3: 实现新辅助函数 ✅
- [ ] 任务 4: 创建测试文件骨架 ✅
- [ ] 任务 5: 实现认证步骤 ✅
- [ ] 任务 6: 实现工作流创建步骤 ✅
- [ ] 任务 7: 实现节点配置步骤 ✅
- [ ] 任务 8: 实现工作流执行步骤 ✅
- [ ] 任务 9: 实现断言验证 ✅
- [ ] 任务 10: 添加日志和注释 ✅
- [ ] 任务 11: 本地测试执行与调试 ✅
- [ ] 任务 12: 文档更新 ✅

### 交付物
- `src/index.ts` - 更新的配置和辅助函数
- `src/types.ts` - 新增类型定义（如有）
- `src/<module>-*.ts` - 新增辅助函数（如有）
- `src/cases/<XX>-<scenario-name>.case.spec.ts` - 完整的测试文件
- `scenarios/<scenario-name>/requirements.md` - 需求文档
- `scenarios/<scenario-name>/design.md` - 设计文档
- `scenarios/<scenario-name>/tasks.md` - 本文档
- `scenarios/<scenario-name>/exploration-notes.md` - Web 探索记录
- 更新的 `src/README.md` 或相关文档

---

## 风险和注意事项

### 风险
- **选择器失效**: UI 变更可能导致选择器失效
- **等待时间不足**: 网络或性能问题可能导致超时
- **配置项变化**: Dify 功能更新可能改变配置方式
- **动态 ID**: 节点 ID 动态生成可能影响变量引用

### 缓解措施
- 使用稳定的选择器策略（文本、角色优先）
- 使用条件等待代替固定等待
- 定期更新 `doc/` 文件夹中的背景文档
- 使用相对定位和变量选择器 UI 交互

### 注意事项
- 每个任务完成后立即验证
- 发现问题及时记录和调整
- 保持测试代码与文档同步
- 遵循现有编程范式和代码风格
```

### 4.3 生成步骤
1. 从 `design.md` 提取实现步骤
2. 将每个设计点转化为独立任务
3. 定义每个任务的输入、输出、步骤、验证标准
4. 确保任务顺序合理，依赖关系清晰
5. 添加风险和注意事项
6. 保存到 `scenarios/<scenario-name>/tasks.md`

---

## 阶段 5: 实现测试代码

### 5.1 按照 Tasks.md 执行
严格按照 `tasks.md` 中定义的任务顺序执行，每完成一个任务后验证。

### 5.2 持续验证
- 每个任务完成后运行相关代码（如果可独立运行）
- 使用 Playwright MCP 工具验证 UI 交互
- 及时修正问题，更新文档

### 5.3 代码风格
- 参考 `03-knowledge-retrieval-rag.case.spec.ts` 的编程范式
- 保持与现有代码一致的风格
- 使用清晰的命名和注释

---

## 阶段 6: 测试和迭代

### 6.1 本地测试
```bash
npx playwright test src/cases/<XX>-<scenario-name>.case.spec.ts
```

### 6.2 调试失败
如果测试失败：
1. 使用 Playwright MCP 工具重新执行失败的步骤
2. 使用 `browser_snapshot` 观察实际页面状态
3. 对比测试代码和实际操作的差异
4. 精确修改有问题的部分（不要改动无关代码）
5. 重新运行测试

### 6.3 迭代优化
- 优化等待时间
- 改进选择器稳定性
- 增强错误处理
- 补充边界测试

---

## 阶段 7: 文档同步和归档

### 7.1 最终文档更新
- 确保 `requirements.md`、`design.md`、`tasks.md` 与实现一致
- 更新 `exploration-notes.md` 记录最终发现
- 更新 `doc/` 文件夹中的通用文档（如有新发现）

### 7.2 归档
- 将 `scenarios/<scenario-name>/` 文件夹作为完整记录
- 在 `src/README.md` 中添加测试用例索引
- 提交代码和文档到版本控制

---

## 工作流程总结图

```
┌─────────────────────────────────────────────────────────────┐
│ 阶段 0: 初始化                                               │
│ - 接收场景                                                   │
│ - 创建目录结构                                               │
│ - 验证前置条件                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 阶段 1: Web 探索（重要！）                                   │
│ - 使用 Playwright MCP 工具交互式探索                         │
│ - 记录 DOM 结构、选择器、交互方式                            │
│ - 观察等待时间、状态变化、错误信息                           │
│ - 输出：exploration-notes.md                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 阶段 2: 生成 Requirements.md                                 │
│ - 基于用户场景和 Web 探索                                    │
│ - 参考 testcases/03_output_autogent.md 的格式和粒度          │
│ - 详细的配置步骤、运行步骤、断言要点、边界测试               │
│ - 输出：requirements.md                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 阶段 3: 生成 Design.md                                       │
│ - 基于 requirements.md 和现有编程范式                        │
│ - 参考 03-knowledge-retrieval-rag.case.spec.ts               │
│ - 设计配置对象、辅助函数、选择器、等待策略、断言             │
│ - 输出：design.md                                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 阶段 4: 生成 Tasks.md                                        │
│ - 基于 design.md 分解为可执行任务                            │
│ - 每个任务独立、可验证                                       │
│ - 定义输入、输出、步骤、验证标准                             │
│ - 输出：tasks.md                                             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 阶段 5: 实现测试代码                                         │
│ - 严格按照 tasks.md 执行                                     │
│ - 每个任务完成后验证                                         │
│ - 遵循现有编程范式                                           │
│ - 输出：测试代码文件                                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 阶段 6: 测试和迭代                                           │
│ - 运行测试                                                   │
│ - 使用 Playwright MCP 调试失败                               │
│ - 精确修改问题代码                                           │
│ - 重复直到通过                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 阶段 7: 文档同步和归档                                       │
│ - 更新所有文档与实现一致                                     │
│ - 更新通用文档（doc/ 文件夹）                                │
│ - 归档到 scenarios/<scenario-name>/                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 关键成功因素

### 1. **充分的 Web 探索**
   - 不要跳过或简化 Web 探索阶段
   - 使用 Playwright MCP 工具真实交互，不要假设
   - 详细记录每个发现

### 2. **文档驱动开发**
   - 先完成 Requirements、Design、Tasks 三个文档
   - 文档之间相互引用和验证
   - 文档是实现的蓝图和验收标准

### 3. **模块化和复用**
   - 优先使用现有辅助函数
   - 新函数设计时考虑复用性
   - 配置集中化管理

### 4. **精确修改**
   - 只修改有问题的部分
   - 不要改动无关代码
   - 每次修改后验证

### 5. **持续验证**
   - 每个任务完成后立即验证
   - 使用 Playwright MCP 工具对比实际页面
   - 及时发现和修正问题

### 6. **文档同步**
   - 实现过程中发现与文档不符，立即更新文档
   - 保持代码、文档、实际页面三者一致

---

## 使用建议

### 对于 AI 助手
1. **严格遵循阶段顺序**，不要跳跃
2. **阶段 1（Web 探索）是关键**，必须充分完成
3. 生成每个文档时，参考前一阶段的输出和相关示例
4. 实现代码时，严格按照 `tasks.md` 的任务顺序
5. 遇到问题时，回到 Web 探索阶段重新验证

### 对于用户
1. 提供清晰的场景描述
2. 指出场景的特殊性和关注点
3. 如果有参考文档或示例，提供链接
4. 验收时重点检查文档完整性和代码质量

---

## 附录：工具和资源

### Playwright MCP 工具
- `mcp_playwright_browser_navigate` - 导航到 URL
- `mcp_playwright_browser_snapshot` - 获取页面快照
- `mcp_playwright_browser_click` - 点击元素
- `mcp_playwright_browser_type` - 输入文本
- `mcp_playwright_browser_wait_for` - 等待元素或文本
- 更多工具参考 Playwright MCP 文档

### 参考文档位置
- `doc/` - Dify 背景文档
- `testcases/03_output_autogent.md` - 需求文档参考
- `src/cases/03-knowledge-retrieval-rag.case.spec.ts` - 编程范式参考
- `src/index.ts` - 辅助函数库
- `auth/user.json` - 登录信息

### 目录结构
```
scenarios/
  └── <scenario-name>/
      ├── exploration-notes.md    # Web 探索记录
      ├── requirements.md         # 需求文档
      ├── design.md              # 设计文档
      └── tasks.md               # 任务分解
```

---

记住：**质量优于速度**。充分的探索和规划是成功的关键！
