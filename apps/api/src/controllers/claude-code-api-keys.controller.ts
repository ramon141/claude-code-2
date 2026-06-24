import {repository} from '@loopback/repository';
import {HttpErrors, Response, RestBindings, SchemaObject} from '@loopback/rest';
import {del, get, getModelSchemaRef, param, patch, post, requestBody, response} from '@loopback/rest';
import {inject} from '@loopback/core';
import {encryptValue} from '../authentication/auth.utils';
import {ClaudeCodeApiKey} from '../models';
import {ClaudeCodeApiKeyRepository} from '../repositories';

type CreateBody = {name: string; keyValue: string};
type PatchBody = {name?: string; isActive?: boolean};
type PatchLimitsBody = {sessionLimitPercentage: number; weeklyLimitPercentage: number};

const createSchema: SchemaObject = {
  type: 'object',
  required: ['name', 'keyValue'],
  additionalProperties: false,
  properties: {
    name: {type: 'string', minLength: 1},
    keyValue: {type: 'string', minLength: 1},
  },
};

const patchSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  properties: {
    name: {type: 'string', minLength: 1},
    isActive: {type: 'boolean'},
  },
};

const patchLimitsSchema: SchemaObject = {
  type: 'object',
  required: ['sessionLimitPercentage', 'weeklyLimitPercentage'],
  additionalProperties: false,
  properties: {
    sessionLimitPercentage: {type: 'number', minimum: 0, maximum: 100},
    weeklyLimitPercentage: {type: 'number', minimum: 0, maximum: 100},
  },
};

export class ClaudeCodeApiKeysController {
  constructor(
    @repository(ClaudeCodeApiKeyRepository)
    private claudeCodeApiKeyRepository: ClaudeCodeApiKeyRepository,
  ) {}

  @post('/claude-code-api-keys')
  @response(201, {
    description: 'Claude Code API key criada',
    content: {'application/json': {schema: getModelSchemaRef(ClaudeCodeApiKey)}},
  })
  async create(
    @requestBody({content: {'application/json': {schema: createSchema}}})
    body: CreateBody,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<ClaudeCodeApiKey> {
    res.status(201);
    return this.claudeCodeApiKeyRepository.create(
      new ClaudeCodeApiKey({
        name: body.name,
        keyValue: encryptValue(body.keyValue),
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      }),
    );
  }

  @get('/claude-code-api-keys')
  @response(200, {
    description: 'Lista de Claude Code API keys',
    content: {
      'application/json': {
        schema: {type: 'array', items: getModelSchemaRef(ClaudeCodeApiKey)},
      },
    },
  })
  async find(): Promise<ClaudeCodeApiKey[]> {
    return this.claudeCodeApiKeyRepository.find({order: ['createdAt DESC']});
  }

  @get('/claude-code-api-keys/{id}')
  @response(200, {
    description: 'Claude Code API key por id',
    content: {'application/json': {schema: getModelSchemaRef(ClaudeCodeApiKey)}},
  })
  async findById(@param.path.number('id') id: number): Promise<ClaudeCodeApiKey> {
    const record = await this.claudeCodeApiKeyRepository.findById(id).catch(() => null);
    if (!record) throw new HttpErrors.NotFound(`ClaudeCodeApiKey ${id} não encontrada`);
    return record;
  }

  @patch('/claude-code-api-keys/{id}')
  @response(200, {
    description: 'Claude Code API key atualizada',
    content: {'application/json': {schema: getModelSchemaRef(ClaudeCodeApiKey)}},
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({content: {'application/json': {schema: patchSchema}}})
    body: PatchBody,
  ): Promise<ClaudeCodeApiKey> {
    const record = await this.claudeCodeApiKeyRepository.findById(id).catch(() => null);
    if (!record) throw new HttpErrors.NotFound(`ClaudeCodeApiKey ${id} não encontrada`);
    const update: Partial<ClaudeCodeApiKey> = {updatedAt: new Date().toISOString()};
    if (body.name !== undefined) update.name = body.name;
    if (body.isActive !== undefined) update.isActive = body.isActive;
    await this.claudeCodeApiKeyRepository.updateById(id, update);
    return this.claudeCodeApiKeyRepository.findById(id);
  }

  @post('/claude-code-api-keys/{id}/activate')
  @response(204, {description: 'Claude Code API key ativada'})
  async activate(@param.path.number('id') id: number): Promise<void> {
    const record = await this.claudeCodeApiKeyRepository.findById(id).catch(() => null);
    if (!record) throw new HttpErrors.NotFound(`ClaudeCodeApiKey ${id} não encontrada`);

    const allKeys = await this.claudeCodeApiKeyRepository.find({where: {isActive: true}});
    await Promise.all(
      allKeys.filter(k => k.id !== id).map(k =>
        this.claudeCodeApiKeyRepository.updateById(k.id, {isActive: false}),
      ),
    );

    await this.claudeCodeApiKeyRepository.updateById(id, {
      isActive: true,
      updatedAt: new Date().toISOString(),
    });
  }

  @patch('/claude-code-api-keys/active/limits')
  @response(200, {
    description: 'Limites da Claude Code API key ativa atualizados',
    content: {'application/json': {schema: getModelSchemaRef(ClaudeCodeApiKey)}},
  })
  async updateActiveLimits(
    @requestBody({content: {'application/json': {schema: patchLimitsSchema}}})
    body: PatchLimitsBody,
  ): Promise<ClaudeCodeApiKey> {
    const activeKey = await this.claudeCodeApiKeyRepository.findOne({where: {isActive: true}});
    if (!activeKey) {
      throw new HttpErrors.UnprocessableEntity('Nenhuma Claude Code API key ativa configurada');
    }

    await this.claudeCodeApiKeyRepository.updateById(activeKey.id, {
      sessionLimitPercentage: body.sessionLimitPercentage,
      weeklyLimitPercentage: body.weeklyLimitPercentage,
      lastUpdatedLimits: new Date().toISOString(),
    });

    return this.claudeCodeApiKeyRepository.findById(activeKey.id);
  }

  @del('/claude-code-api-keys/{id}')
  @response(204, {description: 'Claude Code API key deletada'})
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    const record = await this.claudeCodeApiKeyRepository.findById(id).catch(() => null);
    if (!record) throw new HttpErrors.NotFound(`ClaudeCodeApiKey ${id} não encontrada`);
    await this.claudeCodeApiKeyRepository.deleteById(id);
  }
}
