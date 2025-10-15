# Dify Workflow Run Panel (Updated based on src/execution-helpers.ts)

## Overview
When executing a workflow test run inside the orchestrate canvas, Dify renders a transient **Run Panel** section above the canvas. It shows the run label (e.g., `Test Run#1`) and three tabs:

- RESULT
- DETAIL  
- TRACING

Based on the latest `src/execution-helpers.ts` implementation, we now have multiple completion detection strategies including explicit **SUCCESS badge** checking.

## Completion Indicators
Based on `waitForCompletionAndExtractResult()` in `src/execution-helpers.ts`, completion is detected using multiple strategies:

### 1. SUCCESS Status Chip (Primary)
```typescript
const successChip = page.locator('text=/^SUCCESS$/i').first();
if (await successChip.isVisible()) {
  completed = true;
  observedReason = 'SUCCESS chip detected';
}
```

### 2. Run Button State Transition  
```typescript
// Detects "Running" → "Run" state change
const runBtn = page.locator('button:has-text("Run")').first();
if (/^Run$/i.test(runBtnText.trim()) && sawRunning) {
  completed = true;
  observedReason = 'Run button state reverted';
}
```

### 3. Execution Metric Chips
Each node on successful completion shows a small metric chip:
- Start: duration in milliseconds (e.g., `10.720 ms`)
- Knowledge Retrieval: retrieval latency (e.g., `1.025 s`)
- LLM: token usage and total latency (e.g., `99 tokens · 1.641 s`)
- End: duration (e.g., `19.339 ms`)

```typescript
// Detection: at least 2 metric chips present
const metricChips = await page.locator('text=/\\d+ms$/').count();
if (metricChips >= 2) {
  completed = true;
  observedReason = 'Execution metrics present';
}
```

## Tabs
- RESULT: Aggregated final output and sometimes streamed or stitched content.
- DETAIL: (In this observation) did not contain a unique success keyword; toggling can force lazy components to mount.
- TRACING: Useful for deeper inspection; switching to it mid‑poll can also ensure data hydration.

Based on `src/execution-helpers.ts`, the implementation uses periodic tab switching to trigger content loading:
```typescript
// Periodic tab switching to trigger content loading
if (i % 6 === 2) { await detailTab.click(); }
if (i % 9 === 4) { await resultTab.click(); }
if (i % 11 === 5) { await tracingTab.click(); }
```

## Recommended Playwright Assertions
Based on `runWorkflowAndWaitForSuccess()` in `src/execution-helpers.ts`:

1. **Trigger run** via multiple candidate buttons with fallback:
```typescript
const candidateButtons = [
  page.locator('button:has-text("Run")').first(),
  page.getByText('Run', { exact: true }),
  page.locator('button:has-text("Test")').first(),
  page.locator('button:has-text("Test Run")').first()
];
```

2. **Wait for completion** using multi-strategy detection:
   - Primary: Poll for SUCCESS chip `text=/^SUCCESS$/i`
   - Secondary: Run button state transition "Running" → "Run"
   - Fallback: Metric chips count >= 2 `text=/\\d+ms$/`

3. **Extract answer content** from RESULT tab using scoped search strategy from `extractAnswerFromResultTab()`:
```typescript
// Prioritize search within test run containers
const testRunContainers = [
  page.locator('div').filter({ hasText: 'Test Run' }),
  page.locator('[class*="test-run"]'),
  page.locator('[data-testid*="result"]'),
  page.getByText('RESULT').locator('xpath=../..'),
];
```

## Anti‑Patterns
- Waiting for a literal `SUCCESS` string without fallback (current implementation provides multiple detection strategies).
- Hard‑coding node internal IDs (dynamic, e.g., numeric edge identifiers).
- Assuming the RESULT tab auto‑activates (current implementation includes tab clicking).
- Using fixed timeout without retry logic (current implementation uses configurable timeout with `validation.maxWaitTimeMs`).

## Configuration and Timeout Control
The current implementation provides configurable timeout control:
```typescript
// Dynamic timeout based on validation config
const maxWaitMs = validation.maxWaitTimeMs || 10000;  // Default 10s
const iterationIntervalMs = 1000;  // Check every second
const maxIterations = Math.floor(maxWaitMs / iterationIntervalMs);

// Fixed wait for LLM processing buffer
const fixedWaitMs = options.fixedWaitMs ?? 5000;  // Default 5s
```

## Future Enhancements
If Dify later introduces additional consolidated run status elements, the polling logic can be extended. The current implementation already provides a robust multi-strategy approach that can accommodate UI changes.

## Selector Heuristics (Updated based on src/execution-helpers.ts)
| Purpose | Primary Strategy | Fallback Strategy |
|---------|------------------|-------------------|
| Run trigger | `page.locator('button:has-text("Run")').first()` | `page.getByText('Run', { exact: true })` |
| Dialog detection | `page.getByText('Test Run', { exact: true })` | `page.locator('[role="dialog"]')` |
| Input field | `page.getByPlaceholder('Please input')` | `page.locator('div[role="dialog"]').locator('input, textarea')` |
| Completion (Primary) | `page.locator('text=/^SUCCESS$/i')` | N/A |
| Completion (Secondary) | Run button state `"Running" → "Run"` | N/A |
| Completion (Fallback) | `page.locator('text=/\\d+ms$/').count() >= 2` | N/A |
| Tabs | `page.getByText('RESULT'|'DETAIL'|'TRACING', { exact: true })` | Periodic clicking for content loading |
| Answer extraction | Scoped container search with UI filtering | Full page fallback with length filtering |

This document reflects the current implementation in `src/execution-helpers.ts` which provides multiple completion detection strategies and robust answer extraction.
