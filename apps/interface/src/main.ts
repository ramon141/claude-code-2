import { config } from './config';
import { QueueManager } from './queueManager';
import { ApiStorageRepository } from './repository/ApiStorageRepository';

const repository = new ApiStorageRepository(config.API_URL, config.API_KEY);

const manager = new QueueManager(
  repository,
  config.CLAUDE_COMMAND,
  config.CHECK_INTERVAL,
  config.TIMEOUT,
);

void manager.start();
