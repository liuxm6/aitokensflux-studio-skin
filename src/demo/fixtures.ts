export type Model = {
  id: string;
  name: string;
  provider: string;
  monogram: string;
  tone: string;
  description: string;
  context: number;
  input: number;
  output: number;
  category: string;
  modalities: string[];
  featured?: boolean;
  latency: number;
};

// All values are design fixtures, not current model specifications or quotations.
export const models: Model[] = [
  {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    monogram: "O",
    tone: "mint",
    description: "Precise reasoning. Thoughtful answers.",
    context: 1048576,
    input: 2,
    output: 8,
    category: "General",
    modalities: ["Text", "Image"],
    featured: true,
    latency: 420,
  },
  {
    id: "anthropic/claude-sonnet",
    name: "Claude Sonnet",
    provider: "Anthropic",
    monogram: "A",
    tone: "sand",
    description: "A careful partner for complex work.",
    context: 200000,
    input: 3,
    output: 15,
    category: "Coding",
    modalities: ["Text", "Image"],
    featured: true,
    latency: 610,
  },
  {
    id: "google/gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    monogram: "G",
    tone: "blue",
    description: "Explore ideas across text, images and audio.",
    context: 1048576,
    input: 1.25,
    output: 10,
    category: "Multimodal",
    modalities: ["Text", "Image", "Audio"],
    featured: true,
    latency: 380,
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    monogram: "D",
    tone: "blue",
    description: "Make space for deeper reasoning.",
    context: 131072,
    input: 0.55,
    output: 2.19,
    category: "Reasoning",
    modalities: ["Text"],
    latency: 750,
  },
  {
    id: "meta/llama-4",
    name: "Llama 4",
    provider: "Meta",
    monogram: "M",
    tone: "indigo",
    description: "Open intelligence, ready for your ideas.",
    context: 131072,
    input: 0.2,
    output: 0.6,
    category: "Open weights",
    modalities: ["Text", "Image"],
    latency: 210,
  },
  {
    id: "mistral/mistral-large",
    name: "Mistral Large",
    provider: "Mistral",
    monogram: "M",
    tone: "sand",
    description: "Multilingual intelligence without friction.",
    context: 128000,
    input: 2,
    output: 6,
    category: "General",
    modalities: ["Text"],
    latency: 320,
  },
  {
    id: "qwen/qwen-coder",
    name: "Qwen Coder",
    provider: "Qwen",
    monogram: "Q",
    tone: "indigo",
    description: "From first draft to working code.",
    context: 131072,
    input: 0.3,
    output: 0.9,
    category: "Coding",
    modalities: ["Text"],
    latency: 290,
  },
  {
    id: "openai/gpt-image",
    name: "GPT Image",
    provider: "OpenAI",
    monogram: "O",
    tone: "mint",
    description: "Turn a clear idea into a compelling image.",
    context: 32000,
    input: 5,
    output: 40,
    category: "Creative",
    modalities: ["Text", "Image"],
    latency: 890,
  },
];

export type DemoKey = {
  id: string;
  maskedSuffix?: string;
  name: string;
  scope: string;
  kind: string;
  active: boolean;
  budget: number;
  used: number;
  created: string;
};
export const initialKeys: DemoKey[] = [
  {
    id: "key-01",
    name: "Production API",
    scope: "personal",
    kind: "Personal key",
    active: true,
    budget: 200,
    used: 42.8,
    created: "2026-11-01",
  },
  {
    id: "key-02",
    name: "Local development",
    scope: "personal",
    kind: "Personal key",
    active: true,
    budget: 50,
    used: 8.2,
    created: "2026-11-05",
  },
  {
    id: "key-03",
    name: "Research notebook",
    scope: "personal",
    kind: "Personal key",
    active: false,
    budget: 30,
    used: 3.4,
    created: "2026-11-08",
  },
  {
    id: "key-04",
    name: "Website assistant",
    scope: "studio/default",
    kind: "System key",
    active: true,
    budget: 500,
    used: 126.4,
    created: "2026-11-02",
  },
  {
    id: "key-05",
    name: "Design experiments",
    scope: "studio/research",
    kind: "Member key",
    active: true,
    budget: 100,
    used: 18.6,
    created: "2026-11-06",
  },
];

