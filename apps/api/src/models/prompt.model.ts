import {Entity, hasMany, model, property} from '@loopback/repository';
import {PromptContextFile} from './prompt-context-file.model';

export type PromptStatus =
  | 'queued'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rate_limited';

@model({
  settings: {
    postgresql: {schema: 'public', table: 'prompts'},
  },
})
export class Prompt extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    postgresql: {columnName: 'id', dataType: 'integer'},
  })
  id: number;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'content', dataType: 'text'},
  })
  content: string;

  @property({
    type: 'string',
    required: true,
    default: 'queued',
    postgresql: {columnName: 'status', dataType: 'varchar'},
  })
  status: PromptStatus;

  @property({
    type: 'number',
    default: 0,
    postgresql: {columnName: 'priority', dataType: 'integer'},
  })
  priority: number;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'working_directory', dataType: 'text'},
  })
  workingDirectory: string;

  @property({
    type: 'number',
    default: 3,
    postgresql: {columnName: 'max_retries', dataType: 'integer'},
  })
  maxRetries: number;

  @property({
    type: 'number',
    default: 0,
    postgresql: {columnName: 'retry_count', dataType: 'integer'},
  })
  retryCount: number;

  @property({
    type: 'number',
    required: false,
    postgresql: {columnName: 'estimated_tokens', dataType: 'integer'},
  })
  estimatedTokens: number | null;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    postgresql: {columnName: 'session_id', dataType: 'varchar'},
  })
  sessionId: string | null;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    postgresql: {columnName: 'chat_name', dataType: 'varchar'},
  })
  chatName: string | null;

  @property({
    type: 'boolean',
    default: false,
    postgresql: {columnName: 'is_session_start', dataType: 'boolean'},
  })
  isSessionStart: boolean;

  @property({
    type: 'string',
    default: '',
    postgresql: {columnName: 'execution_log', dataType: 'text'},
  })
  output: string;

  @property({
    type: 'date',
    defaultFn: 'now',
    postgresql: {
      columnName: 'created_at',
      dataType: 'timestamp with time zone',
    },
  })
  createdAt: string;

  @property({
    type: 'date',
    required: false,
    postgresql: {
      columnName: 'last_executed',
      dataType: 'timestamp with time zone',
    },
  })
  lastExecuted: string | null;

  @property({
    type: 'date',
    required: false,
    postgresql: {
      columnName: 'rate_limited_at',
      dataType: 'timestamp with time zone',
    },
  })
  rateLimitedAt: string | null;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    postgresql: {columnName: 'whatsapp_phone', dataType: 'varchar'},
  })
  whatsappPhone: string | null;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    postgresql: {columnName: 'claude_model', dataType: 'varchar'},
  })
  claudeModel: string | null;

  @property({
    type: 'number',
    required: false,
    jsonSchema: {nullable: true},
    postgresql: {columnName: 'wait_for_prompt_id', dataType: 'integer'},
  })
  waitForPromptId: number | null;

  @property({
    type: 'boolean',
    default: false,
    postgresql: {columnName: 'use_wait_response', dataType: 'boolean'},
  })
  useWaitResponse: boolean;

  @property({
    type: 'date',
    required: false,
    postgresql: {
      columnName: 'reset_time',
      dataType: 'timestamp with time zone',
    },
  })
  resetTime: string | null;

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
