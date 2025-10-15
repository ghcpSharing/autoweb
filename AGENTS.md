# Dify Workflow 测试生成 AI Agent 指令

本文档定义了 AI Agent 的核心原则、工作模式和执行流程。

## 1. 核心思维原则

- **系统性思维**: 从整体架构分析到具体实现，遵循完整的工作流程。
- **辩证思维**: 评估多种解决方案的优缺点，选择最优策略。
- **创新思维**: 在遵循最佳实践的同时，灵活应对特殊场景。
- **批判性思维**: 从多个角度验证和优化解决方案，持续迭代改进。
- **文档驱动**: 先规划后执行，文档是实现的蓝图和验收标准。

## 2. 工作模式：两阶段执行

### 阶段 A：规划阶段（Plan Generation）
**目标**: 基于用户场景和 Web 探索，生成完整的执行计划文档。

**核心文档**: `.instructions/test-generation-workflow-plan.md`

**职责**:
1. 理解用户提供的 Dify workflow 测试场景，注意客户需要 workflow 一定要包含 End 节点用于输出结果。
2. 使用 Playwright MCP 工具深入探索 Dify 页面
3. 生成三大核心规划文档：
   - `scenarios/<scenario-name>/requirements.md` - 详细需求文档
   - `scenarios/<scenario-name>/design.md` - 技术设计文档
   - `scenarios/<scenario-name>/tasks.md` - 任务分解文档
4. 记录探索过程到 `scenarios/<scenario-name>/exploration-notes.md`

**关键原则**:
- ⚠️ **绝不过早生成代码** - 必须先完成所有规划文档
- ⚠️ **充分的 Web 探索** - 使用 Playwright MCP 真实交互，记录 DOM 结构和选择器
- ⚠️ **文档完整性** - 规划文档必须详尽，作为执行阶段的唯一依据

### 阶段 B：执行阶段（Workflow Execution）
**目标**: 严格按照生成的规划文档实现测试代码。

**核心文档**: `.instructions/dify-playwright-test-generation.md`

**职责**:
1. 读取并理解 `scenarios/<scenario-name>/` 下的所有规划文档
2. 严格按照 `tasks.md` 定义的任务顺序执行
3. 参考 `design.md` 的技术设计实现代码
4. 使用 `requirements.md` 验证实现的完整性
5. 持续使用 Playwright MCP 工具验证每个步骤

**关键原则**:
- ⚠️ **严格遵循计划** - 不偏离 tasks.md 定义的任务和顺序
- ⚠️ **精确修改** - 只修改有问题的部分，不改动无关代码
- ⚠️ **持续验证** - 每个任务完成后立即验证
- ⚠️ **文档同步** - 发现与规划不符时，先更新文档再修改代码

## 3. 指令框架概览

### 3.1 规划阶段指令
**主指令**: [`.instructions/test-generation-workflow-plan.md`](.instructions/test-generation-workflow-plan.md)

**包含内容**:
- 完整的 7 个工作阶段定义
- 三大核心文档的详细模板（requirements.md、design.md、tasks.md）
- Web 探索的详细指导
- 文档生成的步骤和验证标准

**启动条件**: 
- 用户提供新的 Dify workflow 测试场景
- 或用户明确要求生成测试计划

**输出物**:
```
scenarios/<scenario-name>/
├── exploration-notes.md    # Web 探索记录
├── requirements.md         # 需求文档（参考 testcases/03_output_autogent.md）
├── design.md              # 设计文档（参考 src/cases/03-knowledge-retrieval-rag.case.spec.ts）
└── tasks.md               # 任务分解（15个详细任务）
```

### 3.2 执行阶段指令
**主指令**: [`.instructions/dify-playwright-test-generation.md`](.instructions/dify-playwright-test-generation.md)

**包含内容**:
- 测试代码实现的详细步骤
- Playwright MCP 工具使用指导
- 代码质量标准和最佳实践
- 错误处理和调试策略

**启动条件**:
- 规划阶段的所有文档已生成且完整
- 或用户明确要求开始实现测试代码

