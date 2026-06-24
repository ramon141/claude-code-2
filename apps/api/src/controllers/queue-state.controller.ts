import {repository} from '@loopback/repository';
import {HttpErrors, get, getModelSchemaRef, patch, post, requestBody, response} from '@loopback/rest';
import {QueueState, QueueStateIncrementField} from '../models';
import {QueueStateRepository} from '../repositories';

const VALID_INCREMENT_FIELDS: QueueStateIncrementField[] = [
  'totalProcessed',
  'failedCount',
  'rateLimitedCount',
];

export class QueueStateController {
  constructor(
    @repository(QueueStateRepository)
    private queueStateRepo: QueueStateRepository,
  ) {}

  private async getOrCreate(): Promise<QueueState> {
    const existing = await this.queueStateRepo.findOne({});
    if (existing) return existing;

    return this.queueStateRepo.create(
      new QueueState({
        totalProcessed: 0,
        failedCount: 0,
        rateLimitedCount: 0,
        lastProcessed: null,
      }),
    );
  }

  @get('/queue/state')
  @response(200, {
    description: 'Estado atual da fila',
    content: {'application/json': {schema: getModelSchemaRef(QueueState)}},
  })
  async getState(): Promise<QueueState> {
    return this.getOrCreate();
  }

  @post('/queue/state/increment')
  @response(200, {
    description: 'Campo incrementado',
    content: {'application/json': {schema: getModelSchemaRef(QueueState)}},
  })
  async increment(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['field'],
            additionalProperties: false,
            properties: {
              field: {
                type: 'string',
                enum: VALID_INCREMENT_FIELDS,
              },
            },
          },
        },
      },
    })
    body: {field: QueueStateIncrementField},
  ): Promise<QueueState> {
    const state = await this.getOrCreate();
    const update: Partial<QueueState> = {};
    update[body.field] = (state[body.field] as number) + 1;

    await this.queueStateRepo.updateById(state.id, update);
    return this.queueStateRepo.findById(state.id);
  }

  @patch('/queue/state/last-processed')
  @response(200, {
    description: 'lastProcessed atualizado para agora',
    content: {'application/json': {schema: getModelSchemaRef(QueueState)}},
  })
  async updateLastProcessed(): Promise<QueueState> {
    const state = await this.getOrCreate();
    await this.queueStateRepo.updateById(state.id, {
      lastProcessed: new Date().toISOString(),
    });
    return this.queueStateRepo.findById(state.id);
  }
}
