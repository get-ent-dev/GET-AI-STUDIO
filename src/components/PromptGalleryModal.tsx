import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Sparkles,
  Brackets,
  MessageSquare,
  TableProperties,
  ArrowRight,
  X,
  Cpu,
  Layers,
} from 'lucide-react';
import { useStudioStore, SavedPrompt } from '../store/studioStore';

export const PROMPT_GALLERY_TEMPLATES: Array<Omit<SavedPrompt, 'updatedAt'> & { tags: string[] }> = [
  {
    id: 'tmpl-cot-step-by-step',
    title: 'Chain-of-Thought (CoT) Problem Solver',
    mode: 'freeform',
    category: 'Reasoning',
    description: 'Enforces deliberate multi-step reasoning, mathematical verification, and counter-example checks.',
    tags: ['reasoning', 'math', 'stem', 'logic'],
    config: {
      model: 'gemini-4-argon',
      temperature: 0.2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      systemInstruction: 'You are an advanced cognitive reasoning engine. Deconstruct problems with formal logic and rigorous proofs.',
      groundingSearch: false,
      codeExecution: true,
      responseMimeType: 'text/plain',
      responseSchemaText: '',
      thinkingLevel: 'HIGH',
    },
    messages: [],
    freeformPrompt: `Target Problem:
{{problem}}

Context & Constraints:
{{constraints}}

Execute Chain-of-Thought Protocol:
1. Rephrase the problem in formal terms.
2. Formulate 2 hypothesis paths and assess feasibility.
3. Compute step-by-step logic, annotating each derivation.
4. Stress-test with boundary conditions and negative test cases.
5. Provide final answer with confidence level.`,
    freeformVariables: {
      problem: 'Prove that the square root of 2 is irrational using proof by contradiction.',
      constraints: 'Provide formal deductive steps understandable to an undergraduate math student.',
    },
  },
  {
    id: 'tmpl-owasp-code-auditor',
    title: 'Full-Stack Code & Security Auditor',
    mode: 'freeform',
    category: 'Coding',
    description: 'Scans code for SQLi, XSS, SSRF, memory safety, Big-O algorithmic bottlenecks, and concurrency races.',
    tags: ['security', 'typescript', 'python', 'owasp'],
    config: {
      model: 'gemini-4-argon',
      temperature: 0.1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      systemInstruction: 'You are a principal security engineer and performance architect.',
      groundingSearch: false,
      codeExecution: false,
      responseMimeType: 'text/plain',
      responseSchemaText: '',
      thinkingLevel: 'HIGH',
    },
    messages: [],
    freeformPrompt: `Please conduct a rigorous technical code review of this {{language}} implementation:

\`\`\`{{language}}
{{source_code}}
\`\`\`

Analysis Checklist:
- Critical Vulnerabilities (CWE/OWASP)
- Concurrency & Async Race Conditions
- Performance & Memory Leaks (Big-O time and space)
- Complete Refactored Code with defensive engineering`,
    freeformVariables: {
      language: 'typescript',
      source_code: `async function handlePayment(userId: string, amount: number) {
  const account = await db.findOne({ userId });
  if (account.balance >= amount) {
    account.balance -= amount;
    await db.save(account);
    await stripe.charge(userId, amount);
  }
}`,
    },
  },
  {
    id: 'tmpl-json-entity-extractor',
    title: 'OpenAPI Structured Entity Extractor',
    mode: 'chat',
    category: 'Extraction',
    description: 'Enforces rigid OpenAPI JSON Schema compliance to turn unstructured text into clean records.',
    tags: ['json', 'schema', 'api', 'etl'],
    config: {
      model: 'gemini-3.8-flash',
      temperature: 0.1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
      systemInstruction: 'Extract entities with high precision into JSON conforming to the schema.',
      groundingSearch: false,
      codeExecution: false,
      responseMimeType: 'application/json',
      responseSchemaText: JSON.stringify(
        {
          type: 'OBJECT',
          properties: {
            organization: { type: 'STRING' },
            foundedYear: { type: 'INTEGER' },
            valuationBillions: { type: 'NUMBER' },
            keyPersonnel: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  role: { type: 'STRING' },
                },
                required: ['name', 'role'],
              },
            },
            isPublic: { type: 'BOOLEAN' },
          },
          required: ['organization', 'keyPersonnel'],
        },
        null,
        2
      ),
    },
    messages: [
      {
        id: 'msg-extract-1',
        role: 'user',
        parts: [
          {
            text: 'Anthropic was founded in 2021 by former OpenAI members, siblings Dario Amodei and Daniela Amodei. It remains private and was recently valued at over $18 billion.',
          },
        ],
      },
    ],
  },
  {
    id: 'tmpl-google-search-investigator',
    title: 'Real-Time Google Search Fact-Checker',
    mode: 'chat',
    category: 'Grounding',
    description: 'Leverages Gemini Google Search grounding with inline attribution and clickable web source links.',
    tags: ['search', 'grounding', 'factcheck', 'live'],
    config: {
      model: 'gemini-3.8-flash',
      temperature: 0.2,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      systemInstruction: 'You are an objective investigative journalist. Always verify claims using Google Search and cite web sources.',
      groundingSearch: true,
      codeExecution: false,
      responseMimeType: 'text/plain',
      responseSchemaText: '',
    },
    messages: [
      {
        id: 'msg-search-1',
        role: 'user',
        parts: [
          {
            text: 'What are the newest planetary science discoveries made by the James Webb Space Telescope this year?',
          },
        ],
      },
    ],
  },
  {
    id: 'tmpl-fewshot-sentiment',
    title: 'Few-Shot Text Classification',
    mode: 'structured',
    category: 'Reasoning',
    description: 'In-context learning dataset demonstrating how few-shot examples guide nuanced classification.',
    tags: ['few-shot', 'classification', 'tabular'],
    config: {
      model: 'gemini-3.8-flash',
      temperature: 0.1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 1024,
      systemInstruction: 'Classify text based strictly on demonstrated few-shot examples.',
      groundingSearch: false,
      codeExecution: false,
      responseMimeType: 'text/plain',
      responseSchemaText: '',
    },
    messages: [],
  },
  {
    id: 'tmpl-technical-writer',
    title: 'API Reference & SDK Documentation Writer',
    mode: 'freeform',
    category: 'Creative',
    description: 'Generates developer documentation with code examples, curl snippets, parameter tables, and status codes.',
    tags: ['docs', 'api', 'developer', 'sdk'],
    config: {
      model: 'gemini-3.8-flash',
      temperature: 0.3,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 4096,
      systemInstruction: 'You are a lead technical writer for Google Cloud and Stripe.',
      groundingSearch: false,
      codeExecution: false,
      responseMimeType: 'text/plain',
      responseSchemaText: '',
    },
    messages: [],
    freeformPrompt: `Create developer-friendly API reference documentation for endpoint:
Endpoint: {{method}} {{path}}
Description: {{description}}
Authentication: Bearer Token

Generate:
1. Overview & Use Case
2. Query / Request Body Parameters Table
3. Complete cURL Request Example
4. HTTP 200 Success Response (JSON)
5. Error Handling Table (400, 401, 404, 429)`,
    freeformVariables: {
      method: 'POST',
      path: '/v1/models/{modelId}:predict',
      description: 'Generates realtime inference predictions from custom fine-tuned weights.',
    },
  },
];

