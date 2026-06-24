// ─── HTTP Status Codes ────────────────────────────────────────────────────────

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// ─── Shared ───────────────────────────────────────────────────────────────────

export type PromptStatus =
  | 'queued'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rate_limited';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export type RouteDefinition = {
  method: HttpMethod;
  path: string;
  description: string;
  statusCodes: Record<number, string>;
};

// ─── Prompt — Request Bodies ──────────────────────────────────────────────────

export type CreatePromptBody = {
  content: string;
  sessionId?: string | null;
  chatName?: string | null;
  priority?: number;
  workingDirectory?: string;
  contextFiles?: string[];
  maxRetries?: number;
  estimatedTokens?: number | null;
  isSessionStart?: boolean;
};

export type ListPromptsQuery = {
  status?: PromptStatus;
  sessionId?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'priority' | 'createdAt';
};

export type PatchPromptBody = {
  status?: PromptStatus;
  retryCount?: number;
  lastExecuted?: string;
  rateLimitedAt?: string;
  resetTime?: string;
  isSessionStart?: boolean;
  output?: string;
  sessionId?: string;
};

// ─── Prompt — Response Bodies ─────────────────────────────────────────────────

export type PromptResponse = {
  id: string;
  content: string;
  status: PromptStatus;
  priority: number;
  workingDirectory: string;
  contextFiles: string[];
  maxRetries: number;
  retryCount: number;
  estimatedTokens: number | null;
  sessionId: string | null;
  chatName: string | null;
  isSessionStart: boolean;
  output: string;
  createdAt: string;
  lastExecuted: string | null;
  rateLimitedAt: string | null;
  resetTime: string | null;
};

export type PromptSummaryResponse = Pick<
  PromptResponse,
  'id' | 'content' | 'status' | 'output' | 'createdAt' | 'lastExecuted'
>;

// ─── Chat Session — Request Bodies ────────────────────────────────────────────

export type CreateChatSessionBody = {
  chatName: string;
  workingDirectory?: string;
};

// ─── Chat Session — Response Bodies ──────────────────────────────────────────

export type ChatSessionResponse = {
  id: string;
  chatName: string;
  sessionId: string;
  workingDirectory: string;
  totalPrompts: number;
  lastUsed: string | null;
  createdAt: string;
};

// ─── Queue State — Request Bodies ─────────────────────────────────────────────

export type IncrementQueueStateBody = {
  field: 'totalProcessed' | 'failedCount' | 'rateLimitedCount';
};

// ─── Queue State — Response Bodies ────────────────────────────────────────────

export type QueueStateResponse = {
  id: string;
  totalProcessed: number;
  failedCount: number;
  rateLimitedCount: number;
  lastProcessed: string | null;
};

// ─── Auth — Response Bodies ───────────────────────────────────────────────────

export type ClaudeTokenResponse = {
  claudeOAuthToken: string;
};

// ─── Route Definitions ────────────────────────────────────────────────────────

export const PROMPT_ROUTES: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/prompts',
    description: 'Criar prompt (avulso ou vinculado a chat)',
    statusCodes: { 201: 'Prompt criado', 422: 'Erro de validação' },
  },
  {
    method: 'GET',
    path: '/prompts',
    description: 'Listar prompts com filtros opcionais',
    statusCodes: { 200: 'Lista de prompts' },
  },
  {
    method: 'GET',
    path: '/prompts/:id',
    description: 'Buscar prompt por ID',
    statusCodes: { 200: 'Prompt encontrado', 404: 'Não encontrado' },
  },
  {
    method: 'PATCH',
    path: '/prompts/:id',
    description: 'Atualizar status e/ou log — usado pelo daemon',
    statusCodes: { 200: 'Atualizado', 404: 'Não encontrado' },
  },
  {
    method: 'DELETE',
    path: '/prompts/:id',
    description: 'Cancelar prompt',
    statusCodes: { 204: 'Cancelado', 404: 'Não encontrado' },
  },
];

export const CHAT_SESSION_ROUTES: RouteDefinition[] = [
  {
    method: 'POST',
    path: '/chat-sessions',
    description: 'Criar novo chat',
    statusCodes: { 201: 'Chat criado', 422: 'Erro de validação' },
  },
  {
    method: 'GET',
    path: '/chat-sessions',
    description: 'Listar todos os chats',
    statusCodes: { 200: 'Lista de chats' },
  },
  {
    method: 'GET',
    path: '/chat-sessions/:chatName',
    description: 'Buscar chat pelo nome',
    statusCodes: { 200: 'Chat encontrado', 404: 'Não encontrado' },
  },
  {
    method: 'GET',
    path: '/chat-sessions/:chatName/prompts',
    description: 'Histórico do chat ordenado por createdAt ASC',
    statusCodes: { 200: 'Lista de prompts do chat', 404: 'Chat não encontrado' },
  },
  {
    method: 'PATCH',
    path: '/chat-sessions/:chatName/last-used',
    description: 'Incrementar totalPrompts e atualizar lastUsed',
    statusCodes: { 200: 'Atualizado', 404: 'Não encontrado' },
  },
  {
    method: 'DELETE',
    path: '/chat-sessions/:chatName',
    description: 'Deletar chat e seus prompts',
    statusCodes: { 204: 'Deletado', 404: 'Não encontrado' },
  },
];

export const AUTH_ROUTES: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/auth/claude-token',
    description: 'Obter CLAUDE_CODE_OAUTH_TOKEN para execução do CLI',
    statusCodes: { 200: 'Token retornado', 401: 'Não autorizado' },
  },
];

export const QUEUE_STATE_ROUTES: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/queue/state',
    description: 'Ler contadores globais da fila',
    statusCodes: { 200: 'Estado atual' },
  },
  {
    method: 'POST',
    path: '/queue/state/increment',
    description: 'Incrementar um contador (totalProcessed | failedCount | rateLimitedCount)',
    statusCodes: { 200: 'Incrementado', 422: 'Campo inválido' },
  },
  {
    method: 'PATCH',
    path: '/queue/state/last-processed',
    description: 'Atualizar timestamp do último processamento',
    statusCodes: { 200: 'Atualizado' },
  },
];
