import {BindingScope, LifeCycleObserver, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  ChatSessionRepository,
  ClaudeCodeApiKeyRepository,
  PromptRepository,
  QueueStateRepository,
} from '../repositories';
import {QueueManager} from '../queue/queueManager';
import {LoopBackStorageRepository} from '../repositories/loopback-storage';

const CLAUDE_COMMAND = process.env.CLAUDE_COMMAND ?? 'claude';
const TIMEOUT_SECONDS = Number(process.env.TIMEOUT ?? '3600');

export const QUEUE_SERVICE_KEY = 'lifeCycleObservers.QueueService';

@injectable({scope: BindingScope.SINGLETON})
export class QueueService implements LifeCycleObserver {
  private manager: QueueManager;

  constructor(
    @repository(PromptRepository) private promptRepo: PromptRepository,
    @repository(ChatSessionRepository) private chatSessionRepo: ChatSessionRepository,
    @repository(QueueStateRepository) private queueStateRepo: QueueStateRepository,
    @repository(ClaudeCodeApiKeyRepository) private apiKeyRepo: ClaudeCodeApiKeyRepository,
  ) {
    const storageRepo = new LoopBackStorageRepository(promptRepo, chatSessionRepo, queueStateRepo, apiKeyRepo);
    this.manager = new QueueManager(storageRepo, CLAUDE_COMMAND, TIMEOUT_SECONDS);
  }

  async start(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      console.log('[queue] modo setup — fila aguardando configuração do banco');
      return;
    }
    void this.manager.start();
  }

  async stop(): Promise<void> {
    this.manager.stop();
  }

  triggerIteration(): void {
    void this.manager.triggerIteration();
  }
}
