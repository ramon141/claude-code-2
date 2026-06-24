import {
  ChatSessionRepository,
  ClaudeCodeApiKeyRepository,
  PromptRepository,
  QueueStateRepository,
} from '.';
import {decryptValue} from '../authentication/auth.utils';
import {Prompt as LbPrompt, PromptStatus as LbPromptStatus} from '../models/prompt.model';
import {IStorageRepository, QueueGlobalState, PromptPatch} from '../queue/IStorageRepository';
import {QueuedPrompt, PromptStatus} from '../queue/queue.models';
import {NotificationService} from '../services/notification.service';

const COUNTER_COLUMNS: Record<string, string> = {
  totalProcessed: 'total_processed',
  failedCount: 'failed_count',
  rateLimitedCount: 'rate_limited_count',
};

export class LoopBackStorageRepository implements IStorageRepository {
  constructor(
    private promptRepo: PromptRepository,
    private chatSessionRepo: ChatSessionRepository,
    private queueStateRepo: QueueStateRepository,
    private apiKeyRepo: ClaudeCodeApiKeyRepository,
    private notifier: NotificationService,
  ) {}

  // Emite prompt:updated no WebSocket com o snapshot atual (status + output),
  // pra UI atualizar em tempo real sem precisar trocar de página.
  private async emitPromptUpdate(id: string): Promise<void> {
    const prompt = await this.promptRepo.findById(Number(id)).catch(() => null);
    if (!prompt) return;
    this.notifier.notify({
      event: 'prompt:updated',
      promptId: Number(id),
      status: prompt.status,
      output: prompt.output ?? '',
    });
  }

  private mapPrompt(p: LbPrompt): QueuedPrompt {
    return new QueuedPrompt({
      id: String(p.id),
      content: p.content,
      priority: p.priority,
      workingDirectory: p.workingDirectory,
      maxRetries: p.maxRetries,
      retryCount: p.retryCount,
      status: p.status as PromptStatus,
      sessionId: p.sessionId,
      chatName: p.chatName,
      isSessionStart: p.isSessionStart,
      executionLog: p.output,
      estimatedTokens: p.estimatedTokens,
      createdAt: new Date(p.createdAt),
      lastExecuted: p.lastExecuted ? new Date(p.lastExecuted) : null,
      rateLimitedAt: p.rateLimitedAt ? new Date(p.rateLimitedAt) : null,
      resetTime: p.resetTime ? new Date(p.resetTime) : null,
    });
  }

  async listPrompts(statusFilter?: PromptStatus): Promise<QueuedPrompt[]> {
    const prompts = statusFilter
      ? await this.promptRepo.find({where: {status: statusFilter as LbPromptStatus}})
      : await this.promptRepo.find();
    return prompts.map(p => this.mapPrompt(p));
  }

  async updatePromptStatus(id: string, status: PromptStatus, patch: PromptPatch): Promise<void> {
    const update: Partial<LbPrompt> = {status: status as LbPromptStatus};
    if (patch.retryCount !== undefined) update.retryCount = patch.retryCount;
    if (patch.lastExecuted) update.lastExecuted = patch.lastExecuted.toISOString();
    if (patch.rateLimitedAt) update.rateLimitedAt = patch.rateLimitedAt.toISOString();
    if (patch.resetTime) update.resetTime = patch.resetTime.toISOString();
    if (patch.isSessionStart !== undefined) update.isSessionStart = patch.isSessionStart;
    if (patch.sessionId !== undefined) update.sessionId = patch.sessionId;
    await this.promptRepo.updateById(Number(id), update);
    await this.emitPromptUpdate(id);
  }

  async saveOutput(id: string, output: string): Promise<void> {
    await this.promptRepo.updateById(Number(id), {output});
    await this.emitPromptUpdate(id);
  }

  async cancelPrompt(id: string): Promise<boolean> {
    const prompt = await this.promptRepo.findById(Number(id)).catch(() => null);
    if (!prompt) return false;
    await this.promptRepo.updateById(Number(id), {status: 'cancelled'});
    await this.emitPromptUpdate(id);
    return true;
  }

  async getQueueState(): Promise<QueueGlobalState> {
    const state = await this.queueStateRepo.findOne({});
    return {
      totalProcessed: state?.totalProcessed ?? 0,
      failedCount: state?.failedCount ?? 0,
      rateLimitedCount: state?.rateLimitedCount ?? 0,
      lastProcessed: state?.lastProcessed ? new Date(state.lastProcessed) : null,
    };
  }

  async incrementCounter(field: 'totalProcessed' | 'failedCount' | 'rateLimitedCount'): Promise<void> {
    const col = COUNTER_COLUMNS[field];
    await this.queueStateRepo.execute(`UPDATE queue_state SET ${col} = ${col} + 1 WHERE id = 1`, []);
  }

  async setLastProcessed(at: Date): Promise<void> {
    await this.queueStateRepo.updateAll({lastProcessed: at.toISOString()}, {});
  }

  async getSessionIdByChatName(chatName: string): Promise<string | null> {
    const session = await this.chatSessionRepo.findOne({where: {chatName}});
    return session?.sessionId ?? null;
  }

  async updateChatSessionId(chatName: string, sessionId: string): Promise<void> {
    const session = await this.chatSessionRepo.findOne({where: {chatName}});
    if (!session) return;
    await this.chatSessionRepo.updateById(session.id, {sessionId});
  }

  async getClaudeToken(): Promise<string> {
    const apiKey = await this.apiKeyRepo.findOne({where: {isActive: true}, order: ['createdAt DESC']});
    if (!apiKey) throw new Error('Nenhuma Claude Code API key ativa configurada');
    return decryptValue(apiKey.keyValue);
  }

  async patchActiveLimits(sessionLimitPercentage: number, weeklyLimitPercentage: number): Promise<void> {
    await this.apiKeyRepo.updateAll(
      {sessionLimitPercentage, weeklyLimitPercentage, lastUpdatedLimits: new Date().toISOString()},
      {isActive: true},
    );
  }

  async initialize(): Promise<void> {
    await this.queueStateRepo.findOne({});
  }

  async disconnect(): Promise<void> {
    // LoopBack manages the connection lifecycle
  }
}
