import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import {repository} from '@loopback/repository';
import {inject} from '@loopback/core';
import {HttpErrors, Response, RestBindings, del, get, param, patch, post, requestBody, response} from '@loopback/rest';
import {ChatSession, Project, PromptWithRelations, PromptContextFile} from '../models';
import {ChatSessionRepository, ProjectRepository, PromptContextFileRepository, PromptRepository} from '../repositories';
import {PostgresDataSource} from '../datasources';
import {
  ChatSessionResponse,
  ChatPromptSummary,
  ChatSearchResult,
  chatSessionResponseSchema,
  chatPromptSummarySchema,
  chatSearchResultSchema,
} from './chat-sessions.schemas';

const MIN_SEARCH_LENGTH = 2;

export class ChatSessionsController {
  constructor(
    @repository(ChatSessionRepository)
    private chatSessionRepo: ChatSessionRepository,
    @repository(PromptRepository) private promptRepo: PromptRepository,
    @repository(ProjectRepository) private projectRepo: ProjectRepository,
    @repository(PromptContextFileRepository)
    private contextFileRepo: PromptContextFileRepository,
    @inject('datasources.postgres') private db: PostgresDataSource,
  ) {}

  @post('/chat-sessions')
  @response(201, {description: 'ChatSession criada', content: {'application/json': {schema: chatSessionResponseSchema}}})
  async create(
    @requestBody({content: {'application/json': {schema: {type: 'object', required: ['chatName', 'projectId'], additionalProperties: false, properties: {chatName: {type: 'string'}, projectId: {type: 'number'}, sessionId: {type: 'string', nullable: true}}}}}})
    body: {chatName: string; projectId: number; sessionId?: string | null},
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<ChatSessionResponse> {
    res.status(201);
    const project = await this.requireProject(body.projectId);
    const existing = await this.chatSessionRepo.findOne({where: {chatName: body.chatName}});
    if (existing) throw new HttpErrors.UnprocessableEntity(`chatName "${body.chatName}" already exists`);
    const session = await this.chatSessionRepo.create(
      new ChatSession({chatName: body.chatName, projectId: body.projectId, sessionId: body.sessionId ?? null, totalPrompts: 0, lastUsed: null, createdAt: new Date().toISOString()}),
    );
    return this.toResponse(session, project);
  }

  @get('/chat-sessions/verify-session')
  @response(200, {description: 'Verifica se session_id existe no projeto', content: {'application/json': {schema: {type: 'object', properties: {exists: {type: 'boolean'}}}}}})
  async verifySession(
    @param.query.string('sessionId') sessionId: string,
    @param.query.string('workDir') workDir: string,
  ): Promise<{exists: boolean}> {
    if (!sessionId || !workDir) throw new HttpErrors.BadRequest('sessionId e workDir são obrigatórios');
    const sanitized = workDir.replace(/\//g, '-');
    const filePath = path.join(os.homedir(), '.claude', 'projects', sanitized, `${sessionId}.jsonl`);
    return {exists: fs.existsSync(filePath)};
  }

  @get('/chat-sessions/search')
  @response(200, {description: 'Busca global em chats e prompts', content: {'application/json': {schema: {type: 'array', items: chatSearchResultSchema}}}})
  async search(@param.query.string('q') q: string): Promise<ChatSearchResult[]> {
    if (!q || q.trim().length < MIN_SEARCH_LENGTH) return [];
    const query = q.trim();
    const pattern = `%${query}%`;

    type AggRow = {chat_name: string; matches_content: boolean; matches_output: boolean};
    type SessionRow = {chat_name: string};
    type SnippetRow = {chat_name: string; text: string};

    const [aggRows, sessionRows] = await Promise.all([
      this.db.execute(
        `SELECT chat_name,
           bool_or(content ILIKE $1) AS matches_content,
           bool_or(execution_log ILIKE $1) AS matches_output
         FROM prompts
         WHERE chat_name IS NOT NULL AND (content ILIKE $1 OR execution_log ILIKE $1)
         GROUP BY chat_name`,
        [pattern],
      ),
      this.db.execute(
        `SELECT chat_name FROM chat_sessions WHERE chat_name ILIKE $1`,
        [pattern],
      ),
    ]);

    const typedAgg = aggRows as AggRow[];
    const typedSessions = sessionRows as SessionRow[];

    console.log('[search] aggRows:', JSON.stringify(typedAgg));

    const nameMatchSet = new Set(typedSessions.map(r => r.chat_name));
    const aggMap = new Map<string, AggRow>(typedAgg.map(r => [r.chat_name, r]));

    const allNames = [...new Set([...nameMatchSet, ...aggMap.keys()])];
    if (allNames.length === 0) return [];

    const snippetRows = await this.db.execute(
      `SELECT DISTINCT ON (chat_name) chat_name,
         LEFT(CASE WHEN content ILIKE $1 THEN content ELSE execution_log END, 500) AS text
       FROM prompts
       WHERE chat_name IS NOT NULL AND (content ILIKE $1 OR execution_log ILIKE $1)
       ORDER BY chat_name, id ASC`,
      [pattern],
    );

    const typedSnippets = snippetRows as SnippetRow[];
    console.log('[search] snippetRows:', JSON.stringify(typedSnippets));

    const snippetMap = new Map<string, string>(
      typedSnippets.map(r => [r.chat_name, this.extractSnippet(r.text ?? '', query)]),
    );

    const sessions = await this.chatSessionRepo.find({where: {chatName: {inq: allNames}}, order: ['lastUsed DESC']});
    const projectIds = [...new Set(sessions.map(s => s.projectId))];
    const projects = await this.projectRepo.find({where: {id: {inq: projectIds}}});
    const projectMap = new Map(projects.map(p => [p.id, p]));

    const result = sessions.map(session => {
      const matchedIn: ('chatName' | 'content' | 'output')[] = [];
      if (nameMatchSet.has(session.chatName)) matchedIn.push('chatName');
      const agg = aggMap.get(session.chatName);
      if (agg?.matches_content) matchedIn.push('content');
      if (agg?.matches_output) matchedIn.push('output');
      const project = projectMap.get(session.projectId);
      const snippet = snippetMap.get(session.chatName) ?? '';
      return {chatName: session.chatName, sessionId: session.sessionId, projectId: session.projectId, projectName: project?.name ?? '', workingDirectory: project?.workDir ?? '', totalPrompts: session.totalPrompts, lastUsed: session.lastUsed, createdAt: session.createdAt, matchedIn, snippet};
    });

    console.log('[search] result:', JSON.stringify(result));
    return result;
  }

  private extractSnippet(text: string, query: string): string {
    const CONTEXT_LEN = 70
    const pos = text.toLowerCase().indexOf(query.toLowerCase())
    if (pos === -1) return text.slice(0, CONTEXT_LEN * 2)
    const start = Math.max(0, pos - CONTEXT_LEN)
    const end = Math.min(text.length, pos + query.length + CONTEXT_LEN)
    return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '')
  }

  @patch('/chat-sessions/{chatName}/session-id')
  @response(200, {description: 'sessionId atualizado', content: {'application/json': {schema: chatSessionResponseSchema}}})
  async updateSessionId(
    @param.path.string('chatName') chatName: string,
    @requestBody({content: {'application/json': {schema: {type: 'object', required: ['sessionId'], additionalProperties: false, properties: {sessionId: {type: 'string'}}}}}})
    body: {sessionId: string},
  ): Promise<ChatSessionResponse> {
    const session = await this.requireSession(chatName);
    await this.chatSessionRepo.updateById(session.id, {sessionId: body.sessionId});
    const updated = await this.chatSessionRepo.findById(session.id);
    const project = await this.requireProject(updated.projectId);
    return this.toResponse(updated, project);
  }

  @get('/chat-sessions')
  @response(200, {description: 'Lista de chat sessions', content: {'application/json': {schema: {type: 'array', items: chatSessionResponseSchema}}}})
  async find(): Promise<ChatSessionResponse[]> {
    const sessions = await this.chatSessionRepo.find({order: ['createdAt DESC']});
    const projectIds = [...new Set(sessions.map(s => s.projectId))];
    const [projects, pendingRows] = await Promise.all([
      this.projectRepo.find({where: {id: {inq: projectIds}}}),
      this.db.execute(
        `SELECT DISTINCT chat_name FROM prompts WHERE status IN ('queued', 'executing') AND chat_name IS NOT NULL`,
        [],
      ) as Promise<{chat_name: string}[]>,
    ]);
    const projectMap = new Map(projects.map(p => [p.id, p]));
    const pendingSet = new Set((pendingRows).map((r: {chat_name: string}) => r.chat_name));
    return sessions.map(s => this.toResponse(s, projectMap.get(s.projectId)!, pendingSet.has(s.chatName)));
  }

  @get('/chat-sessions/{chatName}')
  @response(200, {description: 'ChatSession por chatName', content: {'application/json': {schema: chatSessionResponseSchema}}})
  async findByChatName(@param.path.string('chatName') chatName: string): Promise<ChatSessionResponse> {
    const session = await this.requireSession(chatName);
    const project = await this.requireProject(session.projectId);
    return this.toResponse(session, project);
  }

  @get('/chat-sessions/{chatName}/prompts')
  @response(200, {description: 'Histórico de prompts da sessão', content: {'application/json': {schema: {type: 'array', items: chatPromptSummarySchema}}}})
  async getPrompts(@param.path.string('chatName') chatName: string): Promise<ChatPromptSummary[]> {
    const session = await this.requireSession(chatName);
    const prompts = await this.promptRepo.find({where: {chatName: session.chatName}, order: ['createdAt ASC'], include: ['contextFiles']});
    return prompts.map((p: PromptWithRelations) => ({
      id: p.id, content: p.content, status: p.status, output: p.output, createdAt: p.createdAt,
      lastExecuted: p.lastExecuted, contextFiles: (p.contextFiles ?? []).map((f: PromptContextFile) => f.filePath),
      waitForPromptId: p.waitForPromptId ?? null, useWaitResponse: p.useWaitResponse ?? false,
    }));
  }

  @patch('/chat-sessions/{chatName}/last-used')
  @response(200, {description: 'Atualiza lastUsed e incrementa totalPrompts', content: {'application/json': {schema: chatSessionResponseSchema}}})
  async updateLastUsed(@param.path.string('chatName') chatName: string): Promise<ChatSessionResponse> {
    const session = await this.requireSession(chatName);
    await this.chatSessionRepo.updateById(session.id, {totalPrompts: (session.totalPrompts ?? 0) + 1, lastUsed: new Date().toISOString()});
    const updated = await this.chatSessionRepo.findById(session.id);
    const project = await this.requireProject(updated.projectId);
    return this.toResponse(updated, project);
  }

  @del('/chat-sessions/{chatName}')
  @response(204, {description: 'ChatSession e prompts deletados'})
  async deleteByChatName(@param.path.string('chatName') chatName: string): Promise<void> {
    const session = await this.requireSession(chatName);
    const prompts = await this.promptRepo.find({where: {chatName}});
    for (const prompt of prompts) await this.contextFileRepo.deleteAll({promptId: prompt.id});
    const promptIds = prompts.map(p => p.id);
    if (promptIds.length > 0) await this.promptRepo.deleteAll({id: {inq: promptIds}});
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

  private toResponse(session: ChatSession, project: Project, hasPendingPrompts = false): ChatSessionResponse {
    return {id: session.id, chatName: session.chatName, sessionId: session.sessionId, projectId: session.projectId, projectName: project.name, workingDirectory: project.workDir, totalPrompts: session.totalPrompts, lastUsed: session.lastUsed, createdAt: session.createdAt, hasPendingPrompts};
  }
}
