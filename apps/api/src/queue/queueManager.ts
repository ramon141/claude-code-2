import {fork} from 'child_process';
import * as path from 'path';
import {QueuedPrompt, PromptStatus, ExecutionResult} from './queue.models';
import {ClaudeCredentials, IStorageRepository, PromptPatch} from './IStorageRepository';
import {fetchRateLimits} from './rateLimitsService';
import type {WorkerMessage, WorkerResultData} from './claudeWorker';

const CHAT_INITIAL_PRIORITY = -1;
const CONTENT_PREVIEW_LENGTH = 50;
const RATE_LIMIT_SWEEP_INTERVAL_MS = 60_000;

export class QueueManager {
  private repository: IStorageRepository;
  private claudeCommand: string;
  private timeout: number;
  private processing: boolean;
  private rateLimitSweep: NodeJS.Timeout | null;

  constructor(repository: IStorageRepository, claudeCommand: string = 'claude', timeout: number = 3600) {
    this.repository = repository;
    this.claudeCommand = claudeCommand;
    this.timeout = timeout;
    this.processing = false;
    this.rateLimitSweep = null;
  }

  async start(): Promise<void> {
    console.log('[queue] Starting...');
    try {
      await this.repository.initialize();
      console.log('[queue] Connected to storage');
    } catch (e) {
      console.error(`[queue] Storage connection failed: ${e}`);
      return;
    }
    await this.triggerIteration();
    this.startRateLimitSweep();
    console.log('[queue] Ready — waiting for events');
  }

  stop(): void {
    console.log('[queue] Stopping...');
    if (this.rateLimitSweep) clearInterval(this.rateLimitSweep);
    this.rateLimitSweep = null;
    void this.repository.disconnect();
  }

  // Varre periodicamente os prompts em RATE_LIMITED: os que já passaram do
  // resetTime voltam pra fila (ou falham se esgotaram retries). Garante que um
  // prompt travado por limite seja retomado sozinho assim que o limite reseta.
  private startRateLimitSweep(): void {
    this.rateLimitSweep = setInterval(() => {
      void this.requeueReadyRateLimited().catch(e => console.error('[queue] Rate-limit sweep error:', e));
    }, RATE_LIMIT_SWEEP_INTERVAL_MS);
    this.rateLimitSweep.unref();
  }

  private async requeueReadyRateLimited(): Promise<void> {
    const limited = await this.repository.listPrompts(PromptStatus.RATE_LIMITED);
    const ready = limited.filter(p => p.shouldExecuteNow());
    if (ready.length === 0) return;
    for (const prompt of ready) {
      if (prompt.canRetry()) {
        await this.repository.updatePromptStatus(prompt.id, PromptStatus.QUEUED, {});
        console.log(`↻ Prompt ${prompt.id} liberado do rate limit — re-enfileirado`);
      } else {
        await this.repository.updatePromptStatus(prompt.id, PromptStatus.FAILED, {});
        await this.repository.incrementCounter('failedCount');
        console.log(`✗ Prompt ${prompt.id} falhou — retries esgotados após rate limit`);
      }
    }
    void this.triggerIteration();
  }

  triggerIteration(): Promise<void> {
    if (this.processing) return Promise.resolve();
    this.processing = true;
    return this.processQueueIteration()
      .catch(e => console.error('[queue] Iteration error:', e))
      .finally(() => {this.processing = false;});
  }

  private async processQueueIteration(): Promise<void> {
    const busyChats = await this.getExecutingChatNames();
    const queued = this.sortByPriorityAndDate(await this.repository.listPrompts(PromptStatus.QUEUED));

    for (const next of queued) {
      if (next.chatName && busyChats.has(next.chatName)) continue;
      const prompt = await this.resolveSessionId(next);
      if (!prompt) {
        if (next.chatName) busyChats.add(next.chatName);
        continue;
      }
      console.log(`[queue] Executing prompt ${prompt.id}: ${prompt.content.substring(0, CONTENT_PREVIEW_LENGTH)}...`);
      await this.markExecuting(prompt);
      if (prompt.chatName) busyChats.add(prompt.chatName);
      void this.runPrompt(prompt).catch(e => console.error(`[queue] Error running prompt ${prompt.id}:`, e));
    }
  }

