import {Entity, model, property} from '@loopback/repository';

export type QueueStateIncrementField =
  | 'totalProcessed'
  | 'failedCount'
  | 'rateLimitedCount';

@model({
  settings: {
    postgresql: {schema: 'public', table: 'queue_state'},
  },
})
export class QueueState extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    postgresql: {columnName: 'id', dataType: 'integer'},
  })
  id: number;

  @property({
    type: 'number',
    default: 0,
    postgresql: {columnName: 'total_processed', dataType: 'integer'},
  })
  totalProcessed: number;

  @property({
    type: 'number',
    default: 0,
    postgresql: {columnName: 'failed_count', dataType: 'integer'},
  })
  failedCount: number;

  @property({
    type: 'number',
    default: 0,
    postgresql: {columnName: 'rate_limited_count', dataType: 'integer'},
  })
  rateLimitedCount: number;

  @property({
    type: 'date',
    required: false,
    postgresql: {
      columnName: 'last_processed',
      dataType: 'timestamp with time zone',
    },
  })
  lastProcessed: string | null;

  constructor(data?: Partial<QueueState>) {
    super(data);
  }
}

export interface QueueStateRelations {}
export type QueueStateWithRelations = QueueState & QueueStateRelations;
