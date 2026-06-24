import { config } from './config';
import { QueueManager } from './queueManager';
import { ApiStorageRepository } from './repository/ApiStorageRepository';

const repository = new ApiStorageRepository();

const manager = new QueueManager(
  repository,
  config.CLAUDE_COMMAND,
  config.TIMEOUT,
);

void manager.start();
