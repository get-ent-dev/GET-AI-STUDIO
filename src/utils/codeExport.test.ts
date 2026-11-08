import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generatePythonCode,
  generateTypeScriptCode,
  generateCurlCode,
} from './codeExport';

const mockOptions = {
  model: 'gemini-3.8-flash',
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
  systemInstruction: 'You are an AI coding assistant.',
  groundingSearch: true,
  codeExecution: false,
  responseMimeType: 'text/plain',
  messages: [
    {
      role: 'user' as const,
      parts: [{ text: 'Hello, what is Gemini?' }],
    },
  ],
};

test('generatePythonCode generates valid snippet with tools and SDK import', () => {
  const code = generatePythonCode(mockOptions);
  assert.ok(code.includes('from google import genai'));
  assert.ok(code.includes('client = genai.Client()'));
  assert.ok(code.includes('model="gemini-3.8-flash"'));
  assert.ok(code.includes('"google_search": {}'));
  assert.ok(code.includes('system_instruction="You are an AI coding assistant."'));
});

test('generateTypeScriptCode generates valid snippet with @google/genai import', () => {
  const code = generateTypeScriptCode(mockOptions);
  assert.ok(code.includes("import { GoogleGenAI } from '@google/genai';"));
  assert.ok(code.includes("model: 'gemini-3.8-flash'"));
  assert.ok(code.includes('googleSearch: {}'));
});

test('generateCurlCode generates valid curl command', () => {
  const code = generateCurlCode(mockOptions);
  assert.ok(code.startsWith('curl '));
  assert.ok(code.includes('models/gemini-3.8-flash:generateContent'));
  assert.ok(code.includes('temperature'));
});
