/**
 * Code generation templates for Python, TypeScript, and cURL
 * aligned with the official modern @google/genai SDK
 */

export interface CodeExportOptions {
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  systemInstruction?: string;
  groundingSearch?: boolean;
  codeExecution?: boolean;
  responseMimeType?: string;
  responseSchemaText?: string;
  messages: Array<{
    role: 'user' | 'model';
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
  }>;
}

export function generatePythonCode(options: CodeExportOptions): string {
  const contentsFormatted = options.messages.map((m) => {
    const textParts = m.parts
      .filter((p) => p.text)
      .map((p) => p.text)
      .join('\n');
    return {
      role: m.role,
      parts: textParts,
    };
  });

  const tools: string[] = [];
  if (options.groundingSearch) {
    tools.push('{"google_search": {}}');
  }
  if (options.codeExecution) {
    tools.push('{"code_execution": {}}');
  }

  let schemaPython = '';
  if (
    options.responseMimeType === 'application/json' &&
    options.responseSchemaText?.trim()
  ) {
    try {
      const parsed = JSON.parse(options.responseSchemaText);
      schemaPython = `        response_schema=${JSON.stringify(parsed, null, 8).trimStart()},\n`;
    } catch {
      // ignore
    }
  }

  return `import os
from google import genai
from google.genai import types

# Ensure GEMINI_API_KEY is configured in your environment
client = genai.Client()

response = client.models.generate_content(
    model="${options.model}",
    contents=${JSON.stringify(contentsFormatted, null, 4)},
    config=types.GenerateContentConfig(
        temperature=${options.temperature},
        top_p=${options.topP},
        top_k=${options.topK},
        max_output_tokens=${options.maxOutputTokens},
${options.systemInstruction ? `        system_instruction="${options.systemInstruction.replace(/"/g, '\\"')}",\n` : ''}${tools.length > 0 ? `        tools=[${tools.join(', ')}],\n` : ''}${options.responseMimeType === 'application/json' ? `        response_mime_type="application/json",\n` : ''}${schemaPython}    )
)

print(response.text)
`;
}

export function generateTypeScriptCode(options: CodeExportOptions): string {
  const contents = options.messages.map((m) => ({
    role: m.role,
    parts: m.parts.map((p) => {
      if (p.inlineData) {
        return {
          inlineData: {
            mimeType: p.inlineData.mimeType,
            data: '<BASE64_DATA>',
          },
        };
      }
      return { text: p.text || '' };
    }),
  }));

  const tools: string[] = [];
  if (options.groundingSearch) {
    tools.push('{ googleSearch: {} }');
  }
  if (options.codeExecution) {
    tools.push('{ codeExecution: {} }');
  }

  let schemaTs = '';
  if (
    options.responseMimeType === 'application/json' &&
    options.responseSchemaText?.trim()
  ) {
    try {
      const parsed = JSON.parse(options.responseSchemaText);
      schemaTs = `      responseSchema: ${JSON.stringify(parsed, null, 6).trimStart()},\n`;
    } catch {
      // ignore
    }
  }

  return `import { GoogleGenAI } from '@google/genai';

// Uses process.env.GEMINI_API_KEY automatically
const client = new GoogleGenAI();

async function run() {
  const response = await client.models.generateContent({
    model: '${options.model}',
    contents: ${JSON.stringify(contents, null, 4)},
    config: {
      temperature: ${options.temperature},
      topP: ${options.topP},
      topK: ${options.topK},
      maxOutputTokens: ${options.maxOutputTokens},
${options.systemInstruction ? `      systemInstruction: ${JSON.stringify(options.systemInstruction)},\n` : ''}${tools.length > 0 ? `      tools: [${tools.join(', ')}],\n` : ''}${options.responseMimeType === 'application/json' ? `      responseMimeType: 'application/json',\n` : ''}${schemaTs}    }
  });

  console.log(response.text);
}

run().catch(console.error);
`;
}

export function generateCurlCode(options: CodeExportOptions): string {
  const contents = options.messages.map((m) => ({
    role: m.role,
    parts: m.parts.map((p) => {
      if (p.inlineData) {
        return {
          inlineData: {
            mimeType: p.inlineData.mimeType,
            data: '<BASE64_DATA>',
          },
        };
      }
      return { text: p.text || '' };
    }),
  }));

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: options.temperature,
      topP: options.topP,
      topK: options.topK,
      maxOutputTokens: options.maxOutputTokens,
      responseMimeType: options.responseMimeType || 'text/plain',
    },
  };

  if (options.systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  return `curl "https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=\${GEMINI_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload, null, 2)}'`;
}
