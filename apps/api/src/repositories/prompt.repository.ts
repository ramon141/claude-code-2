import {inject, Getter} from '@loopback/core';
import {
  DefaultCrudRepository,
  HasManyRepositoryFactory,
  repository,
} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {Prompt, PromptRelations, PromptContextFile, PromptStatus} from '../models';
import {PromptContextFileRepository} from './prompt-context-file.repository';

type RawPromptRow = {
  id: number;
  content: string;
  status: string;
  priority: number;
  working_directory: string;
  max_retries: number;
  retry_count: number;
  estimated_tokens: number | null;
  session_id: string | null;
  chat_name: string | null;
  is_session_start: boolean;
  execution_log: string;
  created_at: string;
  last_executed: string | null;
  rate_limited_at: string | null;
  reset_time: string | null;
};

export class PromptRepository extends DefaultCrudRepository<
  Prompt,
  typeof Prompt.prototype.id,
  PromptRelations
> {
  public readonly contextFiles: HasManyRepositoryFactory<
    PromptContextFile,
    typeof Prompt.prototype.id
  >;

  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
    @repository.getter('PromptContextFileRepository')
    contextFilesRepoGetter: Getter<PromptContextFileRepository>,
  ) {
    super(Prompt, dataSource);
    this.contextFiles = this.createHasManyRepositoryFactoryFor(
      'contextFiles',
      contextFilesRepoGetter,
    );
    this.registerInclusionResolver(
      'contextFiles',
      this.contextFiles.inclusionResolver,
    );
  }

  async findNextQueued(): Promise<Prompt | null> {
    const rows = await this.execute(
      `SELECT * FROM prompts
       WHERE status = 'queued'
         AND (session_id IS NULL OR session_id NOT IN (
           SELECT DISTINCT session_id FROM prompts
           WHERE status = 'executing' AND session_id IS NOT NULL
         ))
       ORDER BY priority ASC, created_at ASC
       LIMIT 1`,
      [],
    ) as RawPromptRow[];

    if (!rows || rows.length === 0) return null;
    return this.mapRawRow(rows[0]);
  }

  private mapRawRow(row: RawPromptRow): Prompt {
    return new Prompt({
      id: row.id,
      content: row.content,
      status: row.status as PromptStatus,
      priority: row.priority,
      workingDirectory: row.working_directory,
      maxRetries: row.max_retries,
      retryCount: row.retry_count,
      estimatedTokens: row.estimated_tokens,
      sessionId: row.session_id,
      chatName: row.chat_name,
      isSessionStart: row.is_session_start,
      output: row.execution_log,
      createdAt: row.created_at,
      lastExecuted: row.last_executed,
      rateLimitedAt: row.rate_limited_at,
      resetTime: row.reset_time,
    });
  }
}
