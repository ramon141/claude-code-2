import {QueuedPrompt, PromptStatus} from './queue.models';

export interface QueueGlobalState {
  totalProcessed: number;
  failedCount: number;
  rateLimitedCount: number;
  lastProcessed: Date | null;
}

export interface ClaudeCredentials {
  token: string;
  keyId: number;
}

export type PromptPatch = Partial<{
  retryCount: number;
  lastExecuted: Date;
  rateLimitedAt: Date;
  resetTime: Date;
  isSessionStart: boolean;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
}>;

export interface IStorageRepository {
  listPrompts(statusFilter?: PromptStatus): Promise<QueuedPrompt[]>;
  updatePromptStatus(id: string, status: PromptStatus, patch: PromptPatch): Promise<void>;
  saveOutput(id: string, output: string): Promise<void>;
  saveDiff(id: string, diff: string): Promise<void>;
  saveBaseRef(id: string, baseRef: string): Promise<void>;
  cancelPrompt(id: string): Promise<boolean>;
  getQueueState(): Promise<QueueGlobalState>;
  incrementCounter(field: 'totalProcessed' | 'failedCount' | 'rateLimitedCount'): Promise<void>;
  setLastProcessed(at: Date): Promise<void>;
  getSessionIdByChatName(chatName: string): Promise<string | null>;
  updateChatSessionId(chatName: string, sessionId: string): Promise<void>;
  getClaudeToken(): Promise<ClaudeCredentials>;
  patchLimitsByKeyId(keyId: number, sessionLimitPercentage: number, weeklyLimitPercentage: number): Promise<void>;
  markKeyRateLimited(keyId: number, until: Date): Promise<void>;
  canFailoverToAnotherKey(excludeKeyId: number): Promise<boolean>;
  getPromptStatus(id: number): Promise<PromptStatus | null>;
  getPromptOutput(id: number): Promise<string | null>;
  initialize(): Promise<void>;
  disconnect(): Promise<void>;
}
