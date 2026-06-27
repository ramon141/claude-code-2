import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors, Response, RestBindings, del, get, getModelSchemaRef, param, patch, post, requestBody, response} from '@loopback/rest';
import {Prompt, PromptContextFile, PromptStatus} from '../models';
import {ChatSessionRepository, PromptContextFileRepository, PromptRepository} from '../repositories';
import {
  createPromptSchema,
  patchPromptSchema,
  promptResponseSchema,
  PromptResponse,
  EDITABLE_STATUSES,
  ACTIVE_STATUSES,
} from './prompts.schemas';
import {validateClaudeModel, validateSessionId, validateWorkingDirectory, validateFilePath} from './prompts.validators';
import {NOTIFICATION_SERVICE, NotificationService} from '../services/notification.service';
import {EVOLUTION_SERVICE, EvolutionService} from '../services/evolution.service';
import {QueueService, QUEUE_SERVICE_KEY} from '../services/queue.service';
import {readConfig} from '../config/app-config';

export type CreatePromptBody = Omit<
  Prompt,
  | 'id'
  | 'status'
  | 'retryCount'
  | 'output'
  | 'createdAt'
  | 'lastExecuted'
  | 'rateLimitedAt'
  | 'resetTime'
  | 'contextFiles'
  | 'isSessionStart'
> & {status?: 'draft' | 'queued'; contextFiles?: string[]; chatName?: string | null; sessionId?: string | null; waitForPromptId?: number | null; useWaitResponse?: boolean};

type PatchPromptBody = {
  status?: PromptStatus;
  content?: string;
  retryCount?: number;
  lastExecuted?: string;
  rateLimitedAt?: string;
  resetTime?: string;
  isSessionStart?: boolean;
  output?: string;
  sessionId?: string | null;
  waitForPromptId?: number | null;
  useWaitResponse?: boolean;
};


export class PromptsController {
  constructor(
    @repository(PromptRepository) private promptRepo: PromptRepository,
    @repository(PromptContextFileRepository)
    private contextFileRepo: PromptContextFileRepository,
    @repository(ChatSessionRepository) private chatSessionRepo: ChatSessionRepository,
    @inject(NOTIFICATION_SERVICE) private notificationService: NotificationService,
    @inject(EVOLUTION_SERVICE) private evolutionService: EvolutionService,
    @inject(QUEUE_SERVICE_KEY) private queueService: QueueService,
  ) {}

  @post('/prompts/execute-drafts')
  @response(200, {description: 'Rascunhos enfileirados', content: {'application/json': {schema: {type: 'object', properties: {queued: {type: 'number'}}}}}})
  async executeDrafts(): Promise<{queued: number}> {
    const drafts = await this.promptRepo.find({where: {status: 'draft' as PromptStatus}});
    await Promise.all(drafts.map(d => this.promptRepo.updateById(d.id, {status: 'queued' as PromptStatus})));
    for (const d of drafts) {
      this.notificationService.notify({event: 'prompt:updated', promptId: d.id, chatName: d.chatName ?? null, status: 'queued', output: ''});
    }
    void this.queueService.triggerIteration();
    return {queued: drafts.length};
  }