export type DemoMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  budget: number;
  workspace: string;
  workspaces?: string[];
  workspaceRoles?: Record<string, string>;
};
export const initialMembers: DemoMember[] = [
  {
    id: "m1",
    name: "Alex Morgan",
    email: "alex@example.test",
    role: "owner",
    status: "Active",
    budget: 500,
    workspace: "default",
  },
  {
    id: "m2",
    name: "Lin Chen",
    email: "lin@example.test",
    role: "admin",
    status: "Active",
    budget: 200,
    workspace: "default",
  },
  {
    id: "m3",
    name: "Sofia Petrova",
    email: "sofia@example.test",
    role: "billing",
    status: "Active",
    budget: 150,
    workspace: "research",
  },
  {
    id: "m4",
    name: "Jamie Kim",
    email: "jamie@example.test",
    role: "member",
    status: "Invited",
    budget: 100,
    workspace: "research",
  },
];

export const requests = [
  {
    id: "req_8f20",
    model: "GPT-4.1",
    key: "Production API",
    tokens: 2840,
    cost: 0.0184,
    status: "Completed",
    date: "2026-11-14T09:42:00Z",
  },
  {
    id: "req_8f19",
    model: "Claude Sonnet",
    key: "Production API",
    tokens: 5120,
    cost: 0.0432,
    status: "Completed",
    date: "2026-11-14T09:38:00Z",
  },
  {
    id: "req_8f18",
    model: "Gemini Pro",
    key: "Local development",
    tokens: 1250,
    cost: 0.0098,
    status: "Completed",
    date: "2026-11-14T09:32:00Z",
  },
  {
    id: "req_8f17",
    model: "DeepSeek R1",
    key: "Production API",
    tokens: 0,
    cost: 0,
    status: "Budget limit",
    date: "2026-11-14T09:25:00Z",
  },
  {
    id: "req_8f16",
    model: "GPT-4.1",
    key: "Local development",
    tokens: 3480,
    cost: 0.0216,
    status: "Completed",
    date: "2026-11-13T16:12:00Z",
  },
  {
    id: "req_8f15",
    model: "Llama 4",
    key: "Production API",
    tokens: 6320,
    cost: 0.0081,
    status: "Completed",
    date: "2026-11-12T14:08:00Z",
  },
  {
    id: "req_8f14",
    model: "Mistral Large",
    key: "Local development",
    tokens: 1930,
    cost: 0.0132,
    status: "Completed",
    date: "2026-11-10T11:20:00Z",
  },
  {
    id: "req_8f13",
    model: "Claude Sonnet",
    key: "Production API",
    tokens: 7860,
    cost: 0.0654,
    status: "Completed",
    date: "2026-11-08T10:20:00Z",
  },
];

export const usage = [
  { day: "2026-11-01", value: 8.4, requests: 1100 },
  { day: "2026-11-02", value: 9.1, requests: 1250 },
  { day: "2026-11-03", value: 12.3, requests: 1680 },
  { day: "2026-11-04", value: 10.8, requests: 1420 },
  { day: "2026-11-05", value: 16.2, requests: 2100 },
  { day: "2026-11-06", value: 14.5, requests: 1890 },
  { day: "2026-11-07", value: 19.3, requests: 2500 },
  { day: "2026-11-08", value: 12.6, requests: 1800 },
  { day: "2026-11-09", value: 18.2, requests: 2300 },
  { day: "2026-11-10", value: 15.4, requests: 2100 },
  { day: "2026-11-11", value: 28.9, requests: 3900 },
  { day: "2026-11-12", value: 24.6, requests: 3200 },
  { day: "2026-11-13", value: 38.4, requests: 5100 },
  { day: "2026-11-14", value: 31.8, requests: 4200 },
];

export const optionalPages = [
  "files",
  "guardrails",
  "byok",
  "routing",
  "presets",
  "tools",
  "observability",
];
export const optionalLabels: Record<string, string> = {
  files: "Files",
  guardrails: "Guardrails",
  byok: "Your provider keys",
  routing: "Routing",
  presets: "Presets",
  tools: "Tools",
  observability: "Observability",
};
