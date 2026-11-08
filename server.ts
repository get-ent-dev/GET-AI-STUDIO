import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get initialized GoogleGenAI instance
function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health & Status endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    defaultModel: 'gemini-3.8-flash',
  });
});

// SSE Streaming Generation Endpoint
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { config, messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const client = getGenAIClient();
    const model = config.model || 'gemini-3.8-flash';

    // Build Tool Array
    const tools: Record<string, unknown>[] = [];
    if (config.groundingSearch) {
      tools.push({ googleSearch: {} });
    }
    if (config.codeExecution) {
      tools.push({ codeExecution: {} });
    }

    // Build Structured Output Config
    let responseSchema: Record<string, unknown> | undefined = undefined;
    if (config.responseMimeType === 'application/json' && config.responseSchemaText) {
      try {
        responseSchema = JSON.parse(config.responseSchemaText);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON Schema syntax.' });
      }
    }

    // Build contents for @google/genai
    const contents = messages.map((m: { role: string; parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> }) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: m.parts.map((p) => {
        if (p.inlineData) {
          return {
            inlineData: {
              mimeType: p.inlineData.mimeType,
              data: p.inlineData.data,
            },
          };
        }
        return { text: p.text || '' };
      }),
    }));

    const systemInstruction = config.systemInstruction
      ? {
          role: 'system',
          parts: [{ text: config.systemInstruction }],
        }
      : undefined;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Call streaming API
    const responseStream = await client.models.generateContentStream({
      model,
      contents,
      config: {
        temperature: typeof config.temperature === 'number' ? config.temperature : 0.7,
        topP: typeof config.topP === 'number' ? config.topP : 0.95,
        topK: typeof config.topK === 'number' ? config.topK : 40,
        maxOutputTokens: typeof config.maxOutputTokens === 'number' ? config.maxOutputTokens : 8192,
        systemInstruction,
        tools: tools.length > 0 ? (tools as any) : undefined,
        responseMimeType: config.responseMimeType || 'text/plain',
        responseSchema,
      },
    });

    for await (const chunk of responseStream) {
      const text = chunk.text || '';
      const usage = chunk.usageMetadata;
      const candidate = chunk.candidates?.[0];
      const groundingMetadata = candidate?.groundingMetadata;

      res.write(
        `data: ${JSON.stringify({
          text,
          usage,
          groundingMetadata,
        })}\n\n`
      );
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Generation Error:', error);
    const errorMessage = error?.message || 'Generation failed';
    if (!res.headersSent) {
      return res.status(500).json({ error: errorMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

// Prompt Evaluation Runner: Evaluates test suite cases
app.post('/api/eval/run', async (req: Request, res: Response) => {
  try {
    const { config, testCases } = req.body;
    if (!Array.isArray(testCases) || testCases.length === 0) {
      return res.status(400).json({ error: 'testCases array is required.' });
    }

    const client = getGenAIClient();
    const model = config.model || 'gemini-3.8-flash';
    const results = [];

    for (const tc of testCases) {
      const start = Date.now();
      try {
        const response = await client.models.generateContent({
          model,
          contents: tc.input,
          config: {
            temperature: config.temperature ?? 0.7,
            systemInstruction: config.systemInstruction
              ? { role: 'system', parts: [{ text: config.systemInstruction }] }
              : undefined,
            maxOutputTokens: config.maxOutputTokens ?? 2048,
          },
        });

        const durationMs = Date.now() - start;
        const text = response.text || '';
        const usage = response.usageMetadata;

        // Automated scoring heuristic
        let score = 100;
        let pass = true;
        const notes: string[] = [];

        if (tc.expectedKeyword) {
          const expectedList = Array.isArray(tc.expectedKeyword)
            ? tc.expectedKeyword
            : [tc.expectedKeyword];
          const hasAllKeywords = expectedList.every((kw: string) =>
            text.toLowerCase().includes(kw.toLowerCase())
          );
          if (!hasAllKeywords) {
            score -= 50;
            pass = false;
            notes.push(`Missing expected keywords: ${expectedList.join(', ')}`);
          }
        }

        if (tc.mustNotContain) {
          const forbiddenList = Array.isArray(tc.mustNotContain)
            ? tc.mustNotContain
            : [tc.mustNotContain];
          const containsForbidden = forbiddenList.some((kw: string) =>
            text.toLowerCase().includes(kw.toLowerCase())
          );
          if (containsForbidden) {
            score -= 50;
            pass = false;
            notes.push(`Contained forbidden terms: ${forbiddenList.join(', ')}`);
          }
        }

        results.push({
          id: tc.id || crypto.randomUUID(),
          input: tc.input,
          output: text,
          durationMs,
          tokenCount: usage?.candidatesTokenCount || Math.ceil(text.length / 4),
          score: Math.max(0, score),
          pass,
          notes: notes.join('; ') || 'All criteria passed',
        });
      } catch (err: any) {
        results.push({
          id: tc.id || crypto.randomUUID(),
          input: tc.input,
          output: `Error: ${err.message}`,
          durationMs: Date.now() - start,
          tokenCount: 0,
          score: 0,
          pass: false,
          notes: err.message,
        });
      }
    }

    res.json({ results });
  } catch (error: any) {
    console.error('Eval error:', error);
    res.status(500).json({ error: error.message || 'Evaluation run failed' });
  }
});

// Dev or Production Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
