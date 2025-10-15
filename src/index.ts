// 类型定义
export * from './types';

// 工作流基础操作
export * from './workflow-helpers';

// 变量配置
export * from './variable-configurators';

// 节点配置
export * from './node-configurators';

// 执行和等待
export * from './execution-helpers';

// 常用配置预设
export const COMMON_CONFIGS = {
  // Travel Basic LLM workflow配置
  TRAVEL_BASIC_LLM: {
    app: {
      name: 'Travel Basic LLM',
      description: 'Basic travel planning workflow using LLM to generate travel itineraries'
    },
    startVariable: {
      name: 'context',
      label: 'Context'
    },
    llm: {
      title: 'PlanLLM',
      systemPrompt: 'You are a helpful travel planning assistant. Produce a concise 3-day plan with specific recommendations for attractions, dining, and transportation.\n\nContext:\n{{#context#}}',
      userMessage: 'Please create a travel plan for: {{#context#}}',
      contextVariable: 'context'
    },
    endVariable: {
      name: 'travel_plan',
      sourceNode: 'PlanLLM',
      sourceField: 'text'
    },
    testInput: {
      text: '5-day Tokyo trip in April, budget $2000'
    },
    validation: {
      minAnswerLength: 10,
      maxWaitTimeMs: 10000
    }
  },
  
  // Knowledge Retrieval RAG workflow配置
  KNOWLEDGE_RETRIEVAL_RAG: {
    app: {
      name: 'Knowledge Retrieval RAG',
      description: 'Knowledge retrieval workflow using RAG to answer questions based on uploaded documents'
    },
    startVariable: {
      name: 'question',
      label: 'Question'
    },
    knowledgeRetrieval: {
      title: 'KnowledgeRetrieval',
      queryVariable: 'question',
      knowledgeBase: 'autogen.txt'
    },
    llm: {
      title: 'AnswerSynthesizer',
      systemPrompt: 'You are a helpful assistant. Use the provided context to answer the user\'s question. If the information is not available in the context, say so clearly.\n\nContext:\n{{#context#}}',
      userMessage: '{{#question#}}',
      contextVariable: 'result'
    },
    endVariable: {
      name: 'answer',
      sourceNode: 'AnswerSynthesizer',
      sourceField: 'text'
    },
    testInput: {
      text: 'What are agent types?'
    },
    validation: {
      minAnswerLength: 15,
      maxWaitTimeMs: 10000
    }
  }
};

// 重试配置预设
export const RETRY_CONFIGS = {
  FAST: { maxAttempts: 2, delayMs: 1000, timeoutMs: 5000 },
  STANDARD: { maxAttempts: 3, delayMs: 2000, timeoutMs: 10000 },
  PATIENT: { maxAttempts: 5, delayMs: 3000, timeoutMs: 15000 }
};