/**
 * Prompt Templating and Variable Extraction Utilities for Google AI Studio Freeform Prompts
 */

/**
 * Extracts variable names from template strings supporting {{variable}} and {variable}
 */
export function extractPromptVariables(template: string): string[] {
  if (!template) return [];
  // Match {{var_name}} or {var_name} (ignoring JSON double braces if not variables)
  const regex = /\{\{([a-zA-Z0-9_-]+)\}\}/g;
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(template)) !== null) {
    if (match[1]) {
      matches.add(match[1]);
    }
  }

  // Also check single braces {variable} if not already found as double
  const singleRegex = /(?<!\{)\{([a-zA-Z_][a-zA-Z0-9_-]*)\}(?!\})/g;
  while ((match = singleRegex.exec(template)) !== null) {
    if (match[1] && !matches.has(match[1])) {
      matches.add(match[1]);
    }
  }

  return Array.from(matches);
}

/**
 * Interpolates variables into template
 */
export function interpolatePrompt(
  template: string,
  variables: Record<string, string>
): string {
  if (!template) return '';
  let result = template;

  Object.entries(variables).forEach(([key, val]) => {
    // Replace {{key}}
    const doubleRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(doubleRegex, val ?? '');

    // Replace {key}
    const singleRegex = new RegExp(`(?<!\\{)\\{${key}\\}(?!\\})`, 'g');
    result = result.replace(singleRegex, val ?? '');
  });

  return result;
}

/**
 * Validates prompt template
 */
export function validatePromptTemplate(template: string): {
  variableCount: number;
  variables: string[];
  charCount: number;
} {
  const variables = extractPromptVariables(template);
  return {
    variableCount: variables.length,
    variables,
    charCount: template.length,
  };
}
