import { QueuedPrompt, QueueState, PromptStatus, ExecutionResult } from './models';
import { ClaudeCodeInterface } from './claudeInterface';
import { IStorageRepository, ChatSessionRow } from './repository/IStorageRepository';
import { fetchRateLimits } from './rateLimitsService';
import { createWsClient } from './wsClient';

const CHAT_INITIAL_PRIORITY = -1;
const CONTENT_PREVIEW_LENGTH = 50;

export class QueueManager {
  readonly claudeInterface: ClaudeCodeInterface;
  private repository: IStorageRepository;
  private wsUrl: string;
  private running: boolean;
  private processing: boolean;
  private disconnectWs: (() => void) | null;

  constructor(
    repository: IStorageRepository,
    claudeCommand: string = 'claude',
    timeout: number = 3600,
    wsUrl: string = 'ws://127.0.0.1:3000/ws',
  ) {
    this.repository = repository;
    this.claudeInterface = new ClaudeCodeInterface(claudeCommand, timeout);
    this.wsUrl = wsUrl;
    this.running = false;
    this.processing = false;
    this.disconnectWs = null;
  }

  private setupSignalHandlers(): void {
    const shutdown = (signal: string) => {
      console.log(`\nReceived ${signal}, shutting down gracefully...`);
      this.stop();
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  async start(callback?: (state: QueueState) => void): Promise<void> {
    console.log('Starting Claude Code Queue Manager...');
    this.setupSignalHandlers();

    const [isWorking, message] = this.claudeInterface.testConnection();
    if (!isWorking) { console.error(`Error: ${message}`); return; }
    console.log(`✓ ${message}`);

    try {
      await this.repository.initialize();
      console.log('✓ Connected to API');
    } catch (e) {
      console.error(`Error connecting to API: ${e}`);
      return;
    }

    this.running = true;
    await this.runLoop(callback);
  }

  private async runLoop(callback?: (state: QueueState) => void): Promise<void> {
    if (!this.running) { await this.shutdown(); return; }

    await this.triggerIteration(callback);

    this.disconnectWs = createWsClient(this.wsUrl, () => {
      void this.triggerIteration(callback);
    });
  }

  private async triggerIteration(callback?: (state: QueueState) => void): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      await this.processQueueIteration(callback);
    } catch (e) {
      console.error('Error in queue processing:', e);
    } finally {
      this.processing = false;
    }
  }

  stop(): void {
    this.running = false;
    if (this.disconnectWs) { this.disconnectWs(); this.disconnectWs = null; }
  }

  private async shutdown(): Promise<void> {
    console.log('Shutting down...');
    await this.repository.disconnect();
    console.log('Queue manager stopped');
  }

  private async resolveSessionId(prompt: QueuedPrompt): Promise<QueuedPrompt | null> {
    if (prompt.sessionId || prompt.isSessionStart) return prompt;
    if (!prompt.chatName) {
      console.warn(`⚠ Prompt ${prompt.id} sem sessionId nem chatName — ignorado.`);
      await this.repository.updatePromptStatus(prompt.id, PromptStatus.FAILED, { retryCount: prompt.maxRetries });
      return null;
    }
    const sessionId = await this.repository.getSessionIdByChatName(prompt.chatName);
    if (!sessionId) {
      console.warn(`⚠ Prompt ${prompt.id}: chat '${prompt.chatName}' ainda não tem sessão ativa — aguardando.`);
      return null;
    }
    prompt.sessionId = sessionId;
    return prompt;
  }

  private async markExecuting(prompt: QueuedPrompt): Promise<void> {
    await this.repository.updatePromptStatus(prompt.id, PromptStatus.EXECUTING, { lastExecuted: new Date() });
  }

  private async cancelPendingChatPrompts(chatName: string, excludeId: string): Promise<void> {
    const queued = await this.repository.listPrompts(PromptStatus.QUEUED);
    const pending = queued.filter((p) => p.chatName === chatName && p.id !== excludeId);
    for (const p of pending) {
      await this.repository.cancelPrompt(p.id);
      console.warn(`✗ Prompt ${p.id} cancelado — sessão do chat '${chatName}' não foi estabelecida.`);
    }
  }

