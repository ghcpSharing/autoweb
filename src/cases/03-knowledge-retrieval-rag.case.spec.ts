import { test, expect } from '@playwright/test';
import { AuthHelper } from '../../utils/auth-helper';
import {
  createBlankWorkflow,
  configureStartVariable,
  configureKnowledgeRetrievalNode,
  configureLLMNode,
  configureEndNode,
  runWorkflowAndWaitForSuccess,
  COMMON_CONFIGS,
  type KnowledgeRetrievalConfig,
  type LLMConfig
} from '../index';

test.describe('Knowledge Retrieval RAG Workflow (Modular)', () => {
  test('should create and run a knowledge retrieval workflow with LLM', async ({ page }) => {
    console.log('=== Starting Knowledge Retrieval RAG Workflow Test ===');
    
    // Step 1: Authenticate
    const authHelper = new AuthHelper(page);
    await authHelper.ensureLoggedIn();
    
    // Step 2: Create a blank workflow using the config
    const config = COMMON_CONFIGS.KNOWLEDGE_RETRIEVAL_RAG;
    await createBlankWorkflow(page, config.app);
    
    // Step 3: Configure Start variable
    await configureStartVariable(
      page, 
      config.startVariable.name, 
      config.startVariable.label
    );
    
    // Step 4: Configure Knowledge Retrieval node
    const knowledgeRetrievalConfig: KnowledgeRetrievalConfig = {
      queryVariable: config.knowledgeRetrieval.queryVariable,
      knowledgeBase: config.knowledgeRetrieval.knowledgeBase
    };
    await configureKnowledgeRetrievalNode(
      page,
      config.knowledgeRetrieval.title,
      knowledgeRetrievalConfig
    );
    
    // Step 5: Configure LLM node
    const llmConfig: LLMConfig = {
      systemPrompt: config.llm.systemPrompt,
      userMessage: config.llm.userMessage,
      contextVariable: config.llm.contextVariable
    };
    await configureLLMNode(
      page,
      config.llm.title,
      llmConfig
    );
    
    // Step 6: Configure End node
    await configureEndNode(page, {
      outputVariable: config.endVariable.name,
      sourceVariable: config.endVariable.sourceField, // 'text' from LLM
      sourceNode: config.endVariable.sourceNode,
      sourceField: config.endVariable.sourceField
    });
    
    // Step 7: Run workflow and wait for success
    // Knowledge Retrieval + LLM processing needs more time, so increase fixed wait
    const result = await runWorkflowAndWaitForSuccess(
      page, 
      config.testInput,
      config.validation,
      { fixedWaitMs: 10000 } // Increase from default 5s to 10s for RAG processing
    );
    
    // Step 8: Validate the result
    expect(result.success).toBe(true);
    expect(result.answer).toBeTruthy();
    expect(result.answer.length).toBeGreaterThan(10);
    
    // Additional validation - should contain relevant content
    expect(result.answer.toLowerCase()).toMatch(/autogen|agent|system|ai/);
    
    console.log('=== Knowledge Retrieval RAG Workflow Test Complete ===');
    console.log('Final answer:', result.answer);
  });
});