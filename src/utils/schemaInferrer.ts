/**
 * Schema Inferrer: Converts arbitrary JSON examples into Gemini/OpenAPI-compatible
 * JSON schema definitions for structured outputs (`responseSchema`).
 */

export interface SchemaNode {
  type: 'STRING' | 'NUMBER' | 'INTEGER' | 'BOOLEAN' | 'ARRAY' | 'OBJECT';
  description?: string;
  items?: SchemaNode;
  properties?: Record<string, SchemaNode>;
  required?: string[];
}

/**
 * Infers a Gemini OpenAPI-compatible schema from a JavaScript value
 */
export function inferSchemaFromValue(value: unknown): SchemaNode {
  if (value === null || value === undefined) {
    return { type: 'STRING', description: 'Nullable value' };
  }

  if (typeof value === 'string') {
    return { type: 'STRING' };
  }

  if (typeof value === 'boolean') {
    return { type: 'BOOLEAN' };
  }

  if (typeof value === 'number') {
    return Number.isInteger(value) ? { type: 'INTEGER' } : { type: 'NUMBER' };
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return {
        type: 'ARRAY',
        items: { type: 'STRING' },
      };
    }
    // Infer from the first item or merge
    return {
      type: 'ARRAY',
      items: inferSchemaFromValue(value[0]),
    };
  }

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const properties: Record<string, SchemaNode> = {};
    const keys = Object.keys(obj);

    keys.forEach((key) => {
      properties[key] = inferSchemaFromValue(obj[key]);
    });

    return {
      type: 'OBJECT',
      properties,
      required: keys,
    };
  }

  return { type: 'STRING' };
}

/**
 * Parses raw JSON string and returns the Gemini schema formatted string
 */
export function inferSchemaFromJsonString(jsonString: string): {
  success: boolean;
  schema?: SchemaNode;
  schemaText?: string;
  error?: string;
} {
  try {
    const trimmed = jsonString.trim();
    if (!trimmed) {
      return { success: false, error: 'Empty JSON input provided.' };
    }
    const parsed = JSON.parse(trimmed);
    const schema = inferSchemaFromValue(parsed);
    return {
      success: true,
      schema,
      schemaText: JSON.stringify(schema, null, 2),
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid JSON format';
    return { success: false, error: message };
  }
}

/**
 * Validates whether a schema string is valid JSON and conformant
 */
export function validateSchemaText(schemaText: string): {
  isValid: boolean;
  error?: string;
} {
  if (!schemaText.trim()) return { isValid: true };
  try {
    const parsed = JSON.parse(schemaText);
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: 'Schema root must be a valid JSON Object.' };
    }
    if (!parsed.type) {
      return { isValid: false, error: 'Schema must have a "type" field (e.g. OBJECT or ARRAY).' };
    }
    return { isValid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Malformed JSON';
    return { isValid: false, error: message };
  }
}
