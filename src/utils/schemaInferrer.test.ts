import test from 'node:test';
import assert from 'node:assert/strict';
import {
  inferSchemaFromValue,
  inferSchemaFromJsonString,
  validateSchemaText,
} from './schemaInferrer';

test('inferSchemaFromValue correctly infers primitives and objects', () => {
  const sample = {
    name: 'Gemini',
    version: 3,
    active: true,
    tags: ['ai', 'multimodal'],
  };

  const schema = inferSchemaFromValue(sample);
  assert.equal(schema.type, 'OBJECT');
  assert.ok(schema.properties);
  assert.equal(schema.properties.name.type, 'STRING');
  assert.equal(schema.properties.version.type, 'INTEGER');
  assert.equal(schema.properties.active.type, 'BOOLEAN');
  assert.equal(schema.properties.tags.type, 'ARRAY');
  assert.equal(schema.properties.tags.items?.type, 'STRING');
});

test('inferSchemaFromJsonString parses raw JSON string into OpenAPI schema', () => {
  const jsonStr = JSON.stringify({
    recipeName: 'Chocolate Chip Cookies',
    bakeMinutes: 12.5,
    ingredients: ['flour', 'sugar', 'chocolate chips'],
  });

  const res = inferSchemaFromJsonString(jsonStr);
  assert.equal(res.success, true);
  assert.ok(res.schemaText);
  assert.equal(res.schema?.type, 'OBJECT');
  assert.equal(res.schema?.properties?.bakeMinutes.type, 'NUMBER');
});

test('validateSchemaText validates proper schema structures', () => {
  assert.equal(validateSchemaText('').isValid, true);
  assert.equal(validateSchemaText('{"type": "OBJECT"}').isValid, true);
  assert.equal(validateSchemaText('{"invalid": true}').isValid, false);
  assert.equal(validateSchemaText('not json').isValid, false);
});
