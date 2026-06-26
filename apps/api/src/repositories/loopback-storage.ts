import {
  ChatSessionRepository,
  ClaudeCodeApiKeyRepository,
  PromptRepository,
  QueueStateRepository,
} from '.';
import {decryptValue} from '../authentication/auth.utils';
import {readConfig} from '../config/app-config';
import {ClaudeCodeApiKey} from '../models/claude-code-api-key.model';
import {Prompt as LbPrompt, PromptStatus as LbPromptStatus, PromptWithRelations} from '../models/prompt.model';
import {PromptContextFile} from '../models/prompt-context-file.model';
import {ClaudeCredentials, IStorageRepository, QueueGlobalState, PromptPatch} from '../queue/IStorageRepository';
import {QueuedPrompt, PromptStatus} from '../queue/queue.models';
import {NotificationService} from '../services/notification.service';
import {EvolutionService} from '../services/evolution.service';

const COUNTER_COLUMNS: Record<string, string> = {
  totalProcessed: 'total_processed',
  failedCount: 'failed_count',
  rateLimitedCount: 'rate_limited_count',
};

function isKeyRateLimited(key: ClaudeCodeApiKey): boolean {
  if (!key.rateLimitedUntil) return false;
  return new Date(key.rateLimitedUntil).getTime() > Date.now();
}

function lastUsedRank(key: ClaudeCodeApiKey): number {
  return key.lastUsedAt ? new Date(key.lastUsedAt).getTime() : 0;
}

