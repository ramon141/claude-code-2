import {v4 as uuidv4} from 'uuid';
import dayjs from 'dayjs';

export enum PromptStatus {
  QUEUED = 'queued',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RATE_LIMITED = 'rate_limited',
}

export interface RateLimitInfo {
  isRateLimited: boolean;
  resetTime: Date | null;
  limitMessage: string;
  timestamp: Date | null;
}

export class QueuedPrompt {
  id: string;
  content: string;
  workingDirectory: string;
  createdAt: Date;
  priority: number;
  contextFiles: string[];
  maxRetries: number;
  retryCount: number;
  status: PromptStatus;
  executionLog: string;
  estimatedTokens: number | null;
  lastExecuted: Date | null;
  rateLimitedAt: Date | null;
  resetTime: Date | null;
  sessionId: string | null;
  isSessionStart: boolean;
  chatName: string | null;
  claudeModel: string | null;
  waitForPromptId: number | null;
  useWaitResponse: boolean;

  constructor(params: Partial<Omit<QueuedPrompt, 'addLog' | 'canRetry' | 'shouldExecuteNow'>> = {}) {
    this.id = params.id ?? uuidv4().substring(0, 8);
    this.content = params.content ?? '';
    this.workingDirectory = params.workingDirectory ?? '.';
    this.createdAt = params.createdAt ?? new Date();
    this.priority = params.priority ?? 0;
    this.contextFiles = params.contextFiles ?? [];
    this.maxRetries = params.maxRetries ?? 3;
    this.retryCount = params.retryCount ?? 0;
    this.status = params.status ?? PromptStatus.QUEUED;
    this.executionLog = params.executionLog ?? '';
    this.estimatedTokens = params.estimatedTokens ?? null;
    this.lastExecuted = params.lastExecuted ?? null;
    this.rateLimitedAt = params.rateLimitedAt ?? null;
    this.resetTime = params.resetTime ?? null;
    this.sessionId = params.sessionId ?? null;
    this.chatName = params.chatName ?? null;
    this.isSessionStart = params.isSessionStart ?? false;
    this.claudeModel = params.claudeModel ?? null;
    this.waitForPromptId = params.waitForPromptId ?? null;
    this.useWaitResponse = params.useWaitResponse ?? false;
  }

  addLog(message: string): void {
    const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
    this.executionLog += `[${timestamp}] ${message}\n`;
  }

  canRetry(): boolean {
    return (
      this.retryCount < this.maxRetries &&
      [PromptStatus.FAILED, PromptStatus.RATE_LIMITED].includes(this.status)
    );
  }

  shouldExecuteNow(): boolean {
    if (this.status !== PromptStatus.RATE_LIMITED) return true;
    if (this.resetTime && !dayjs(this.resetTime).isAfter(dayjs())) return true;
    return false;
  }
}

export class ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  rateLimitInfo: RateLimitInfo | null;
  executionTime: number;
  sessionId: string | null;
  isCliNotFound: boolean;
  isAuthError: boolean;

  constructor(params: {
    success: boolean;
    output: string;
    error?: string;
    rateLimitInfo?: RateLimitInfo | null;
    executionTime?: number;
    sessionId?: string | null;
    isCliNotFound?: boolean;
    isAuthError?: boolean;
  }) {
    this.success = params.success;
    this.output = params.output;
    this.error = params.error ?? '';
    this.rateLimitInfo = params.rateLimitInfo ?? null;
    this.executionTime = params.executionTime ?? 0;
    this.sessionId = params.sessionId ?? null;
    this.isCliNotFound = params.isCliNotFound ?? false;
    this.isAuthError = params.isAuthError ?? false;
  }

  get isRateLimited(): boolean {
    return this.rateLimitInfo !== null && this.rateLimitInfo.isRateLimited;
  }
}
