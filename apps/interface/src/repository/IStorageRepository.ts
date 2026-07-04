import { QueuedPrompt, PromptStatus } from '../models';
import { RateLimitPercentages } from '../rateLimitsService';

export interface QueueGlobalState {
  totalProcessed: number;
  failedCount: number;
  rateLimitedCount: number;
  lastProcessed: Date | null;
}

export interface ChatSessionRow {
  id: number;
  chat_name: string;
  session_id: string;
  working_directory: string;
  total_prompts: number;
  created_at: string;
  last_used: string;
}

export type PromptPatch = Partial<{
  retryCount: number;
  lastExecuted: Date;
  rateLimitedAt: Date;
  resetTime: Date;
  isSessionStart: boolean;
  sessionId: string;
}>;

export interface IStorageRepository {
  // Prompts
  listPrompts(statusFilter?: PromptStatus): Promise<QueuedPrompt[]>;
  insertPrompt(prompt: QueuedPrompt): Promise<void>;
  updatePromptStatus(id: string, status: PromptStatus, patch: PromptPatch): Promise<void>;
  saveOutput(id: string, output: string): Promise<void>;
  cancelPrompt(id: string): Promise<boolean>;

  // Estado global
  getQueueState(): Promise<QueueGlobalState>;
  incrementCounter(field: 'totalProcessed' | 'failedCount' | 'rateLimitedCount'): Promise<void>;
  setLastProcessed(at: Date): Promise<void>;

  // Chat sessions
  saveChatSession(chatName: string, workingDir: string): Promise<boolean>;
  updateChatSessionId(chatName: string, sessionId: string): Promise<void>;
  getSessionIdByChatName(chatName: string): Promise<string | null>;
  updateChatSessionLastUsed(chatName: string): Promise<void>;
  listChatSessions(): Promise<ChatSessionRow[]>;
  deleteChatSession(chatName: string): Promise<boolean>;
  chatExists(chatName: string): Promise<boolean>;

  // Auth
  getClaudeToken(): Promise<string>;

  // Limits
  patchActiveLimits(limits: RateLimitPercentages): Promise<void>;

  // Lifecycle
  initialize(): Promise<void>;
  disconnect(): Promise<void>;
}
