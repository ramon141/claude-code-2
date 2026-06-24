import {QueuedPrompt, PromptStatus} from './queue.models';

export interface QueueGlobalState {
  totalProcessed: number;
  failedCount: number;
  rateLimitedCount: number;
  lastProcessed: Date | null;
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
  listPrompts(statusFilter?: PromptStatus): Promise<QueuedPrompt[]>;
  updatePromptStatus(id: string, status: PromptStatus, patch: PromptPatch): Promise<void>;
  saveOutput(id: string, output: string): Promise<void>;
  cancelPrompt(id: string): Promise<boolean>;
  getQueueState(): Promise<QueueGlobalState>;
  incrementCounter(field: 'totalProcessed' | 'failedCount' | 'rateLimitedCount'): Promise<void>;
  setLastProcessed(at: Date): Promise<void>;
  getSessionIdByChatName(chatName: string): Promise<string | null>;
  updateChatSessionId(chatName: string, sessionId: string): Promise<void>;
  getClaudeToken(): Promise<string>;
  patchActiveLimits(sessionLimitPercentage: number, weeklyLimitPercentage: number): Promise<void>;
  initialize(): Promise<void>;
  disconnect(): Promise<void>;
}