  private async runPrompt(prompt: QueuedPrompt): Promise<void> {
    let oauthToken: string;
    try {
      oauthToken = await this.repository.getClaudeToken();
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      await this.repository.saveOutput(prompt.id, `Erro ao obter Claude token: ${error}`);
      await this.repository.updatePromptStatus(prompt.id, PromptStatus.FAILED, { retryCount: prompt.maxRetries });
      await this.repository.incrementCounter('failedCount');
      console.error(`✗ Prompt ${prompt.id} failed — Claude token unavailable: ${error}`);
      return;
    }
    const onFlush = (text: string) => this.repository.saveOutput(prompt.id, text);
    const result = await this.claudeInterface.executePrompt(prompt, oauthToken, onFlush);
    if (prompt.isSessionStart && result.sessionId && prompt.chatName) {
      await this.repository.updateChatSessionId(prompt.chatName, result.sessionId);
      await this.repository.updatePromptStatus(prompt.id, PromptStatus.EXECUTING, { sessionId: result.sessionId });
      console.log(`✓ Session ID capturado do Claude: ${result.sessionId}`);
    }
    if (prompt.isSessionStart && !result.sessionId && prompt.chatName) {
      await this.cancelPendingChatPrompts(prompt.chatName, prompt.id);
    }
    await this.processExecutionResult(prompt, result);
    await this.updateRateLimits(oauthToken);
  }

  private async getExecutingChatNames(): Promise<Set<string>> {
    const executing = await this.repository.listPrompts(PromptStatus.EXECUTING);
    return new Set(executing.map((p) => p.chatName).filter((c): c is string => c !== null));
  }

