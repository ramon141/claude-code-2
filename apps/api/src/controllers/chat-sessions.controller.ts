import {repository} from '@loopback/repository';
import {inject} from '@loopback/core';
import {HttpErrors, Response, RestBindings} from '@loopback/rest';
import {
  del,
  get,
  param,
  patch,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {ChatSession, Prompt, Project} from '../models';
import {ChatSessionRepository, ProjectRepository, PromptRepository} from '../repositories';

type ChatSessionResponse = {
  id: number;
  chatName: string;
  sessionId: string | null;
  projectId: number;
  workingDirectory: string;
  totalPrompts: number;
  lastUsed: string | null;
  createdAt: string;
};

type ChatPromptSummary = {
  id: number;
  content: string;
  status: string;
  output: string;
  createdAt: string;
  lastExecuted: string | null;
};

const chatSessionResponseSchema = {
  type: 'object',
  properties: {
    id: {type: 'number'},
    chatName: {type: 'string'},
    sessionId: {type: 'string', nullable: true},
    projectId: {type: 'number'},
    workingDirectory: {type: 'string'},
    totalPrompts: {type: 'number'},
    lastUsed: {type: 'string', format: 'date-time', nullable: true},
    createdAt: {type: 'string', format: 'date-time'},
  },
};

export class ChatSessionsController {
  constructor(
    @repository(ChatSessionRepository)
    private chatSessionRepo: ChatSessionRepository,
    @repository(PromptRepository) private promptRepo: PromptRepository,
    @repository(ProjectRepository) private projectRepo: ProjectRepository,
  ) {}

  @post('/chat-sessions')
  @response(201, {
    description: 'ChatSession criada',
    content: {'application/json': {schema: chatSessionResponseSchema}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['chatName', 'projectId'],
            additionalProperties: false,
            properties: {
              chatName: {type: 'string'},
              projectId: {type: 'number'},
            },
          },
        },
      },
    })
    body: {chatName: string; projectId: number},
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<ChatSessionResponse> {
    res.status(201);
    const project = await this.requireProject(body.projectId);
    const existing = await this.chatSessionRepo.findOne({where: {chatName: body.chatName}});
    if (existing) {
      throw new HttpErrors.UnprocessableEntity(`chatName "${body.chatName}" already exists`);
    }
    const session = await this.chatSessionRepo.create(
      new ChatSession({
        chatName: body.chatName,
        projectId: body.projectId,
        sessionId: null,
        totalPrompts: 0,
        lastUsed: null,
        createdAt: new Date().toISOString(),
      }),
    );
    return this.toResponse(session, project);
  }

  @patch('/chat-sessions/{chatName}/session-id')
  @response(200, {
    description: 'sessionId atualizado',
    content: {'application/json': {schema: chatSessionResponseSchema}},
  })
  async updateSessionId(
    @param.path.string('chatName') chatName: string,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['sessionId'],
            additionalProperties: false,
            properties: {sessionId: {type: 'string'}},
          },
        },
      },
    })
    body: {sessionId: string},
  ): Promise<ChatSessionResponse> {
    const session = await this.requireSession(chatName);
    await this.chatSessionRepo.updateById(session.id, {sessionId: body.sessionId});
    const updated = await this.chatSessionRepo.findById(session.id);
    const project = await this.requireProject(updated.projectId);
    return this.toResponse(updated, project);
  }

  @get('/chat-sessions')
  @response(200, {
    description: 'Lista de chat sessions',
    content: {
      'application/json': {schema: {type: 'array', items: chatSessionResponseSchema}},
    },
  })
  async find(): Promise<ChatSessionResponse[]> {
    const sessions = await this.chatSessionRepo.find({order: ['createdAt DESC']});
    const projectIds = [...new Set(sessions.map(s => s.projectId))];
    const projects = await this.projectRepo.find({where: {id: {inq: projectIds}}});
    const projectMap = new Map(projects.map(p => [p.id, p]));
    return sessions.map(s => this.toResponse(s, projectMap.get(s.projectId)!));
  }

  @get('/chat-sessions/{chatName}')
  @response(200, {
    description: 'ChatSession por chatName',
    content: {'application/json': {schema: chatSessionResponseSchema}},
  })
  async findByChatName(
    @param.path.string('chatName') chatName: string,
  ): Promise<ChatSessionResponse> {
    const session = await this.requireSession(chatName);
    const project = await this.requireProject(session.projectId);
    return this.toResponse(session, project);
  }

  @get('/chat-sessions/{chatName}/prompts')
  @response(200, {
    description: 'Histórico de prompts da sessão',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {type: 'number'},
              content: {type: 'string'},
              status: {type: 'string'},
              output: {type: 'string'},
              createdAt: {type: 'string', format: 'date-time'},
              lastExecuted: {type: 'string', format: 'date-time', nullable: true},
            },
          },
        },
      },
    },
  })
  async getPrompts(
    @param.path.string('chatName') chatName: string,
  ): Promise<ChatPromptSummary[]> {
    const session = await this.requireSession(chatName);
    const prompts = await this.promptRepo.find({
      where: {chatName: session.chatName},
      order: ['createdAt ASC'],
    });
    return prompts.map((p: Prompt) => ({
      id: p.id,
      content: p.content,
      status: p.status,
      output: p.output,
      createdAt: p.createdAt,
      lastExecuted: p.lastExecuted,
    }));
  }

  @patch('/chat-sessions/{chatName}/last-used')
  @response(200, {
    description: 'Atualiza lastUsed e incrementa totalPrompts',
    content: {'application/json': {schema: chatSessionResponseSchema}},
  })
  async updateLastUsed(
    @param.path.string('chatName') chatName: string,
  ): Promise<ChatSessionResponse> {
    const session = await this.requireSession(chatName);
    await this.chatSessionRepo.updateById(session.id, {
      totalPrompts: (session.totalPrompts ?? 0) + 1,
      lastUsed: new Date().toISOString(),
    });
    const updated = await this.chatSessionRepo.findById(session.id);
    const project = await this.requireProject(updated.projectId);
    return this.toResponse(updated, project);
  }

  @del('/chat-sessions/{chatName}')
  @response(204, {description: 'ChatSession deletada'})
  async deleteByChatName(
    @param.path.string('chatName') chatName: string,
  ): Promise<void> {
    const session = await this.requireSession(chatName);
    await this.chatSessionRepo.deleteById(session.id);
  }

  private async requireSession(chatName: string): Promise<ChatSession> {
    const session = await this.chatSessionRepo.findOne({where: {chatName}});
    if (!session) throw new HttpErrors.NotFound(`ChatSession "${chatName}" not found`);
    return session;
  }

  private async requireProject(projectId: number): Promise<Project> {
    const project = await this.projectRepo.findById(projectId).catch(() => null);
    if (!project) throw new HttpErrors.UnprocessableEntity(`Project ${projectId} not found`);
    return project;
  }

  private toResponse(session: ChatSession, project: Project): ChatSessionResponse {
    return {
      id: session.id,
      chatName: session.chatName,
      sessionId: session.sessionId,
      projectId: session.projectId,
      workingDirectory: project.workDir,
      totalPrompts: session.totalPrompts,
      lastUsed: session.lastUsed,
      createdAt: session.createdAt,
    };
  }
}