  @post('/prompts')
  @response(201, {
    description: 'Prompt criado',
    content: {'application/json': {schema: promptResponseSchema}},
  })
  async create(
    @requestBody({content: {'application/json': {schema: createPromptSchema}}})
    body: CreatePromptBody,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<PromptResponse> {
    res.status(201);
    const {contextFiles = [], chatName = null, claudeModel = null, waitForPromptId = null, useWaitResponse = false, status: bodyStatus, ...promptData} = body;
    const workingDirectory = promptData.workingDirectory ?? '';
    validateWorkingDirectory(workingDirectory);
    validateClaudeModel(claudeModel);
    validateSessionId(promptData.sessionId);
    contextFiles.forEach(f => validateFilePath(f, workingDirectory));
    if (chatName !== null) {
      const session = await this.chatSessionRepo.findOne({where: {chatName}});
      if (!session) throw new HttpErrors.UnprocessableEntity(`ChatSession "${chatName}" not found`);
    }
    if (waitForPromptId !== null) {
      const dep = await this.promptRepo.findById(waitForPromptId).catch(() => null);
      if (!dep) throw new HttpErrors.UnprocessableEntity(`Prompt ${waitForPromptId} não encontrado`);
      if (dep.chatName === chatName && chatName !== null) {
        throw new HttpErrors.UnprocessableEntity('waitForPromptId deve ser de outro chat');
      }
    }
    const isSessionStart = await this.inferIsSessionStart(chatName);
    const prompt = await this.promptRepo.create(
      new Prompt({
        ...promptData,
        chatName,
        claudeModel,
        waitForPromptId,
        useWaitResponse,
        status: (bodyStatus ?? 'queued') as PromptStatus,
        isSessionStart: bodyStatus === 'draft' ? false : isSessionStart,
        retryCount: 0,
        output: '',
        createdAt: new Date().toISOString(),
        lastExecuted: null,
        rateLimitedAt: null,
        resetTime: null,
      }),
    );
    await Promise.all(
      contextFiles.map(filePath =>
        this.contextFileRepo.create(new PromptContextFile({promptId: prompt.id, filePath})),
      ),
    );
    this.queueService.triggerIteration();
    return this.toResponse(prompt, contextFiles);
  }

  @get('/prompts')
  @response(200, {
    description: 'Lista de prompts',
    content: {
      'application/json': {
        schema: {type: 'array', items: getModelSchemaRef(Prompt)},
      },
    },
  })
  async find(
    @param.query.string('status') status?: string,
    @param.query.string('sessionId') sessionId?: string,
    @param.query.number('limit') limit = 50,
    @param.query.number('offset') offset = 0,
    @param.query.string('orderBy') orderBy?: string,
  ): Promise<PromptResponse[]> {
    const where: Record<string, string | number | {inq: string[]}> = {};
    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      where.status = statuses.length === 1 ? statuses[0] : {inq: statuses};
    }
    if (sessionId) where.sessionId = sessionId;

    const order = orderBy === 'priority' ? ['priority ASC'] : ['createdAt ASC'];
    const prompts = await this.promptRepo.find({
      where, order, limit, skip: offset, include: ['contextFiles'],
    });
    return prompts.map(prompt => this.toResponse(prompt, prompt.contextFiles));
  }

  @get('/prompts/next')
  @response(200, {
    description: 'Próximo prompt da fila',
    content: {'application/json': {schema: promptResponseSchema}},
  })
  async next(): Promise<PromptResponse> {
    const prompt = await this.promptRepo.findNextQueued();
    if (!prompt) throw new HttpErrors.NotFound('Queue is empty');

    const files = await this.contextFileRepo.find({where: {promptId: prompt.id}});
    return this.toResponse(prompt, files);
  }

  @get('/prompts/{id}')
  @response(200, {
    description: 'Prompt por id',
    content: {'application/json': {schema: promptResponseSchema}},
  })
  async findById(@param.path.number('id') id: number): Promise<PromptResponse> {
    const prompt = await this.promptRepo
      .findById(id, {include: ['contextFiles']})
      .catch(() => null);
    if (!prompt) throw new HttpErrors.NotFound(`Prompt ${id} not found`);
    return this.toResponse(prompt, prompt.contextFiles);
  }

