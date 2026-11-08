import { create } from 'zustand';

export interface MessagePart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // Base64 string
    name?: string;
    sizeKb?: number;
  };
}

export interface StudioMessage {
  id: string;
  role: 'user' | 'model';
  parts: MessagePart[];
  groundingMetadata?: {
    webSearchQueries?: string[];
    groundingChunks?: Array<{
      web?: { uri: string; title: string };
    }>;
  };
  telemetry?: {
    ttftMs: number;
    totalMs: number;
    tokensPerSecond: number;
    tokenCount: number;
    inputTokens?: number;
    cost: number;
  };
}

export interface StudioConfig {
  model: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  systemInstruction: string;
  groundingSearch: boolean;
  codeExecution: boolean;
  responseMimeType: string;
  responseSchemaText: string;
  thinkingLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface EvalTestCase {
  id: string;
  input: string;
  expectedKeyword?: string;
  mustNotContain?: string;
  output?: string;
  durationMs?: number;
  tokenCount?: number;
  score?: number;
  pass?: boolean;
  notes?: string;
}

export interface StructuredRow {
  id: string;
  input: string;
  context?: string;
  output: string;
}

export interface SavedPrompt {
  id: string;
  title: string;
  mode: 'chat' | 'freeform' | 'arena' | 'evals' | 'structured' | 'prompts';
  description: string;
  category?: 'Reasoning' | 'Coding' | 'Extraction' | 'Grounding' | 'Creative';
  config: StudioConfig;
  messages: StudioMessage[];
  freeformPrompt?: string;
  freeformVariables?: Record<string, string>;
  updatedAt: string;
}

interface StudioStore {
  // Global config & tabs
  promptTitle: string;
  activeTab: 'chat' | 'freeform' | 'prompts' | 'arena' | 'evals' | 'structured';
  config: StudioConfig;
  isGenerating: boolean;

  // Single Chat state
  messages: StudioMessage[];

  // Freeform Prompt state
  freeformPrompt: string;
  freeformVariables: Record<string, string>;
  freeformOutput: string;
  isGeneratingFreeform: boolean;
  freeformTelemetry?: StudioMessage['telemetry'];

  // Dual Arena state
  arenaModelA: string;
  arenaModelB: string;
  arenaMessagesA: StudioMessage[];
  arenaMessagesB: StudioMessage[];
  isGeneratingArenaA: boolean;
  isGeneratingArenaB: boolean;
  arenaVotes: { a: number; b: number; tie: number };

  // Structured Prompt state
  structuredRows: StructuredRow[];
  structuredInput: string;
  structuredOutput: string;
  isGeneratingStructured: boolean;

  // Eval Testbed state
  testCases: EvalTestCase[];
  isRunningEvals: boolean;

  // Prompt Library & Gallery
  savedPrompts: SavedPrompt[];
  activePromptId: string | null;

  // UI Panels
  isLeftNavOpen: boolean;
  isInspectorOpen: boolean;
  isCodeModalOpen: boolean;
  isCachingModalOpen: boolean;
  isShareModalOpen: boolean;
  isPromptGalleryOpen: boolean;

  // Actions
  setPromptTitle: (title: string) => void;
  setActiveTab: (tab: 'chat' | 'freeform' | 'prompts' | 'arena' | 'evals' | 'structured') => void;
  setConfig: (patch: Partial<StudioConfig>) => void;
  setIsGenerating: (isGenerating: boolean) => void;

  // Message actions
  addMessage: (msg: StudioMessage) => void;
  updateLastModelMessage: (
    text: string,
    telemetry?: StudioMessage['telemetry'],
    groundingMetadata?: StudioMessage['groundingMetadata']
  ) => void;
  clearMessages: () => void;
  deleteMessage: (id: string) => void;

