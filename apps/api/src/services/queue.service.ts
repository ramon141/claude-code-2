import fs from 'fs';
import {BindingScope, LifeCycleObserver, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {getSqliteFilePath} from '../config/app-config';
import {
  ChatSessionRepository,
  ClaudeCodeApiKeyRepository,
  PromptRepository,
  QueueStateRepository,
} from '../repositories';
import {QueueManager} from '../queue/queueManager';
import {LoopBackStorageRepository} from '../repositories/loopback-storage';
import {NOTIFICATION_SERVICE, NotificationService} from '../services/notification.service';
import {EVOLUTION_SERVICE, EvolutionService} from '../services/evolution.service';

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
    @inject(NOTIFICATION_SERVICE) private notifier: NotificationService,
    @inject(EVOLUTION_SERVICE) private evolutionService: EvolutionService,
  ) {
    const storageRepo = new LoopBackStorageRepository(
      promptRepo,
      chatSessionRepo,
      queueStateRepo,
      apiKeyRepo,
      notifier,
      evolutionService,
    );
    this.manager = new QueueManager(storageRepo, CLAUDE_COMMAND, TIMEOUT_SECONDS);
  }

  async start(): Promise<void> {
    if (!fs.existsSync(getSqliteFilePath())) {
      console.log('[queue] modo setup — fila aguardando inicialização do banco');
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

  cancelExecution(promptId: string): void {
    this.manager.cancelExecution(promptId);
  }

  get isReady(): boolean {
    return this.manager.isReady;
  }
}
