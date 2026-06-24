import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    postgresql: {schema: 'public', table: 'chat_sessions'},
  },
})
export class ChatSession extends Entity {
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
    postgresql: {columnName: 'chat_name', dataType: 'varchar'},
  })
  chatName: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    postgresql: {columnName: 'session_id', dataType: 'varchar'},
  })
  sessionId: string | null;

  @property({
    type: 'number',
    required: true,
    postgresql: {columnName: 'project_id', dataType: 'integer'},
  })
  projectId: number;

  @property({
    type: 'number',
    default: 0,
    postgresql: {columnName: 'total_prompts', dataType: 'integer'},
  })
  totalPrompts: number;

  @property({
    type: 'date',
    required: false,
    postgresql: {
      columnName: 'last_used',
      dataType: 'timestamp with time zone',
    },
  })
  lastUsed: string | null;

  @property({
    type: 'date',
    defaultFn: 'now',
    postgresql: {
      columnName: 'created_at',
      dataType: 'timestamp with time zone',
    },
  })
  createdAt: string;

  constructor(data?: Partial<ChatSession>) {
    super(data);
  }
}

export interface ChatSessionRelations {}
export type ChatSessionWithRelations = ChatSession & ChatSessionRelations;