  // Freeform actions
  setFreeformPrompt: (val: string) => void;
  setFreeformVariable: (key: string, val: string) => void;
  setFreeformOutput: (val: string) => void;
  setIsGeneratingFreeform: (val: boolean) => void;
  setFreeformTelemetry: (telemetry?: StudioMessage['telemetry']) => void;

  // Arena actions
  setArenaModelA: (model: string) => void;
  setArenaModelB: (model: string) => void;
  addArenaUserMessage: (userMsg: StudioMessage) => void;
  updateArenaModelMessage: (
    target: 'a' | 'b',
    text: string,
    telemetry?: StudioMessage['telemetry']
  ) => void;
  setArenaGenerating: (target: 'a' | 'b', isGenerating: boolean) => void;
  voteArena: (winner: 'a' | 'b' | 'tie') => void;
  clearArenaMessages: () => void;

  // Structured actions
  addStructuredRow: (row: Omit<StructuredRow, 'id'>) => void;
  updateStructuredRow: (id: string, patch: Partial<StructuredRow>) => void;
  deleteStructuredRow: (id: string) => void;
  setStructuredInput: (val: string) => void;
  setStructuredOutput: (val: string) => void;
  setIsGeneratingStructured: (val: boolean) => void;

  // Eval actions
  addTestCase: (tc: Omit<EvalTestCase, 'id'>) => void;
  updateTestCase: (id: string, patch: Partial<EvalTestCase>) => void;
  deleteTestCase: (id: string) => void;
  setTestCases: (cases: EvalTestCase[]) => void;
  setIsRunningEvals: (running: boolean) => void;

  // Saved Prompts
  saveCurrentPrompt: () => void;
  loadSavedPrompt: (id: string) => void;
  deleteSavedPrompt: (id: string) => void;

