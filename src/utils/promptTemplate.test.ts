import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractPromptVariables,
  interpolatePrompt,
  validatePromptTemplate,
} from './promptTemplate';

test('extractPromptVariables extracts double-brace variables correctly', () => {
  const template = 'Translate the following {{text}} from {{source_lang}} to {{target_lang}}.';
  const vars = extractPromptVariables(template);
  assert.deepEqual(vars, ['text', 'source_lang', 'target_lang']);
});

test('extractPromptVariables deduplicates repeated variables', () => {
  const template = 'Review {{code}} and optimize {{code}} for production.';
  const vars = extractPromptVariables(template);
  assert.deepEqual(vars, ['code']);
});

test('interpolatePrompt replaces variables properly', () => {
  const template = 'Write a {{tone}} story about a {{animal}} who loves {{hobby}}.';
  const vars = {
    tone: 'whimsical',
    animal: 'red panda',
    hobby: 'baking pies',
  };
  const interpolated = interpolatePrompt(template, vars);
  assert.equal(
    interpolated,
    'Write a whimsical story about a red panda who loves baking pies.'
  );
});

test('validatePromptTemplate returns metadata', () => {
  const template = 'Analyze this {{dataset}} with format {{format}}.';
  const meta = validatePromptTemplate(template);
  assert.equal(meta.variableCount, 2);
  assert.deepEqual(meta.variables, ['dataset', 'format']);
  assert.ok(meta.charCount > 0);
});
