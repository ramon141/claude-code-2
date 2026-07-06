import {Entity, hasMany, model, property} from '@loopback/repository';
import {PromptContextFile} from './prompt-context-file.model';

export type PromptStatus =
  | 'draft'
  | 'queued'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rate_limited';

@model({
  settings: {
    sqlite3: {table: 'prompts'},
  },
})
export class Prompt extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    sqlite3: {columnName: 'id'},
  })
  id: number;

  @property({
    type: 'string',
    required: true,
    sqlite3: {columnName: 'content'},
  })
  content: string;

  @property({
    type: 'string',
    required: true,
    default: 'queued',
    sqlite3: {columnName: 'status'},
  })
  status: PromptStatus;

  @property({
    type: 'number',
    default: 0,
    sqlite3: {columnName: 'priority'},
  })
  priority: number;

  @property({
    type: 'string',
    required: true,
    sqlite3: {columnName: 'working_directory'},
  })
  workingDirectory: string;

  @property({
    type: 'number',
    default: 3,
    sqlite3: {columnName: 'max_retries'},
  })
  maxRetries: number;

  @property({
    type: 'number',
    default: 0,
    sqlite3: {columnName: 'retry_count'},
  })
  retryCount: number;

  @property({
    type: 'number',
    required: false,
    sqlite3: {columnName: 'estimated_tokens'},
  })
  estimatedTokens: number | null;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'session_id'},
  })
  sessionId: string | null;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'chat_name'},
  })
  chatName: string | null;

  @property({
    type: 'boolean',
    default: false,
    sqlite3: {columnName: 'is_session_start'},
  })
  isSessionStart: boolean;

  @property({
    type: 'string',
    default: '',
    sqlite3: {columnName: 'execution_log'},
  })
  output: string;

  @property({
    type: 'date',
    defaultFn: 'now',
    sqlite3: {columnName: 'created_at'},
  })
  createdAt: string;

  @property({
    type: 'date',
    required: false,
    sqlite3: {columnName: 'last_executed'},
  })
  lastExecuted: string | null;

  @property({
    type: 'date',
    required: false,
    sqlite3: {columnName: 'rate_limited_at'},
  })
  rateLimitedAt: string | null;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'whatsapp_phone'},
  })
  whatsappPhone: string | null;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'claude_model'},
  })
  claudeModel: string | null;

  @property({
    type: 'number',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'wait_for_prompt_id'},
  })
  waitForPromptId: number | null;

  @property({
    type: 'boolean',
    default: false,
    sqlite3: {columnName: 'use_wait_response'},
  })
  useWaitResponse: boolean;

  @property({
    type: 'date',
    required: false,
    sqlite3: {columnName: 'reset_time'},
  })
  resetTime: string | null;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'diff'},
  })
  diff: string | null;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'base_ref'},
  })
  baseRef: string | null;

  @property({
    type: 'number',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'input_tokens'},
  })
  inputTokens: number | null;

  @property({
    type: 'number',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'output_tokens'},
  })
  outputTokens: number | null;

  @hasMany(() => PromptContextFile, {keyTo: 'promptId'})
  contextFiles: PromptContextFile[];

  constructor(data?: Partial<Prompt>) {
    super(data);
  }
}

export interface PromptRelations {
  contextFiles?: PromptContextFile[];
}
export type PromptWithRelations = Prompt & PromptRelations;
