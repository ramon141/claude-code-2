import {expect, sinon} from '@loopback/testlab';
import {Response} from '@loopback/rest';
import {ChatSessionsController} from '../../../controllers/chat-sessions.controller';
import {ChatSessionRepository, ProjectRepository, PromptRepository} from '../../../repositories';
import {ChatSession, Project, Prompt} from '../../../models';

const mockRes = {status: sinon.stub().returnsThis()} as unknown as Response;

describe('ChatSessionsController (unit)', () => {
  let controller: ChatSessionsController;
  let chatSessionRepo: sinon.SinonStubbedInstance<ChatSessionRepository>;
  let promptRepo: sinon.SinonStubbedInstance<PromptRepository>;
  let projectRepo: sinon.SinonStubbedInstance<ProjectRepository>;

  const mockProject = (overrides: Partial<Project> = {}): Project =>
    new Project({
      id: 10,
      name: 'My Project',
      workDir: '/home/user/project',
      memory: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      ...overrides,
    });

  const mockSession = (overrides: Partial<ChatSession> = {}): ChatSession =>
    new ChatSession({
      id: 20,
      chatName: 'my-chat',
      projectId: 10,
      sessionId: null,
      totalPrompts: 0,
      lastUsed: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      ...overrides,
    });

  beforeEach(() => {
    chatSessionRepo = sinon.createStubInstance(ChatSessionRepository);
    promptRepo = sinon.createStubInstance(PromptRepository);
    projectRepo = sinon.createStubInstance(ProjectRepository);
    controller = new ChatSessionsController(
      chatSessionRepo as unknown as ChatSessionRepository,
      promptRepo as unknown as PromptRepository,
      projectRepo as unknown as ProjectRepository,
    );
  });

  describe('create', () => {
    it('lança erro se projeto não encontrado', async () => {
      projectRepo.findById.rejects(new Error('Not found'));

      await expect(
        controller.create({chatName: 'new-chat', projectId: 99}, mockRes),
      ).to.be.rejectedWith(/not found/);
    });

    it('lança 422 se chatName já existe', async () => {
      projectRepo.findById.resolves(mockProject());
      chatSessionRepo.findOne.resolves(mockSession());

      await expect(
        controller.create({chatName: 'my-chat', projectId: 10}, mockRes),
      ).to.be.rejectedWith(/already exists/);
    });

    it('cria sessão quando chatName é único', async () => {
      projectRepo.findById.resolves(mockProject());
      chatSessionRepo.findOne.resolves(null);
      chatSessionRepo.create.resolves(mockSession());

      const result = await controller.create({chatName: 'my-chat', projectId: 10}, mockRes);

      expect(result).to.containEql({chatName: 'my-chat', projectId: 10});
      expect(result).to.have.property('workingDirectory').equal('/home/user/project');
    });
  });

  describe('find', () => {
    it('retorna sessões com informações do projeto', async () => {
      chatSessionRepo.find.resolves([mockSession()]);
      projectRepo.find.resolves([mockProject()]);

      const result = await controller.find();

      expect(result).to.have.length(1);
      expect(result[0]).to.containEql({chatName: 'my-chat', workingDirectory: '/home/user/project'});
    });

    it('retorna lista vazia quando não há sessões', async () => {
      chatSessionRepo.find.resolves([]);
      projectRepo.find.resolves([]);

      const result = await controller.find();

      expect(result).to.be.empty();
    });
  });

  describe('findByChatName', () => {
    it('lança 404 se sessão não encontrada', async () => {
      chatSessionRepo.findOne.resolves(null);

      await expect(controller.findByChatName('non-existent')).to.be.rejectedWith(/not found/);
    });

    it('retorna sessão existente', async () => {
      chatSessionRepo.findOne.resolves(mockSession());
      projectRepo.findById.resolves(mockProject());

      const result = await controller.findByChatName('my-chat');

      expect(result).to.containEql({chatName: 'my-chat'});
    });
  });

  describe('deleteByChatName', () => {
    it('lança 404 se sessão não encontrada', async () => {
      chatSessionRepo.findOne.resolves(null);

      await expect(controller.deleteByChatName('non-existent')).to.be.rejectedWith(/not found/);
    });

    it('deleta sessão existente', async () => {
      chatSessionRepo.findOne.resolves(mockSession());
      chatSessionRepo.deleteById.resolves();

      await controller.deleteByChatName('my-chat');

      sinon.assert.calledWith(chatSessionRepo.deleteById, 20);
    });
  });

  describe('getPrompts', () => {
    it('retorna histórico de prompts da sessão', async () => {
      chatSessionRepo.findOne.resolves(mockSession());
      promptRepo.find.resolves([
        new Prompt({
          id: 1, content: 'test', status: 'completed', output: 'result',
          createdAt: '2024-01-01T00:00:00.000Z', lastExecuted: null,
          workingDirectory: '/dir', priority: 0, maxRetries: 3,
          retryCount: 0, estimatedTokens: null, sessionId: null,
          chatName: 'my-chat', isSessionStart: true, rateLimitedAt: null, resetTime: null,
        }),
      ]);

      const result = await controller.getPrompts('my-chat');

      expect(result).to.have.length(1);
      expect(result[0]).to.containEql({id: 1, content: 'test', status: 'completed'});
    });
  });
});