  private async resolveSessionId(prompt: QueuedPrompt): Promise<QueuedPrompt | null> {
    if (prompt.sessionId || prompt.isSessionStart) return prompt;
    if (!prompt.chatName) {
      console.warn(`⚠ Prompt ${prompt.id} sem sessionId nem chatName — ignorado.`);
      await this.repository.updatePromptStatus(prompt.id, PromptStatus.FAILED, {retryCount: prompt.maxRetries});
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
    await this.repository.updatePromptStatus(prompt.id, PromptStatus.EXECUTING, {lastExecuted: new Date()});
  }

  private async cancelPendingChatPrompts(chatName: string, excludeId: string): Promise<void> {
    const queued = await this.repository.listPrompts(PromptStatus.QUEUED);
    const pending = queued.filter(p => p.chatName === chatName && p.id !== excludeId);
    for (const p of pending) {
      await this.repository.cancelPrompt(p.id);
      console.warn(`✗ Prompt ${p.id} cancelado — sessão do chat '${chatName}' não foi estabelecida.`);
    }
  }

  private runInFork(
    prompt: QueuedPrompt,
    oauthToken: string,
    onFlush: (text: string) => Promise<void>,
  ): Promise<ExecutionResult> {
    const workerPath = path.join(__dirname, 'claudeWorker.js');
    return new Promise(resolve => {
      const worker = fork(workerPath);
      let resolved = false;

      const safeResolve = (result: ExecutionResult) => {
        if (!resolved) {resolved = true; resolve(result);}
      };

      worker.on('message', (msg: WorkerMessage) => {
        if (msg.type === 'flush') void onFlush(msg.text).catch(() => {});
        if (msg.type === 'done') {safeResolve(new ExecutionResult(msg.result as WorkerResultData)); worker.kill();}
        if (msg.type === 'error') {
          safeResolve(new ExecutionResult({success: false, output: '', error: msg.message}));
          worker.kill();
        }
      });

      worker.on('exit', code => {
        if (code !== 0) {
          safeResolve(new ExecutionResult({success: false, output: '', error: `Worker exited with code ${code}`}));
        }
      });

      worker.on('error', err => {
        safeResolve(new ExecutionResult({success: false, output: '', error: `Worker error: ${err.message}`}));
      });

      worker.send({
        promptData: {
          id: prompt.id, content: prompt.content, workingDirectory: prompt.workingDirectory,
          sessionId: prompt.sessionId, contextFiles: prompt.contextFiles, isSessionStart: prompt.isSessionStart, claudeModel: prompt.claudeModel,
        },
        oauthToken,
        claudeCommand: this.claudeCommand,
        timeout: this.timeout,
      });
    });
  }

  private async runPrompt(prompt: QueuedPrompt): Promise<void> {
    let creds: ClaudeCredentials;
    try {
      creds = await this.repository.getClaudeToken();
    } catch (e) {
      const error = e instanceof Error ? e.message : String(e);
      await this.repository.saveOutput(prompt.id, `Erro ao obter Claude token: ${error}`);
      await this.repository.updatePromptStatus(prompt.id, PromptStatus.FAILED, {retryCount: prompt.maxRetries});
      await this.repository.incrementCounter('failedCount');
      console.error(`✗ Prompt ${prompt.id} failed — Claude token unavailable: ${error}`);
      return;
    }
    const onFlush = (text: string) => this.repository.saveOutput(prompt.id, text);
    const result = await this.runInFork(prompt, creds.token, onFlush);
    if (prompt.isSessionStart && result.sessionId && prompt.chatName) {
      await this.repository.updateChatSessionId(prompt.chatName, result.sessionId);
      await this.repository.updatePromptStatus(prompt.id, PromptStatus.EXECUTING, {sessionId: result.sessionId});
      console.log(`✓ Session ID capturado do Claude: ${result.sessionId}`);
    }
    if (prompt.isSessionStart && !result.sessionId && prompt.chatName) {
      await this.cancelPendingChatPrompts(prompt.chatName, prompt.id);
    }
    await this.processExecutionResult(prompt, result, creds.keyId);
    await this.updateRateLimits(creds.keyId, creds.token);
  }

  private async getExecutingChatNames(): Promise<Set<string>> {
    const executing = await this.repository.listPrompts(PromptStatus.EXECUTING);
    return new Set(executing.map(p => p.chatName).filter((c): c is string => c !== null));
  }

  private sortByPriorityAndDate(prompts: QueuedPrompt[]): QueuedPrompt[] {
    return [...prompts].sort((a, b) => a.priority - b.priority || a.createdAt.getTime() - b.createdAt.getTime());
  }

  private async updateRateLimits(keyId: number, oauthToken: string): Promise<void> {
    try {
      const limits = await fetchRateLimits(oauthToken);
      await this.repository.patchLimitsByKeyId(keyId, limits.sessionLimitPercentage, limits.weeklyLimitPercentage);
      console.log(`✓ Rate limits updated: 5h=${limits.sessionLimitPercentage}% 7d=${limits.weeklyLimitPercentage}%`);
    } catch (e) {
      console.warn(`⚠ Failed to update rate limits: ${e}`);
    }
  }

  private async handleSuccess(prompt: QueuedPrompt, result: ExecutionResult): Promise<void> {
    await this.repository.updatePromptStatus(prompt.id, PromptStatus.COMPLETED, {isSessionStart: false});
    if (result.output) await this.repository.saveOutput(prompt.id, result.output);
    await this.repository.incrementCounter('totalProcessed');
    console.log(`✓ Prompt ${prompt.id} completed in ${result.executionTime.toFixed(1)}s`);
  }

  private async handleRateLimit(prompt: QueuedPrompt, result: ExecutionResult, keyId: number): Promise<void> {
    const resetTime = result.rateLimitInfo?.resetTime ?? undefined;
    if (resetTime) await this.repository.markKeyRateLimited(keyId, resetTime);
    if (result.rateLimitInfo?.limitMessage) await this.repository.saveOutput(prompt.id, result.rateLimitInfo.limitMessage);
    await this.repository.incrementCounter('rateLimitedCount');

    const newRetryCount = prompt.retryCount + 1;
    const canFailover = newRetryCount < prompt.maxRetries
      && await this.repository.canFailoverToAnotherKey(keyId);
    if (canFailover) {
      await this.repository.updatePromptStatus(prompt.id, PromptStatus.QUEUED, {retryCount: newRetryCount});
      console.log(`⚠ Prompt ${prompt.id} rate limited — re-enfileirado para outra conta (rodízio)`);
      void this.triggerIteration();
      return;
    }
    await this.repository.updatePromptStatus(prompt.id, PromptStatus.RATE_LIMITED, {
      rateLimitedAt: new Date(), retryCount: newRetryCount, resetTime,
    });
    console.log(`⚠ Prompt ${prompt.id} rate limited`);
  }

  private async handleFailure(prompt: QueuedPrompt, result: ExecutionResult): Promise<void> {
    const newRetryCount = prompt.retryCount + 1;
    const canRetry = newRetryCount < prompt.maxRetries;
    await this.repository.updatePromptStatus(prompt.id, canRetry ? PromptStatus.QUEUED : PromptStatus.FAILED, {retryCount: newRetryCount});
    if (result.error) await this.repository.saveOutput(prompt.id, result.error);
    if (canRetry) {
      console.log(`✗ Prompt ${prompt.id} failed, retry (${newRetryCount}/${prompt.maxRetries})`);
    } else {
      await this.repository.incrementCounter('failedCount');
      console.log(`✗ Prompt ${prompt.id} failed permanently`);
    }
  }

  private async processExecutionResult(prompt: QueuedPrompt, result: ExecutionResult, keyId: number): Promise<void> {
    if (result.success) await this.handleSuccess(prompt, result);
    else if (result.isRateLimited) await this.handleRateLimit(prompt, result, keyId);
    else await this.handleFailure(prompt, result);
    await this.repository.setLastProcessed(new Date());
    void this.triggerIteration();
  }

  createChatSession(chatName: string, priority = CHAT_INITIAL_PRIORITY): {chatName: string; priority: number} {
    return {chatName, priority};
  }
}
