import {Entity, model, property} from '@loopback/repository';

export type QueueStateIncrementField =
  | 'totalProcessed'
  | 'failedCount'
  | 'rateLimitedCount';

@model({
  settings: {
    sqlite3: {table: 'queue_state'},
  },
})
export class QueueState extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    sqlite3: {columnName: 'id'},
  })
  id: number;

  @property({
    type: 'number',
    default: 0,
    sqlite3: {columnName: 'total_processed'},
  })
  totalProcessed: number;

  @property({
    type: 'number',
    default: 0,
    sqlite3: {columnName: 'failed_count'},
  })
  failedCount: number;

  @property({
    type: 'number',
    default: 0,
    sqlite3: {columnName: 'rate_limited_count'},
  })
  rateLimitedCount: number;

  @property({
    type: 'date',
    required: false,
    sqlite3: {columnName: 'last_processed'},
  })
  lastProcessed: string | null;

  constructor(data?: Partial<QueueState>) {
    super(data);
  }
}

export interface QueueStateRelations {}
export type QueueStateWithRelations = QueueState & QueueStateRelations;