  // UI toggles
  toggleLeftNav: () => void;
  toggleInspector: () => void;
  setIsCodeModalOpen: (open: boolean) => void;
  setIsCachingModalOpen: (open: boolean) => void;
  setIsShareModalOpen: (open: boolean) => void;
  setIsPromptGalleryOpen: (open: boolean) => void;
}

const DEFAULT_PRESETS: SavedPrompt[] = [
  {
    id: 'preset-json-extractor',
    title: 'JSON Data Extractor',
    mode: 'chat',
    description: 'Enforces strict OpenAPI structured schema output for extracting entities.',
    config: {
      model: 'gemini-3.8-flash',
      temperature: 0.1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
      systemInstruction: 'You extract contact information into clean structured JSON format.',
      groundingSearch: false,
      codeExecution: false,
      responseMimeType: 'application/json',
      responseSchemaText: JSON.stringify(
        {
          type: 'OBJECT',
          properties: {
            personName: { type: 'STRING' },
            email: { type: 'STRING' },
            company: { type: 'STRING' },
            tags: { type: 'ARRAY', items: { type: 'STRING' } },
          },
          required: ['personName', 'email'],
        },
        null,
        2
      ),
    },
    messages: [
      {
        id: 'msg-preset-1',
        role: 'user',
        parts: [
          {
            text: 'Extract the info for Sarah Connor, Founder of Cyberdyne Consulting, reach at sarah@cyberdyne.ai. Specializes in AI resistance and cybersecurity.',
          },
        ],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-search-factchecker',
    title: 'Google Search Grounding',
    mode: 'chat',
    description: 'Uses live Google Search grounding to cite real-time verified web sources.',
    config: {
      model: 'gemini-3.8-flash',
      temperature: 0.2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      systemInstruction: 'You are an objective investigative researcher. Always cite live web sources with Google Search.',
      groundingSearch: true,
      codeExecution: false,
      responseMimeType: 'text/plain',
      responseSchemaText: '',
    },
    messages: [
      {
        id: 'msg-preset-2',
        role: 'user',
        parts: [{ text: 'What are the most recent announcements from Google DeepMind this month?' }],
      },
    ],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-code-architect',
    title: 'Full-Stack Code Architect',
    mode: 'chat',
    description: 'High-reasoning model optimized for complex TypeScript and Python architecture.',
    config: {
      model: 'gemini-4-argon',
      temperature: 0.3,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      systemInstruction: 'You are a principal software engineer. Provide robust, production-grade solutions with explicit type safety and error handling.',
      groundingSearch: false,
      codeExecution: true,
      responseMimeType: 'text/plain',
      responseSchemaText: '',
      thinkingLevel: 'HIGH',
    },
    messages: [],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-cot-reasoner',
    title: 'Chain-of-Thought Reasoner',
    mode: 'freeform',
    category: 'Reasoning',
    description: 'Deconstructs complex math, logic, or architectural dilemmas into verified steps.',
    config: {
      model: 'gemini-4-argon',
      temperature: 0.2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      systemInstruction: 'You are a meticulous problem solver. Always think step by step, explicitly stating assumptions and verifying logic.',
      groundingSearch: false,
      codeExecution: true,
      responseMimeType: 'text/plain',
      responseSchemaText: '',
      thinkingLevel: 'HIGH',
    },
    messages: [],
    freeformPrompt: `Problem Statement:
{{problem}}

Domain Context:
{{domain}}

Instructions:
1. Break down the core requirements and identify any edge cases or constraints.
2. Outline the potential solutions with time/space complexity or trade-offs.
3. Provide the optimal solution with verified mathematical proof or runnable code.
4. Conclude with a concise executive summary.`,
    freeformVariables: {
      problem: 'Design an algorithm to find the maximum sub-array sum in O(n) time and explain how Kadane\'s algorithm works with negative numbers.',
      domain: 'Computer Science / Algorithms',
    },
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'preset-code-auditor',
    title: 'Code Security & Perf Auditor',
    mode: 'freeform',
    category: 'Coding',
    description: 'Audits code for OWASP vulnerabilities, concurrency bugs, and performance bottlenecks.',
    config: {
      model: 'gemini-4-argon',
      temperature: 0.1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      systemInstruction: 'You are an offensive security engineer and performance specialist.',
      groundingSearch: false,
      codeExecution: false,
      responseMimeType: 'text/plain',
      responseSchemaText: '',
      thinkingLevel: 'HIGH',
    },
    messages: [],
    freeformPrompt: `Review the following {{language}} code snippet:

\`\`\`{{language}}
{{code_snippet}}
\`\`\`

Perform a deep technical audit:
1. Security Vulnerabilities (OWASP Top 10, Reentrancy, Injection, Memory leaks)
2. Performance & Big-O complexity improvements
3. Refactored production-ready code with type safety`,
    freeformVariables: {
      language: 'typescript',
      code_snippet: 'async function getUserData(req: any) {\n  const user = await db.query(`SELECT * FROM users WHERE id = ${req.query.id}`);\n  return user;\n}',
    },
    updatedAt: new Date().toISOString(),
  },
];

export const useStudioStore = create<StudioStore>((set, get) => ({
  promptTitle: 'Untitled Prompt',
  activeTab: 'chat',
  config: {
    model: 'gemini-3.8-flash',
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    systemInstruction: '',
    groundingSearch: false,
    codeExecution: false,
    responseMimeType: 'text/plain',
    responseSchemaText: '',
    thinkingLevel: 'MEDIUM',
  },
  isGenerating: false,

  messages: [],

  // Freeform Prompt state
  freeformPrompt: `You are an expert technical writer. Write an in-depth developer guide on {{topic}}.
Target Audience: {{audience}}
Tone: {{tone}}

Cover:
1. Introduction & Core Mental Model
2. Key Architecture Diagram & Flow
3. Production Code Example with Error Handling
4. Best Practices & Common Pitfalls`,
  freeformVariables: {
    topic: 'Server-Sent Events (SSE) with HTTP/2 and Gemini Streaming',
    audience: 'Senior Full-Stack Engineers',
    tone: 'Authoritative, concise, and practical',
  },
  freeformOutput: '',
  isGeneratingFreeform: false,
  freeformTelemetry: undefined,

  // Arena
  arenaModelA: 'gemini-3.8-flash',
  arenaModelB: 'gemini-4-argon',
  arenaMessagesA: [],
  arenaMessagesB: [],
  isGeneratingArenaA: false,
  isGeneratingArenaB: false,
  arenaVotes: { a: 0, b: 0, tie: 0 },

  // Structured Prompt
  structuredRows: [
    {
      id: 'row-1',
      input: 'Great service and speedy delivery!',
      context: 'E-commerce review',
      output: 'Positive (Sentiment: 0.95)',
    },
    {
      id: 'row-2',
      input: 'The product broke after two days of light use.',
      context: 'Electronics review',
      output: 'Negative (Sentiment: 0.05)',
    },
  ],
  structuredInput: 'Arrived on time but the box was slightly dented. Product works fine.',
  structuredOutput: '',
  isGeneratingStructured: false,

  // Eval
  testCases: [
    {
      id: 'tc-1',
      input: 'Explain recursion to a 10 year old in under 3 sentences.',
      expectedKeyword: 'function',
      score: undefined,
    },
    {
      id: 'tc-2',
      input: 'List 3 prime numbers between 50 and 70.',
      expectedKeyword: '53, 59',
      score: undefined,
    },
    {
      id: 'tc-3',
      input: 'Write a haiku about compiling code.',
      score: undefined,
    },
  ],
  isRunningEvals: false,

  // Saved Prompts
  savedPrompts: DEFAULT_PRESETS,
  activePromptId: null,

  // UI
  isLeftNavOpen: true,
  isInspectorOpen: true,
  isCodeModalOpen: false,
  isCachingModalOpen: false,
  isShareModalOpen: false,
  isPromptGalleryOpen: false,

  setPromptTitle: (title) => set({ promptTitle: title }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastModelMessage: (text, telemetry, groundingMetadata) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === 'model') {
        last.parts = [{ text }];
        if (telemetry) last.telemetry = telemetry;
        if (groundingMetadata) last.groundingMetadata = groundingMetadata;
      }
      return { messages: msgs };
    }),
  clearMessages: () => set({ messages: [] }),
  deleteMessage: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

  // Freeform
  setFreeformPrompt: (val) => set({ freeformPrompt: val }),
  setFreeformVariable: (key, val) =>
    set((s) => ({
      freeformVariables: {
        ...s.freeformVariables,
        [key]: val,
      },
    })),
  setFreeformOutput: (val) => set({ freeformOutput: val }),
  setIsGeneratingFreeform: (val) => set({ isGeneratingFreeform: val }),
  setFreeformTelemetry: (telemetry) => set({ freeformTelemetry: telemetry }),

  // Arena
  setArenaModelA: (model) => set({ arenaModelA: model }),
  setArenaModelB: (model) => set({ arenaModelB: model }),
  addArenaUserMessage: (userMsg) =>
    set((s) => ({
      arenaMessagesA: [
        ...s.arenaMessagesA,
        userMsg,
        { id: crypto.randomUUID(), role: 'model', parts: [{ text: '' }] },
      ],
      arenaMessagesB: [
        ...s.arenaMessagesB,
        userMsg,
        { id: crypto.randomUUID(), role: 'model', parts: [{ text: '' }] },
      ],
    })),
  updateArenaModelMessage: (target, text, telemetry) =>
    set((s) => {
      const key = target === 'a' ? 'arenaMessagesA' : 'arenaMessagesB';
      const list = [...s[key]];
      const last = list[list.length - 1];
      if (last && last.role === 'model') {
        last.parts = [{ text }];
        if (telemetry) last.telemetry = telemetry;
      }
      return { [key]: list } as any;
    }),
  setArenaGenerating: (target, isGenerating) =>
    set((s) => ({
      [target === 'a' ? 'isGeneratingArenaA' : 'isGeneratingArenaB']: isGenerating,
    })),
  voteArena: (winner) =>
    set((s) => ({
      arenaVotes: {
        ...s.arenaVotes,
        [winner]: s.arenaVotes[winner] + 1,
      },
    })),
  clearArenaMessages: () =>
    set({
      arenaMessagesA: [],
      arenaMessagesB: [],
    }),

  // Structured
  addStructuredRow: (row) =>
    set((s) => ({
      structuredRows: [...s.structuredRows, { id: crypto.randomUUID(), ...row }],
    })),
  updateStructuredRow: (id, patch) =>
    set((s) => ({
      structuredRows: s.structuredRows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),
  deleteStructuredRow: (id) =>
    set((s) => ({
      structuredRows: s.structuredRows.filter((r) => r.id !== id),
    })),
  setStructuredInput: (val) => set({ structuredInput: val }),
  setStructuredOutput: (val) => set({ structuredOutput: val }),
  setIsGeneratingStructured: (val) => set({ isGeneratingStructured: val }),

  // Eval
  addTestCase: (tc) =>
    set((s) => ({
      testCases: [...s.testCases, { id: crypto.randomUUID(), ...tc }],
    })),
  updateTestCase: (id, patch) =>
    set((s) => ({
      testCases: s.testCases.map((tc) => (tc.id === id ? { ...tc, ...patch } : tc)),
    })),
  deleteTestCase: (id) =>
    set((s) => ({
      testCases: s.testCases.filter((tc) => tc.id !== id),
    })),
  setTestCases: (cases) => set({ testCases: cases }),
  setIsRunningEvals: (running) => set({ isRunningEvals: running }),

  // Saved Prompts
  saveCurrentPrompt: () => {
    const s = get();
    const newPrompt: SavedPrompt = {
      id: s.activePromptId || crypto.randomUUID(),
      title: s.promptTitle || 'Untitled Prompt',
      mode: s.activeTab,
      description: `Saved ${new Date().toLocaleTimeString()} with ${s.config.model}`,
      config: { ...s.config },
      messages: [...s.messages],
      freeformPrompt: s.activeTab === 'freeform' ? s.freeformPrompt : undefined,
      freeformVariables: s.activeTab === 'freeform' ? { ...s.freeformVariables } : undefined,
      updatedAt: new Date().toISOString(),
    };
    const exists = s.savedPrompts.some((p) => p.id === newPrompt.id);
    const updated = exists
      ? s.savedPrompts.map((p) => (p.id === newPrompt.id ? newPrompt : p))
      : [newPrompt, ...s.savedPrompts];
    set({ savedPrompts: updated, activePromptId: newPrompt.id });
  },
  loadSavedPrompt: (id) => {
    const s = get();
    const prompt = s.savedPrompts.find((p) => p.id === id);
    if (!prompt) return;
    set({
      activePromptId: prompt.id,
      promptTitle: prompt.title,
      activeTab: prompt.mode,
      config: { ...prompt.config },
      messages: [...prompt.messages],
      freeformPrompt: prompt.freeformPrompt || s.freeformPrompt,
      freeformVariables: prompt.freeformVariables || s.freeformVariables,
    });
  },
  deleteSavedPrompt: (id) =>
    set((s) => ({
      savedPrompts: s.savedPrompts.filter((p) => p.id !== id),
      activePromptId: s.activePromptId === id ? null : s.activePromptId,
    })),

  // UI toggles
  toggleLeftNav: () => set((s) => ({ isLeftNavOpen: !s.isLeftNavOpen })),
  toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),
  setIsCodeModalOpen: (open) => set({ isCodeModalOpen: open }),
  setIsCachingModalOpen: (open) => set({ isCachingModalOpen: open }),
  setIsShareModalOpen: (open) => set({ isShareModalOpen: open }),
  setIsPromptGalleryOpen: (open) => set({ isPromptGalleryOpen: open }),
}));
