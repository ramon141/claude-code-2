import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    postgresql: {schema: 'public', table: 'claude_code_api_keys'},
  },
})
export class ClaudeCodeApiKey extends Entity {
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
    postgresql: {columnName: 'name', dataType: 'varchar'},
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    hidden: true,
    postgresql: {columnName: 'key_value', dataType: 'text'},
  })
  keyValue: string;

  @property({
    type: 'boolean',
    default: true,
    postgresql: {columnName: 'is_active', dataType: 'boolean'},
  })
  isActive: boolean;

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
    jsonSchema: {nullable: true},
    postgresql: {
      columnName: 'updated_at',
      dataType: 'timestamp with time zone',
    },
  })
  updatedAt: string | null;

  @property({
    type: 'date',
    required: false,
    jsonSchema: {nullable: true},
    postgresql: {
      columnName: 'last_updated_limits',
      dataType: 'timestamp with time zone',
    },
  })
  lastUpdatedLimits: string | null;

  @property({
    type: 'number',
    required: false,
    jsonSchema: {nullable: true},
    postgresql: {columnName: 'session_limit_percentage', dataType: 'numeric'},
  })
  sessionLimitPercentage: number | null;

  @property({
    type: 'number',
    required: false,
    jsonSchema: {nullable: true},
    postgresql: {columnName: 'weekly_limit_percentage', dataType: 'numeric'},
  })
  weeklyLimitPercentage: number | null;

  constructor(data?: Partial<ClaudeCodeApiKey>) {
    super(data);
  }
}

export interface ClaudeCodeApiKeyRelations {}
export type ClaudeCodeApiKeyWithRelations = ClaudeCodeApiKey & ClaudeCodeApiKeyRelations;
