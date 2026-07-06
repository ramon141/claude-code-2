import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    sqlite3: {table: 'chat_sessions'},
  },
})
export class ChatSession extends Entity {
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
    sqlite3: {columnName: 'chat_name'},
  })
  chatName: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'session_id'},
  })
  sessionId: string | null;

  @property({
    type: 'number',
    required: true,
    sqlite3: {columnName: 'project_id'},
  })
  projectId: number;

  @property({
    type: 'number',
    default: 0,
    sqlite3: {columnName: 'total_prompts'},
  })
  totalPrompts: number;

  @property({
    type: 'date',
    required: false,
    sqlite3: {columnName: 'last_used'},
  })
  lastUsed: string | null;

  @property({
    type: 'date',
    defaultFn: 'now',
    sqlite3: {columnName: 'created_at'},
  })
  createdAt: string;

  constructor(data?: Partial<ChatSession>) {
    super(data);
  }
}

export interface ChatSessionRelations {}
export type ChatSessionWithRelations = ChatSession & ChatSessionRelations;
