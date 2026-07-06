import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    sqlite3: {table: 'claude_code_api_keys'},
  },
})
export class ClaudeCodeApiKey extends Entity {
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
    sqlite3: {columnName: 'name'},
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    hidden: true,
    sqlite3: {columnName: 'key_value'},
  })
  keyValue: string;

  @property({
    type: 'boolean',
    default: true,
    sqlite3: {columnName: 'is_active'},
  })
  isActive: boolean;

  @property({
    type: 'date',
    defaultFn: 'now',
    sqlite3: {columnName: 'created_at'},
  })
  createdAt: string;

  @property({
    type: 'date',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'updated_at'},
  })
  updatedAt: string | null;

  @property({
    type: 'date',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'last_updated_limits'},
  })
  lastUpdatedLimits: string | null;

  @property({
    type: 'number',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'session_limit_percentage'},
  })
  sessionLimitPercentage: number | null;

  @property({
    type: 'number',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'weekly_limit_percentage'},
  })
  weeklyLimitPercentage: number | null;

  @property({
    type: 'date',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'session_reset_at'},
  })
  sessionResetAt: string | null;

  @property({
    type: 'date',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'weekly_reset_at'},
  })
  weeklyResetAt: string | null;

  @property({
    type: 'boolean',
    default: false,
    sqlite3: {columnName: 'rotation_enabled'},
  })
  rotationEnabled: boolean;

  @property({
    type: 'date',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'last_used_at'},
  })
  lastUsedAt: string | null;

  @property({
    type: 'date',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'rate_limited_until'},
  })
  rateLimitedUntil: string | null;

  constructor(data?: Partial<ClaudeCodeApiKey>) {
    super(data);
  }
}

export interface ClaudeCodeApiKeyRelations {}
export type ClaudeCodeApiKeyWithRelations = ClaudeCodeApiKey & ClaudeCodeApiKeyRelations;