**输出物**:
```
src/
├── cases/<XX>-<scenario-name>.case.spec.ts  # 测试代码
├── index.ts                                  # 更新的配置和辅助函数
├── types.ts                                  # 新增类型定义（如有）
└── <module>-*.ts                            # 新增辅助函数（如有）
```

**运行与调试测试**
  -  **禁止使用** `sleep` 这样的 bash 命令来等待，因为当前的 vscode terminal 在执行这个命令时会把之前的npx playwright test给强制中断掉。可以参考上面的做法，把输出重定向到一个log文件中，然后用tee命令把输出打印到终端和log文件中。
   ```bash
  npx playwright test src/cases/<XX>-<scenario-name>.case.spec.ts 2>&1 | tee test-output.log
  ```
  - 当测试执行失败后，可参考 `src/cases` 下的已有测试用例代码的写法。也需要参考 `exploration-notes.md` 中的记录
  - 如果测试执行失败后，发现是因为页面元素选择器不对，或者页面交互方式不对，则需要使用 Playwright MCP 工具重新探索页面 URL，确认正确的选择器和交互方式，然后再修改测试代码。
  - 在跟踪测试情况时，需要输入命令来查看测试过程或结果时**一定要新建终端窗口**来验证，否则会把之前的测试给中断，导致失败。
### 3.3 通用参考文档
以下文档适用于规划和执行两个阶段：

1. **背景知识文档** (`doc/` 文件夹)
   - `dify.workflow.features.md` - Workflow 功能特性
   - `dify.workflow.page-structure.md` - 页面结构
   - `dify.workflow.node-knowledge-retrieval.md` - 知识检索节点
   - `dify.workflow.run-panel.md` - 运行面板
   - `dify.workflow.start-node-input-field.md` - 开始节点输入字段

2. **参考示例**
   - `testcases/03_output_autogent.md` - 需求文档格式参考
   - `src/cases/03-knowledge-retrieval-rag.case.spec.ts` - 编程范式参考
   - `src/cases/01-travel-basic-llm.case.spec.ts` - 基础测试示例

3. **环境配置**
   - `auth/user.json` - Dify 登录信息
   - 目标环境: `dify.xxx.com`

## 4. AI Agent 执行流程

```
┌──────────────────────────────────────┐
│ 用户输入：Dify workflow 测试场景描述     │
└────────────────────┬─────────────────┘
                     │
                     ▼
┌─────────────────────────────────┐   
│ 🅰️ 进入规划阶段                  │   
│                                 │   
│ 📋 读取主指令：                  │  
│ test-generation-workflow-       │   
│ plan.md                         │   
│                                 │   
│ 📝 执行步骤：                    │  
│ 1. 理解场景                     │   
│ 2. 创建目录结构                 │   
│ 3. Web 探索（重点！）           │   
│ 4. 生成 requirements.md         │   
│ 5. 生成 design.md               │   
│ 6. 生成 tasks.md                │   
│                                 │   
│ ✅ 输出：3个完整的规划文档        │ 
│                                 │   
└────────────────┬────────────────┘   
                 │       
                 ▼       
 ┌─────────────────────────────────┐
 │ 🅱️ 进入执行阶段                  │
 │                                 │
  │ 📋 读取主指令：                  │
 │ dify-playwright-test-           │
 │ generation.md                   │
 │                                 │
  │ 📝 执行步骤：                    │
 │ 1. 读取规划文档                 │
 │ 2. 按 tasks.md 顺序执行         │
 │ 3. 参考 design.md 实现          │
 │ 4. 持续使用 Playwright MCP      │
 │ 5. 运行测试与调试，并迭代处理直到通过所有验证 │
 │ 6. 文档同步和归档               │
   │                                 │
 │ ✅ 输出：可运行的测试代码        │
 └────────────────────────────────┘


```

## 5. 关键原则和注意事项

### 5.1 阶段分离原则
- **规划阶段不写代码**：专注于文档生成和探索记录
- **执行阶段不偏离计划**：严格遵循 tasks.md 的定义
- **明确阶段切换**：规划完成后，明确询问用户是否继续执行

### 5.2 文档驱动原则
- **文档是唯一真相**：规划文档是执行阶段的唯一依据
- **文档先行**：发现问题先更新文档，再修改代码
- **文档同步**：实现过程中保持代码和文档一致

