# Dify Workflow Start Node Input Field Structure (Updated based on src/variable-configurators.ts)

This document is the source of truth for the Start node input field area and the "Add Input Field" dialog, based on the latest implementation in `src/variable-configurators.ts` function `configureStartVariable()`.

## Summary
When a blank Workflow app is created, the Start node initially shows two system variables in the right configuration panel:
- `sys.files` of type `Array[File]`
- `sys.user_id` of type `String`

A custom user question variable (named `question`) must be added explicitly via the `Input Field` section's plus icon which triggers the "Add Input Field" dialog.

## Right Panel Structure After Selecting Start Node
Key DOM references observed (dynamic refs included for context only; they MUST NOT be used as stable selectors):

- Start node title input: placeholder `Add title...`
- Section header label: literal text `Input Field`
- Section action (add icon): clickable `<img>` with container having minimal classes (observed Playwright selector used: `.p-1 > .remixicon` in legacy code). In the current snapshot, the add icon triggered a dialog without exposing an accessible name. We rely on proximity to the `Input Field` header.
- Existing system variables appear as rows each containing:
  - An icon (img/svg)
  - A variable name prefixed with `sys.` (e.g. `sys.files`, `sys.user_id`)
  - A type label on the right (`Array[File]`, `String`)

## Add Input Field Dialog
Triggered by clicking the plus icon near the `Input Field` header.

Observed dialog characteristics:
- Title: `Add Input Field`
- Field groups:
  1. Field type choices (Short Text, Paragraph, Select, Number) each represented by a clickable tile. Default selection was `Short Text` (sufficient for `question`).
  2. Variable Name (textbox placeholder: `Please input`)
  3. Label Name (textbox placeholder: `Please input`)
  4. Max length (spinbutton default `48`)
  5. Required (toggle switch, default: checked)
- Action buttons: `Cancel` and `Save`

## Required Variable for Test
- Variable Name: `question`
- Label Name: `Question`
- Type: `Short Text` (default; no change needed)
- Required: keep enabled

After saving, the Start node's canvas representation updates to include a pill showing `question required` stacked inside the Start node button. In the right panel variable list, a new row appears for the custom variable, but initial snapshot contained a compact row preceding the system variables, indicating new custom variable UI grouping.

## Selector Strategy (Updated based on src/variable-configurators.ts)
The current implementation uses a robust multi-strategy approach with modal and inline detection:

1. **Ensure Start node selected**:
```typescript
const startNode = page.getByText('Start').first();
await startNode.click();
await page.waitForTimeout(400);
```

2. **Check for existing variable**:
```typescript
const variableLabel = page.locator(`text=/^${variableName}$/i`).first();
if (await variableLabel.isVisible()) {
  console.log(`Start variable '${variableName}' already exists`);
  return true;
}
```

3. **Trigger Add Input Field dialog with multiple strategies**:
```typescript
// Primary: Find plus icon near Input Field header
const header = page.locator('text=/Input Field|输入字段/').first();
const container = header.locator('xpath=..');
const plusIcon = container.locator('button, img, svg').filter({ hasNotText: /Input Field|输入字段/ }).first();

// Fallback triggers if dialog doesn't appear
const triggerCandidates = [
  page.getByRole('button', { name: /Add Input Field|Add Input|Add variable|添加输入|新增输入/ }),
  page.locator('button:has-text("+")'),
  page.locator('.p-1 > .remixicon'),
];
```

4. **Handle both Modal and Inline styles**:

**Modal Style Detection**:
```typescript
const modalHeading = page.getByText(/Add Input Field|添加输入字段|添加输入/).first();
if (await modalHeading.isVisible()) {
  const modal = modalHeading.locator('xpath=../../..');
  const inputs = modal.locator('input');
  
  // Fill variable name (first input)
  await inputs.first().fill(variableName);
  // Fill label name (second input)  
  await inputs.nth(1).fill(label || variableName);
  // Click save button
  await modal.getByRole('button', { name: /Save|保存/ }).click();
}
```

**Inline Style Detection**:
```typescript
// Search for input placeholders
const placeholders = ['Variable name', 'Please input', '变量名', '变量名称'];
for (const ph of placeholders) {
  const field = page.getByPlaceholder(ph).first();
  if (await field.isVisible()) {
    await field.fill(variableName);
    await page.getByRole('button', { name: /Save|保存|Set variable|设置变量/ }).click();
    break;
  }
}
```

5. **Post-configuration verification**:
```typescript
// Loop with timeout to verify variable appears
const deadline = Date.now() + 8000; // 8s hard ceiling
while (Date.now() < deadline && !added) {
  if (await variableLabel.isVisible()) { 
    added = true; 
    break; 
  }
  await page.waitForTimeout(250);
}
```

## Failure Handling (Enhanced based on current implementation)
The current implementation includes robust error handling:

- **Timeout Control**: 8-second hard ceiling with 250ms intervals for checking variable appearance
- **Multiple Trigger Strategies**: If primary plus icon fails, tries multiple fallback selectors
- **Modal vs Inline Detection**: Automatically detects and handles both UI patterns
- **Graceful Degradation**: Continues to retry with different approaches until timeout
- **Detailed Logging**: Console output for debugging failed variable creation

```typescript
// Timeout and retry logic
const deadline = Date.now() + 8000;
while (Date.now() < deadline && !added) {
  // Multiple trigger attempts...
  if (await variableLabel.isVisible()) { 
    added = true; 
    break; 
  }
  await page.waitForTimeout(250);
}
console.log(`Start variable configuration ${added ? 'succeeded' : 'failed'}`);
```

## Edge Cases (Enhanced support)
The current implementation handles various UI variations:

- **Multiple Input Fields**: Uses indexed selection (`inputs.first()`, `inputs.nth(1)`) for name/label distinction
- **Localization Support**: Regex patterns for both English and Chinese text detection:
  - Headers: `/Input Field|输入字段/`
  - Dialog titles: `/Add Input Field|添加输入字段|添加输入/`  
  - Placeholders: `['Variable name', 'Please input', '变量名', '变量名称']`
  - Buttons: `/Save|保存|Set variable|设置变量/`
- **Modal vs Inline Detection**: Automatic detection and handling of different UI patterns
- **Dynamic Timing**: Adaptive waiting with timeout control rather than fixed delays

## Maintenance Notes
- Re-validate after any Dify UI update changing the Start node panel layout.
- The current implementation in `configureStartVariable()` provides multiple fallback strategies and should adapt to minor UI changes.
- If dialog structure changes significantly, update the modal/inline detection logic in `src/variable-configurators.ts`.
- Variable existence check (`text=/^${variableName}$/i`) should be updated if variable display format changes.

## Relation to Test Files
The `configureStartVariable()` function in `src/variable-configurators.ts` provides the main implementation matching this documentation. Any future selector refinements should update both this doc and the implementation together. The function is used by test cases that require custom Start node variables (e.g., `question` variable for Knowledge Retrieval workflows).