  @patch('/prompts/{id}')
  @response(200, {
    description: 'Prompt atualizado',
    content: {'application/json': {schema: promptResponseSchema}},
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({content: {'application/json': {schema: patchPromptSchema}}})
    body: PatchPromptBody,
  ): Promise<PromptResponse> {
    const prompt = await this.promptRepo
      .findById(id, {include: ['contextFiles']})
      .catch(() => null);
    if (!prompt) throw new HttpErrors.NotFound(`Prompt ${id} not found`);
    if (body.content !== undefined && !EDITABLE_STATUSES.includes(prompt.status)) {
      throw new HttpErrors.UnprocessableEntity(
        `Prompt com status "${prompt.status}" não pode ser editado`,
      );
    }
    const update: Partial<Prompt> = {};
    if (body.content !== undefined) update.content = body.content;
    if (body.status !== undefined) update.status = body.status;
    if (body.retryCount !== undefined) update.retryCount = body.retryCount;
    if (body.lastExecuted !== undefined) update.lastExecuted = body.lastExecuted;
    if (body.rateLimitedAt !== undefined) update.rateLimitedAt = body.rateLimitedAt;
    if (body.resetTime !== undefined) update.resetTime = body.resetTime;
    if (body.isSessionStart !== undefined) update.isSessionStart = body.isSessionStart;
    if (body.sessionId !== undefined) update.sessionId = body.sessionId;
    if (body.output !== undefined) update.output = body.output;
    if (body.waitForPromptId !== undefined) update.waitForPromptId = body.waitForPromptId;
    if (body.useWaitResponse !== undefined) update.useWaitResponse = body.useWaitResponse;
    await this.promptRepo.updateById(id, update);
    const updated = await this.promptRepo.findById(id, {include: ['contextFiles']});

    this.notificationService.notify({
      event: 'prompt:updated',
      promptId: id,
      chatName: updated.chatName ?? null,
      status: updated.status,
      output: updated.output ?? '',
    });

    const terminalStatuses: PromptStatus[] = ['completed', 'failed', 'cancelled', 'rate_limited'];
    if (updated.whatsappPhone && terminalStatuses.includes(updated.status) && updated.output) {
      this.evolutionService.sendText(updated.whatsappPhone, updated.output).catch(() => {});
    }

    const notifyStatuses: PromptStatus[] = ['completed', 'failed'];
    if (notifyStatuses.includes(updated.status)) {
      this.sendCompletionNotifications(updated);
    }

    return this.toResponse(updated, updated.contextFiles);
  }

  @del('/prompts/{id}')
  @response(204, {description: 'Prompt deletado'})
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    const prompt = await this.promptRepo.findById(id).catch(() => null);
    if (!prompt) throw new HttpErrors.NotFound(`Prompt ${id} not found`);
    if (ACTIVE_STATUSES.includes(prompt.status)) {
      throw new HttpErrors.UnprocessableEntity(
        `Prompt com status "${prompt.status}" não pode ser deletado`,
      );
    }
    await this.contextFileRepo.deleteAll({promptId: id});
    await this.promptRepo.deleteById(id);
  }

  private sendCompletionNotifications(prompt: Prompt): void {
    const cfg = readConfig();
    if (!cfg.notificationsEnabled || cfg.notificationPhones.length === 0) return;
    const chat = prompt.chatName ?? 'sem chat';
    const preview = prompt.content.length > 200 ? `${prompt.content.substring(0, 200)}…` : prompt.content;
    const message = `O Chat *${chat}* finalizou o prompt:\n\n${preview}`;
    for (const phone of cfg.notificationPhones) {
      this.evolutionService.sendText(phone, message).catch((err: Error) => {
        console.error(`[evolution] falha ao notificar ${phone}: ${err.message}`);
      });
    }
  }

  private async inferIsSessionStart(chatName: string | null): Promise<boolean> {
    if (!chatName) return true;
    const existing = await this.promptRepo.findOne({where: {chatName}});
    return existing === null;
  }

  private toResponse(
    prompt: Prompt,
    files: PromptContextFile[] | string[] = [],
  ): PromptResponse {
    const contextFiles = files.length === 0 || typeof files[0] === 'string'
      ? (files as string[])
      : (files as PromptContextFile[]).map(contextFile => contextFile.filePath);

    return {
      id: prompt.id,
      content: prompt.content,
      status: prompt.status,
      priority: prompt.priority,
      workingDirectory: prompt.workingDirectory,
      contextFiles,
      maxRetries: prompt.maxRetries,
      retryCount: prompt.retryCount,
      estimatedTokens: prompt.estimatedTokens,
      sessionId: prompt.sessionId,
      chatName: prompt.chatName ?? null,
      isSessionStart: prompt.isSessionStart,
      output: prompt.output,
      whatsappPhone: prompt.whatsappPhone ?? null,
      claudeModel: prompt.claudeModel ?? null,
      waitForPromptId: prompt.waitForPromptId ?? null,
      useWaitResponse: prompt.useWaitResponse ?? false,
      createdAt: prompt.createdAt,
      lastExecuted: prompt.lastExecuted,
      rateLimitedAt: prompt.rateLimitedAt,
      resetTime: prompt.resetTime,
    };
  }
}
