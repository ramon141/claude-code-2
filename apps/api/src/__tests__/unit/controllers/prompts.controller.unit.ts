import {expect, sinon} from '@loopback/testlab';
import {Response} from '@loopback/rest';
import {PromptsController, CreatePromptBody} from '../../../controllers/prompts.controller';
import {PromptRepository, PromptContextFileRepository, ChatSessionRepository} from '../../../repositories';
import {NotificationService} from '../../../services/notification.service';
import {EvolutionService} from '../../../services/evolution.service';
import {Prompt, ChatSession} from '../../../models';

const mockRes = {status: sinon.stub().returnsThis()} as unknown as Response;

describe('PromptsController (unit)', () => {
  let controller: PromptsController;
  let promptRepo: sinon.SinonStubbedInstance<PromptRepository>;
  let contextFileRepo: sinon.SinonStubbedInstance<PromptContextFileRepository>;
  let chatSessionRepo: sinon.SinonStubbedInstance<ChatSessionRepository>;
  let notificationService: sinon.SinonStubbedInstance<NotificationService>;
  let evolutionService: sinon.SinonStubbedInstance<EvolutionService>;

  const baseBody = (overrides: Partial<CreatePromptBody> = {}): CreatePromptBody =>
    ({
      content: 'Do something useful',
      workingDirectory: '/dir',
      priority: 0,
      maxRetries: 3,
      estimatedTokens: null,
      sessionId: null,
      chatName: null,
      ...overrides,
    } as Partial<CreatePromptBody>) as CreatePromptBody;

  const mockPrompt = (overrides: Partial<Prompt> = {}): Prompt =>
    new Prompt({
      id: 100,
      content: 'Do something useful',
      status: 'queued',
      priority: 0,
      workingDirectory: '/home/user/project',
      maxRetries: 3,
      retryCount: 0,
      estimatedTokens: null,
      sessionId: null,
      chatName: null,
      isSessionStart: true,
      output: '',
      createdAt: '2024-01-01T00:00:00.000Z',
      lastExecuted: null,
      rateLimitedAt: null,
      resetTime: null,
      contextFiles: [],
      ...overrides,
    });

  beforeEach(() => {
    promptRepo = sinon.createStubInstance(PromptRepository);
    contextFileRepo = sinon.createStubInstance(PromptContextFileRepository);
    chatSessionRepo = sinon.createStubInstance(ChatSessionRepository);
    notificationService = sinon.createStubInstance(NotificationService);
    evolutionService = sinon.createStubInstance(EvolutionService);
    controller = new PromptsController(
      promptRepo as unknown as PromptRepository,
      contextFileRepo as unknown as PromptContextFileRepository,
      chatSessionRepo as unknown as ChatSessionRepository,
      notificationService as unknown as NotificationService,
      evolutionService as unknown as EvolutionService,
      {triggerIteration: () => {}} as unknown as import('../../../services/queue.service').QueueService,
    );
  });

  describe('create', () => {
    it('lança 422 se chatName não existe', async () => {
      chatSessionRepo.findOne.resolves(null);

      await expect(
        controller.create(baseBody({chatName: 'non-existent'}), mockRes),
      ).to.be.rejectedWith(/ChatSession.*not found/);
    });

    it('cria prompt sem chatName com isSessionStart=true', async () => {
      promptRepo.create.resolves(mockPrompt());
      promptRepo.findOne.resolves(null);
      contextFileRepo.create.resolves();

      const result = await controller.create(baseBody(), mockRes);

      expect(result).to.containEql({id: 100, status: 'queued'});
    });

    it('cria prompt com chatName existente', async () => {
      chatSessionRepo.findOne.resolves(new ChatSession({id: 1, chatName: 'my-chat'}));
      promptRepo.findOne.resolves(null);
      promptRepo.create.resolves(mockPrompt({chatName: 'my-chat', isSessionStart: true}));
      contextFileRepo.create.resolves();

      const result = await controller.create(baseBody({chatName: 'my-chat'}), mockRes);

      expect(result).to.containEql({chatName: 'my-chat'});
    });
  });

  describe('next', () => {
    it('lança 404 quando fila está vazia', async () => {
      promptRepo.findNextQueued.resolves(null);

      await expect(controller.next()).to.be.rejectedWith(/Queue is empty/);
    });

    it('retorna próximo prompt da fila', async () => {
      promptRepo.findNextQueued.resolves(mockPrompt());
      contextFileRepo.find.resolves([]);

      const result = await controller.next();

      expect(result).to.containEql({id: 100, status: 'queued'});
    });
  });

  describe('findById', () => {
    it('lança 404 se prompt não encontrado', async () => {
      promptRepo.findById.rejects(new Error('Not found'));

      await expect(controller.findById(999)).to.be.rejectedWith(/not found/);
    });

    it('retorna prompt', async () => {
      promptRepo.findById.resolves(mockPrompt());

      const result = await controller.findById(100);

      expect(result).to.containEql({id: 100});
    });
  });

  describe('updateById', () => {
    it('lança 404 se prompt não encontrado ao atualizar', async () => {
      promptRepo.findById.rejects(new Error('Not found'));

      await expect(
        controller.updateById(999, {status: 'completed'}),
      ).to.be.rejectedWith(/not found/);
    });

    it('atualiza prompt e notifica via WebSocket', async () => {
      const updated = mockPrompt({status: 'completed', output: 'done'});
      promptRepo.findById.onFirstCall().resolves(mockPrompt());
      promptRepo.updateById.resolves();
      promptRepo.findById.onSecondCall().resolves(updated);

      await controller.updateById(100, {status: 'completed', output: 'done'});

      sinon.assert.calledOnce(notificationService.notify);
      sinon.assert.calledWith(
        notificationService.notify,
        sinon.match({event: 'prompt:updated', promptId: 100}),
      );
    });
  });

  describe('deleteById', () => {
    it('lança 404 se prompt não existe ao deletar', async () => {
      promptRepo.findById.rejects(new Error('Not found'));

      await expect(controller.deleteById(999)).to.be.rejectedWith(/not found/);
    });

    it('cancela prompt', async () => {
      promptRepo.findById.resolves(mockPrompt());
      promptRepo.updateById.resolves();

      await controller.deleteById(100);

      sinon.assert.calledWith(promptRepo.updateById, 100, {status: 'cancelled'});
    });
  });
});