### 5.3 Web 页面探索原则
- **真实交互**：使用 Playwright MCP 工具，不要假设或猜测
- **详细记录**：记录每个 DOM 结构、选择器、交互方式
- **持续验证**：每个步骤后使用 `browser_snapshot` 观察变化，需要做持续探索与记录。将requirments.md中提到的所有断言点都用 Playwright MCP 工具验证一遍，确保选择器和交互方式正确，并记录到 exploration-notes.md 中. 你如果遇到某个问题一直不能解决，需要参考 `testcases/03_output_autogent.md` 中的描述，看看它是怎么描述这个问题的，然后再用 Playwright MCP 工具重新探索页面，确认正确的选择器和交互方式。例如变量传传递，运行面板的变量输入等等。 也需要可以在 `doc/dify.workflow.faq.md` 中找到相关的常见问题解答。
- **心得记录**：解决问题的思路和方法也要记录到 exploration-notes.md 中



### 5.4 精确修改原则
- **局部修改**：只修改有问题的部分
- **避免引入新问题**：不改动无关代码
- **逐步验证**：每次修改后立即验证

### 5.5 质量优先原则
- **质量优于速度**：宁可多花时间探索和规划
- **完整性**：确保文档和代码的完整性
- **可维护性**：遵循现有编程范式和代码风格

## 6. 工作流程总结

```
用户场景 
  ↓
🅰️ 规划阶段（Plan Generation）
  ├─ Web 探索 → exploration-notes.md
  ├─ 需求分析 → requirements.md
  ├─ 技术设计 → design.md
  └─ 任务分解 → tasks.md
  ↓
🅱️ 执行阶段（Workflow Execution）
  ├─ 任务 1-15：实现测试代码
  ├─ 持续验证和调试
  └─ 文档同步和归档
  ↓
✅ 完整交付物
  ├─ scenarios/<scenario-name>/ (规划文档)
  └─ src/cases/<XX>-<scenario-name>.case.spec.ts (测试代码)
```

## 7. AI Agent 自检清单

### 规划阶段完成检查
- [ ] 用户场景已充分理解
- [ ] 使用 Playwright MCP 完成充分的 Web 探索
- [ ] `exploration-notes.md` 记录详细且完整
- [ ] `requirements.md` 格式和粒度符合参考示例
- [ ] `design.md` 技术设计清晰且可执行
- [ ] `tasks.md` 任务分解详细且独立, 同时要求最终能把workflow 运行起来并获得 workflow 运行结果
- [ ] 所有文档已保存到 `scenarios/<scenario-name>/`
- [ ] 已询问用户是否继续执行

### 执行阶段完成检查
- [ ] 已读取并理解所有规划文档
- [ ] 严格按照 `tasks.md` 顺序执行
- [ ] 每个任务完成后已验证
- [ ] 测试代码符合 `design.md` 的设计
- [ ] 所有 `requirements.md` 的断言点已覆盖
- [ ] 测试已通过本地执行，调试过程参考`exploration-notes.md` 与 `src/cases` 下的已有测试用例代码的写法
- [ ] 文档已与实现同步
- [ ] 代码已归档并更新 README

## 8. 参考资源快速索引

| 资源类型 | 文件路径 | 用途 |
|---------|---------|------|
| 规划阶段主指令 | `.instructions/test-generation-workflow-plan.md` | 生成规划文档的详细指导 |
| 执行阶段主指令 | `.instructions/dify-playwright-test-generation.md` | 实现测试代码的详细指导 |
| 需求文档参考 | `testcases/03_output_autogent.md` | 需求文档的格式和粒度参考 |
| 编程范式参考 | `src/cases/03-knowledge-retrieval-rag.case.spec.ts` | 测试代码的结构和风格参考 |
| FAQ 参考 | `doc/dify.workflow.faq.md` | 常见问题解答 |
| 辅助函数库 | `src/index.ts` | 现有的辅助函数和配置 |
| 背景知识 | `doc/*.md` | Dify workflow 的背景信息 |
| 登录信息 | `auth/user.json` | Dify 环境认证配置 |

---

**记住**: AI Agent 的核心价值在于**先规划，后执行**。充分的规划是成功实现的关键！