// Ordena pela conta menos usada; empate desempata pela mais antiga (createdAt).
function compareRotationKeys(a: ClaudeCodeApiKey, b: ClaudeCodeApiKey): number {
  const diff = lastUsedRank(a) - lastUsedRank(b);
  if (diff !== 0) return diff;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

const WHATSAPP_NOTIFY_STATUSES: PromptStatus[] = [PromptStatus.COMPLETED, PromptStatus.FAILED];

export class LoopBackStorageRepository implements IStorageRepository {
  constructor(
    private promptRepo: PromptRepository,
    private chatSessionRepo: ChatSessionRepository,
    private queueStateRepo: QueueStateRepository,
    private apiKeyRepo: ClaudeCodeApiKeyRepository,
    private notifier: NotificationService,
    private evolution: EvolutionService,
  ) {}

  // Emite prompt:updated no WebSocket com o snapshot atual (status + output),
  // pra UI atualizar em tempo real sem precisar trocar de página.
  private async emitPromptUpdate(id: string): Promise<void> {
    const prompt = await this.promptRepo.findById(Number(id)).catch(() => null);
    if (!prompt) return;
    this.notifier.notify({
      event: 'prompt:updated',
      promptId: Number(id),
      chatName: prompt.chatName ?? null,
      status: prompt.status,
      output: prompt.output ?? '',
    });
  }

  private mapPrompt(p: PromptWithRelations): QueuedPrompt {
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
      claudeModel: p.claudeModel,
      executionLog: p.output,
      estimatedTokens: p.estimatedTokens,
      createdAt: new Date(p.createdAt),
      lastExecuted: p.lastExecuted ? new Date(p.lastExecuted) : null,
      rateLimitedAt: p.rateLimitedAt ? new Date(p.rateLimitedAt) : null,
      resetTime: p.resetTime ? new Date(p.resetTime) : null,
      contextFiles: (p.contextFiles ?? []).map((f: PromptContextFile) => f.filePath),
      waitForPromptId: p.waitForPromptId ?? null,
      useWaitResponse: p.useWaitResponse ?? false,
    });
  }

  async listPrompts(statusFilter?: PromptStatus): Promise<QueuedPrompt[]> {
    const filter = {include: ['contextFiles'], ...(statusFilter ? {where: {status: statusFilter as LbPromptStatus}} : {})};
    const prompts = await this.promptRepo.find(filter);
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
    if (WHATSAPP_NOTIFY_STATUSES.includes(status)) {
      const prompt = await this.promptRepo.findById(Number(id)).catch(() => null);
      if (prompt) this.sendWhatsAppNotifications(prompt);
    }
  }

  private sendWhatsAppNotifications(prompt: LbPrompt): void {
    const cfg = readConfig();
    if (!cfg.notificationsEnabled || cfg.notificationPhones.length === 0) return;
    const chat = prompt.chatName ?? 'sem chat';
    const preview = prompt.content.length > 200 ? `${prompt.content.substring(0, 200)}…` : prompt.content;
    const message = `O Chat *${chat}* finalizou o prompt:\n\n${preview}`;
    for (const phone of cfg.notificationPhones) {
      this.evolution.sendText(phone, message).catch((err: Error) => {
        console.error(`[evolution] falha ao notificar ${phone}: ${err.message}`);
      });
    }
  }

  async saveOutput(id: string, output: string): Promise<void> {
    await this.promptRepo.updateById(Number(id), {output});
    await this.emitPromptUpdate(id);
  }

  async saveDiff(id: string, diff: string): Promise<void> {
    await this.promptRepo.updateById(Number(id), {diff});
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

  async getClaudeToken(): Promise<ClaudeCredentials> {
    if (readConfig().claudeRotationEnabled) {
      const rotated = await this.selectRotationKey();
      if (rotated) return rotated;
    }
    return this.getActiveCredentials();
  }

  private async getActiveCredentials(): Promise<ClaudeCredentials> {
    const apiKey = await this.apiKeyRepo.findOne({where: {isActive: true}, order: ['createdAt DESC']});
    if (!apiKey) throw new Error('Nenhuma Claude Code API key ativa configurada');
    return {token: decryptValue(apiKey.keyValue), keyId: apiKey.id};
  }

  // Round-robin entre contas marcadas para rodízio, pulando as ainda em rate
  // limit. Escolhe a menos usada (lastUsedAt mais antigo; nunca usada primeiro).
  private async selectRotationKey(): Promise<ClaudeCredentials | null> {
    const candidates = await this.apiKeyRepo.find({where: {rotationEnabled: true}});
    const available = candidates.filter(k => !isKeyRateLimited(k));
    if (available.length === 0) return null;
    const chosen = available.sort(compareRotationKeys)[0];
    await this.apiKeyRepo.updateById(chosen.id, {lastUsedAt: new Date().toISOString()});
    return {token: decryptValue(chosen.keyValue), keyId: chosen.id};
  }

  async patchLimitsByKeyId(keyId: number, sessionLimitPercentage: number, weeklyLimitPercentage: number): Promise<void> {
    await this.apiKeyRepo.updateById(keyId, {
      sessionLimitPercentage,
      weeklyLimitPercentage,
      lastUpdatedLimits: new Date().toISOString(),
    });
  }

  async markKeyRateLimited(keyId: number, until: Date): Promise<void> {
    await this.apiKeyRepo.updateById(keyId, {rateLimitedUntil: until.toISOString()});
  }

  // True se o rodízio está ligado e existe outra conta marcada, fora de rate
  // limit, diferente da que acabou de estourar — ou seja, dá pra fazer failover.
  async canFailoverToAnotherKey(excludeKeyId: number): Promise<boolean> {
    if (!readConfig().claudeRotationEnabled) return false;
    const candidates = await this.apiKeyRepo.find({where: {rotationEnabled: true}});
    return candidates.some(k => k.id !== excludeKeyId && !isKeyRateLimited(k));
  }

  async getPromptStatus(id: number): Promise<PromptStatus | null> {
    const prompt = await this.promptRepo.findById(id).catch(() => null);
    if (!prompt) return null;
    return prompt.status as PromptStatus;
  }

  async getPromptOutput(id: number): Promise<string | null> {
    const prompt = await this.promptRepo.findById(id).catch(() => null);
    return prompt?.output ?? null;
  }

  async initialize(): Promise<void> {
    await this.queueStateRepo.findOne({});
  }

  async disconnect(): Promise<void> {
    // LoopBack manages the connection lifecycle
  }
}
