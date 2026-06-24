import axios, { AxiosInstance, AxiosError } from 'axios';
import { Agent } from 'http';
import { QueuedPrompt, PromptStatus } from '../models';
import {
  IStorageRepository,
  QueueGlobalState,
  ChatSessionRow,
  PromptPatch,
} from './IStorageRepository';
import { ClaudeTokenResponse } from '../api/contracts';

interface PromptApiResponse {
  id: string;
  content: string;
  priority: number;
  workingDirectory: string;
  contextFiles: string[];
  maxRetries: number;
  retryCount: number;
  status: string;
  sessionId: string | null;
  chatName: string | null;
  isSessionStart: boolean;
  output: string;
  estimatedTokens: number | null;
  createdAt: string;
  lastExecuted: string | null;
  rateLimitedAt: string | null;
  resetTime: string | null;
}

interface QueueStateApiResponse {
  totalProcessed: number;
  failedCount: number;
  rateLimitedCount: number;
  lastProcessed: string | null;
}

export class ApiStorageRepository implements IStorageRepository {
  private http: AxiosInstance;

  constructor(apiUrl: string, apiKey: string) {
    this.http = axios.create({
      baseURL: apiUrl,
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
      timeout: 10000,
      httpAgent: new Agent({ keepAlive: false }),
    });
    this.setupInterceptors();
  }

  private isSilentRequest(method: string | undefined, url: string | undefined): boolean {
    return method?.toUpperCase() === 'GET' && url === '/prompts';
  }