export const PromptGalleryModal: React.FC = () => {
  const {
    isPromptGalleryOpen,
    setIsPromptGalleryOpen,
    setActiveTab,
    setPromptTitle,
    setConfig,
    addMessage,
    clearMessages,
    setFreeformPrompt,
    setFreeformVariable,
  } = useStudioStore();

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isPromptGalleryOpen) return null;

  const categories = ['All', 'Reasoning', 'Coding', 'Extraction', 'Grounding', 'Creative'];

  const filtered = PROMPT_GALLERY_TEMPLATES.filter((tmpl) => {
    const matchesCat = activeCategory === 'All' || tmpl.category === activeCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      tmpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tmpl.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const handleSelectTemplate = (tmpl: typeof PROMPT_GALLERY_TEMPLATES[0]) => {
    setActiveTab(tmpl.mode);
    setPromptTitle(tmpl.title);
    setConfig(tmpl.config);

    if (tmpl.mode === 'chat') {
      clearMessages();
      tmpl.messages.forEach((m) => addMessage(m));
    } else if (tmpl.mode === 'freeform') {
      setFreeformPrompt(tmpl.freeformPrompt || '');
      if (tmpl.freeformVariables) {
        Object.entries(tmpl.freeformVariables).forEach(([k, v]) => {
          setFreeformVariable(k, v);
        });
      }
    }

    setIsPromptGalleryOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[88vh] shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600/20 text-blue-400 rounded-lg border border-blue-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <span>Prompt Gallery & Engineering Templates</span>
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-mono">
                  Curated
                </span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                Explore production-ready prompts for Gemini 3 and Gemini 4 models.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPromptGalleryOpen(false)}
            className="text-zinc-400 hover:text-zinc-200 p-1 rounded-md hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Tabs */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search prompt templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
          {filtered.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleSelectTemplate(tmpl)}
              className="p-4 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer flex flex-col justify-between group space-y-3"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {tmpl.mode === 'freeform' ? (
                      <Brackets className="w-3.5 h-3.5 text-emerald-400" />
                    ) : tmpl.mode === 'chat' ? (
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    ) : (
                      <TableProperties className="w-3.5 h-3.5 text-purple-400" />
                    )}
                    <span className="font-semibold text-xs text-zinc-100 group-hover:text-blue-300 transition">
                      {tmpl.title}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono uppercase bg-zinc-850 px-2 py-0.5 rounded text-zinc-400 border border-zinc-800">
                    {tmpl.mode}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {tmpl.description}
                </p>

                {tmpl.freeformPrompt && (
                  <div className="mt-2 p-2 bg-zinc-950/80 rounded border border-zinc-850 text-[10px] font-mono text-zinc-400 line-clamp-3">
                    {tmpl.freeformPrompt}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[10px] text-zinc-500">
                <div className="flex items-center gap-1.5 font-mono">
                  <Cpu className="w-3 h-3 text-zinc-400" />
                  <span>{tmpl.config.model}</span>
                </div>

                <span className="flex items-center gap-1 text-blue-400 group-hover:translate-x-0.5 transition font-medium">
                  <span>Load Template</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