  private sortByPriorityAndDate(prompts: QueuedPrompt[]): QueuedPrompt[] {
    return [...prompts].sort(
      (a, b) => a.priority - b.priority || a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }

  private async processQueueIteration(callback?: (state: QueueState) => void): Promise<void> {
    const busyChats = await this.getExecutingChatNames();
    const queued = this.sortByPriorityAndDate(await this.repository.listPrompts(PromptStatus.QUEUED));

    let dispatched = 0;
    for (const next of queued) {
      if (next.chatName && busyChats.has(next.chatName)) continue;
      const prompt = await this.resolveSessionId(next);
      if (!prompt) {
        if (next.chatName) busyChats.add(next.chatName);
        continue;
      }
      console.log(`Executing prompt ${prompt.id}: ${prompt.content.substring(0, CONTENT_PREVIEW_LENGTH)}...`);
      await this.markExecuting(prompt);
      if (prompt.chatName) busyChats.add(prompt.chatName);
      void this.runPrompt(prompt).catch((e) => console.error(`Error running prompt ${prompt.id}:`, e));
      dispatched++;
    }
    if (dispatched === 0 && callback) {
      callback(await this.buildQueueState());
    }
  }

  private async updateRateLimits(oauthToken: string): Promise<void> {
    try {
      const limits = await fetchRateLimits(oauthToken);
      await this.repository.patchActiveLimits(limits.sessionLimitPercentage, limits.weeklyLimitPercentage);
      console.log(`✓ Rate limits updated: 5h=${limits.sessionLimitPercentage}% 7d=${limits.weeklyLimitPercentage}%`);
    } catch (e) {
      console.warn(`⚠ Failed to update rate limits: ${e}`);
    }
  }

  private async handleSuccess(prompt: QueuedPrompt, result: ExecutionResult): Promise<void> {
    await this.repository.updatePromptStatus(prompt.id, PromptStatus.COMPLETED, { isSessionStart: false });
    if (result.output) await this.repository.saveOutput(prompt.id, result.output);
    await this.repository.incrementCounter('totalProcessed');
    console.log(`✓ Prompt ${prompt.id} completed in ${result.executionTime.toFixed(1)}s`);
  }

  private async handleRateLimit(prompt: QueuedPrompt, result: ExecutionResult): Promise<void> {
    const resetTime = result.rateLimitInfo?.resetTime ?? undefined;
    await this.repository.updatePromptStatus(prompt.id, PromptStatus.RATE_LIMITED, { rateLimitedAt: new Date(), retryCount: prompt.retryCount + 1, resetTime });
    if (result.rateLimitInfo?.limitMessage) await this.repository.saveOutput(prompt.id, result.rateLimitInfo.limitMessage);
    await this.repository.incrementCounter('rateLimitedCount');
    console.log(`⚠ Prompt ${prompt.id} rate limited, will retry later`);
  }

  private async handleFailure(prompt: QueuedPrompt, result: ExecutionResult): Promise<void> {
    const newRetryCount = prompt.retryCount + 1;
    const canRetry = newRetryCount < prompt.maxRetries;
    const nextStatus = canRetry ? PromptStatus.QUEUED : PromptStatus.FAILED;

    await this.repository.updatePromptStatus(prompt.id, nextStatus, { retryCount: newRetryCount });
    if (result.error) await this.repository.saveOutput(prompt.id, result.error);

    if (canRetry) {
      console.log(`✗ Prompt ${prompt.id} failed, will retry (${newRetryCount}/${prompt.maxRetries})`);
    } else {
      await this.repository.incrementCounter('failedCount');
      console.log(`✗ Prompt ${prompt.id} failed permanently after ${prompt.maxRetries} attempts`);
    }
  }

  private async processExecutionResult(prompt: QueuedPrompt, result: ExecutionResult): Promise<void> {
    if (result.success) await this.handleSuccess(prompt, result);
    else if (result.isRateLimited) await this.handleRateLimit(prompt, result);
    else await this.handleFailure(prompt, result);

    await this.repository.setLastProcessed(new Date());
  }

  async addPrompt(prompt: QueuedPrompt): Promise<boolean> {
    try {
      await this.repository.insertPrompt(prompt);
      console.log(`✓ Added prompt ${prompt.id} to queue`);
      return true;
    } catch (e) {
      console.error(`Error adding prompt: ${e}`);
      return false;
    }
  }

  async removePrompt(promptId: string): Promise<boolean> {
    try {
      const cancelled = await this.repository.cancelPrompt(promptId);
      console.log(cancelled ? `✓ Cancelled prompt ${promptId}` : `Prompt ${promptId} not found`);
      return cancelled;
    } catch (e) {
      console.error(`Error removing prompt: ${e}`);
      return false;
    }
  }

  async getStatus(): Promise<QueueState> {
    return this.buildQueueState();
  }

  async listChatSessions(): Promise<ChatSessionRow[]> {
    return this.repository.listChatSessions();
  }

  async updateChatLastUsed(chatName: string): Promise<void> {
    await this.repository.updateChatSessionLastUsed(chatName);
  }

  private async buildQueueState(): Promise<QueueState> {
    const [prompts, globalState] = await Promise.all([
      this.repository.listPrompts(),
      this.repository.getQueueState(),
    ]);

    const state = new QueueState();
    state.prompts = prompts;
    state.totalProcessed = globalState.totalProcessed;
    state.failedCount = globalState.failedCount;
    state.rateLimitedCount = globalState.rateLimitedCount;
    state.lastProcessed = globalState.lastProcessed;
    return state;
  }

  async findSessionByChatName(chatName: string): Promise<string | null> {
    return this.repository.getSessionIdByChatName(chatName);
  }

  async createChatSession(
    chatName: string,
    initialPrompt: string,
    workingDirectory: string = '.',
  ): Promise<[boolean, string, string | null]> {
    try {
      if (await this.repository.chatExists(chatName)) {
        return [false, `Chat '${chatName}' already exists`, null];
      }

      const saved = await this.repository.saveChatSession(chatName, workingDirectory);
      if (!saved) return [false, 'Failed to save chat session', null];

      await this.addPrompt(new QueuedPrompt({
        content: initialPrompt,
        workingDirectory,
        chatName,
        sessionId: null,
        isSessionStart: true,
        priority: CHAT_INITIAL_PRIORITY,
      }));

      return [true, `Chat session '${chatName}' created successfully`, null];
    } catch (e) {
      return [false, `Error creating chat session: ${e}`, null];
    }
  }
}