  private setupInterceptors(): void {
    this.http.interceptors.request.use((config) => {
      if (this.isSilentRequest(config.method, config.url)) return config;
      const body = config.data ? ` body=${JSON.stringify(config.data)}` : '';
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}${body}`);
      return config;
    });

    this.http.interceptors.response.use(
      (response) => {
        if (this.isSilentRequest(response.config.method, response.config.url)) return response;
        console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        const method = error.config?.method?.toUpperCase() ?? '?';
        const url = error.config?.url ?? '?';
        const status = error.response?.status ?? 'no response';
        const message = error.message;
        console.error(`[API] ERROR ${method} ${url} → ${status}: ${message}`);
        if (error.response?.data) {
          console.error(`[API] Response body: ${JSON.stringify(error.response.data)}`);
        }
        return Promise.reject(error);
      },
    );
  }

  private mapResponseToPrompt(data: PromptApiResponse): QueuedPrompt {
    return new QueuedPrompt({
      id: data.id,
      content: data.content,
      priority: data.priority,
      workingDirectory: data.workingDirectory,
      contextFiles: data.contextFiles,
      maxRetries: data.maxRetries,
      retryCount: data.retryCount,
      status: data.status as PromptStatus,
      sessionId: data.sessionId,
      chatName: data.chatName,
      isSessionStart: data.isSessionStart,
      executionLog: data.output,
      estimatedTokens: data.estimatedTokens,
      createdAt: new Date(data.createdAt),
      lastExecuted: data.lastExecuted ? new Date(data.lastExecuted) : null,
      rateLimitedAt: data.rateLimitedAt ? new Date(data.rateLimitedAt) : null,
      resetTime: data.resetTime ? new Date(data.resetTime) : null,
    });
  }

  private isNotFound(err: AxiosError): boolean {
    return err.response?.status === 404;
  }

  async listPrompts(statusFilter?: PromptStatus): Promise<QueuedPrompt[]> {
    const params: Record<string, string> = {};  
    if (statusFilter) params['status'] = statusFilter;
    const res = await this.http.get<PromptApiResponse[]>('/prompts', { params });
    return res.data.map((d) => this.mapResponseToPrompt(d));
  }

  async insertPrompt(prompt: QueuedPrompt): Promise<void> {
    await this.http.post('/prompts', {
      id: prompt.id,
      content: prompt.content,
      priority: prompt.priority,
      workingDirectory: prompt.workingDirectory,
      contextFiles: prompt.contextFiles,
      maxRetries: prompt.maxRetries,
      estimatedTokens: prompt.estimatedTokens,
      sessionId: prompt.sessionId,
      isSessionStart: prompt.isSessionStart,
    });
  }

  async updatePromptStatus(
    id: string,
    status: PromptStatus,
    patch: PromptPatch,
  ): Promise<void> {
    await this.http.patch(`/prompts/${id}`, {
      status,
      retryCount: patch.retryCount,
      lastExecuted: patch.lastExecuted?.toISOString(),
      rateLimitedAt: patch.rateLimitedAt?.toISOString(),
      resetTime: patch.resetTime?.toISOString(),
      isSessionStart: patch.isSessionStart,
      sessionId: patch.sessionId,
    });
  }

  async saveOutput(id: string, output: string): Promise<void> {
    await this.http.patch(`/prompts/${id}`, { output });
  }

  async cancelPrompt(id: string): Promise<boolean> {
    try {
      await this.http.delete(`/prompts/${id}`);
      return true;
    } catch (err) {
      if (axios.isAxiosError(err) && this.isNotFound(err)) return false;
      throw err;
    }
  }

  async getQueueState(): Promise<QueueGlobalState> {
    const res = await this.http.get<QueueStateApiResponse>('/queue/state');
    return {
      totalProcessed: res.data.totalProcessed,
      failedCount: res.data.failedCount,
      rateLimitedCount: res.data.rateLimitedCount,
      lastProcessed: res.data.lastProcessed ? new Date(res.data.lastProcessed) : null,
    };
  }

  async incrementCounter(
    field: 'totalProcessed' | 'failedCount' | 'rateLimitedCount',
  ): Promise<void> {
    await this.http.post('/queue/state/increment', { field });
  }

  async setLastProcessed(at: Date): Promise<void> {
    await this.http.patch('/queue/state/last-processed', {
      lastProcessed: at.toISOString(),
    });
  }

  async saveChatSession(chatName: string, workingDir: string): Promise<boolean> {
    try {
      await this.http.post('/chat-sessions', { chatName, workingDirectory: workingDir });
      return true;
    } catch {
      return false;
    }
  }

  async updateChatSessionId(chatName: string, sessionId: string): Promise<void> {
    await this.http.patch(`/chat-sessions/${chatName}/session-id`, { sessionId });
  }

  async getSessionIdByChatName(chatName: string): Promise<string | null> {
    try {
      const res = await this.http.get<{ sessionId: string }>(`/chat-sessions/${chatName}`);
      return res.data.sessionId;
    } catch (err) {
      if (axios.isAxiosError(err) && this.isNotFound(err)) return null;
      throw err;
    }
  }

  async updateChatSessionLastUsed(chatName: string): Promise<void> {
    await this.http.patch(`/chat-sessions/${chatName}/last-used`);
  }

  async listChatSessions(): Promise<ChatSessionRow[]> {
    const res = await this.http.get<ChatSessionRow[]>('/chat-sessions');
    return res.data;
  }

  async deleteChatSession(chatName: string): Promise<boolean> {
    try {
      await this.http.delete(`/chat-sessions/${chatName}`);
      return true;
    } catch (err) {
      if (axios.isAxiosError(err) && this.isNotFound(err)) return false;
      throw err;
    }
  }

  async chatExists(chatName: string): Promise<boolean> {
    const sessionId = await this.getSessionIdByChatName(chatName);
    return sessionId !== null;
  }

  async getClaudeToken(): Promise<string> {
    const res = await this.http.get<ClaudeTokenResponse>('/auth/claude-token');
    return res.data.claudeOAuthToken;
  }

  async patchActiveLimits(sessionLimitPercentage: number, weeklyLimitPercentage: number): Promise<void> {
    await this.http.patch('/claude-code-api-keys/active/limits', { sessionLimitPercentage, weeklyLimitPercentage });
  }

  async initialize(): Promise<void> {
    // Verifica se a API está acessível
    await this.http.get('/queue/state');
  }

  async disconnect(): Promise<void> {
    // HTTP é stateless — nada a fechar
  }
}
