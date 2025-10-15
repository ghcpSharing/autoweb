import type { Page } from '@playwright/test';

// 基础工作流配置
export interface WorkflowConfig {
  app: AppConfig;
  startVariable: StartVariableConfig;
  nodes: NodeConfig[];
  endVariable: EndVariableConfig;
  testInput: TestInputConfig;
  validation: ValidationConfig;
}

export interface AppConfig {
  name: string;
  description: string;
}

export interface StartVariableConfig {
  name: string;
  label: string;
}

export interface EndVariableConfig {
  name: string;
  sourceNode: string;
  sourceField: string;
}

export interface TestInputConfig {
  text: string;
  placeholder?: string;
}

export interface ValidationConfig {
  minAnswerLength: number;
  maxWaitTimeMs: number;
}

// 执行附加选项
export interface ExecutionOptions {
  /** 启动执行后固定等待时间（LLM 生成缓冲），默认 5000ms */
  fixedWaitMs?: number;
}

// 节点配置
export interface NodeConfig {
  type: 'LLM' | 'KnowledgeRetrieval' | 'End';
  title: string;
  config: LLMConfig | KnowledgeRetrievalConfig | EndConfig;
}

export interface LLMConfig {
  systemPrompt: string;
  userMessage: string;
  contextVariable: string;
}

export interface KnowledgeRetrievalConfig {
  queryVariable: string;
  knowledgeBase: string;
}

export interface EndConfig {
  /** 最终输出变量名称 */
  outputVariable: string;
  /** 来源节点输出字段（例如 LLM 节点的 text） */
  sourceVariable: string; // 保留向后兼容，用于变量选择器中显示的变量名，如 text
  /** 来源节点标题（用于更精准选择 Set variable 时显示的变量，如 PlanLLM.text） */
  sourceNode?: string;
  /** 部分 UI 显示可能是 node.field 形式，此字段用于备用匹配 */
  sourceField?: string;
}

// 执行结果
export interface WorkflowExecutionResult {
  success: boolean;
  reason: string;
  answer: string;
  executionTimeMs?: number;
}

// 变量选择器配置
export interface VariableSelector {
  text: string;
  type?: 'string' | 'array[object]' | 'text';
  source?: string;
}

// 通用配置
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  timeoutMs: number;
}

export type SetVariableStrategy = 'byPosition' | 'bySection' | 'byText';

export interface ElementSelector {
  primary: string;
  fallbacks: string[];
  timeout?: number;
}