import crypto from 'crypto';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors, Request, Response, RestBindings, post, requestBody, response} from '@loopback/rest';
import {ChatSession, Prompt, PromptStatus} from '../models';
import {ChatSessionRepository, PromptRepository, ProjectRepository} from '../repositories';
import {EVOLUTION_SERVICE, EvolutionService} from '../services/evolution.service';
import {RATE_LIMITER_BINDING, RateLimiterService} from '../services/rate-limiter.service';
import {NORMALIZED_PHONE_REGEX, normalizePhone} from '../services/phone';
import {readConfig} from '../config/app-config';

type EvolutionKey = {
  remoteJid: string;
  fromMe: boolean;
  id: string;
};

type EvolutionMessageContent = {
  conversation?: string;
  extendedTextMessage?: {text: string};
};

type EvolutionMessageData = {
  key?: EvolutionKey;
  message?: EvolutionMessageContent;
  messageType?: string;
};

type EvolutionWebhook = {
  event: string;
  instance?: string;
  data?: EvolutionMessageData;
};

type WhatsappMode =
  | {kind: 'none'}
  | {kind: 'selecting'}
  | {kind: 'active'; projectId: number};

const PHONE_STATE_TTL_MS = 24 * 60 * 60 * 1000;
const phoneState = new Map<string, WhatsappMode>();
const phoneStateTimestamps = new Map<string, number>();

function setPhoneState(phone: string, mode: WhatsappMode): void {
  phoneState.set(phone, mode);
  phoneStateTimestamps.set(phone, Date.now());
  evictStalePhoneStates();
}

function evictStalePhoneStates(): void {
  const cutoff = Date.now() - PHONE_STATE_TTL_MS;
  for (const [phone, ts] of phoneStateTimestamps) {
    if (ts < cutoff) {
      phoneState.delete(phone);
      phoneStateTimestamps.delete(phone);
    }
  }
}

function validateWebhookSecret(req: Request): void {
  const secret = process.env.EVOLUTION_WEBHOOK_SECRET;
  if (!secret) throw new HttpErrors.Unauthorized('Webhook not configured');
  const token = req.query['token'];
  if (typeof token !== 'string' || token.length === 0) {
    throw new HttpErrors.Unauthorized('Missing webhook token');
  }
  const expected = Buffer.from(secret);
  const received = Buffer.from(token);
  const valid =
    expected.length === received.length && crypto.timingSafeEqual(expected, received);
  if (!valid) throw new HttpErrors.Unauthorized('Invalid webhook token');
}

// Allowlist vazia = aceita qualquer número. Com entradas, só os números
// listados (já normalizados ao salvar) podem disparar prompts.
function isPhoneAllowed(phone: string): boolean {
  const allowed = readConfig().allowedPhones;
  if (allowed.length === 0) return true;
  return allowed.includes(phone);
}

function extractPhone(remoteJid: string): string {
  return normalizePhone(remoteJid.replace('@s.whatsapp.net', ''));
}

function extractText(message: EvolutionMessageContent): string | null {
  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  return null;
}

const SWITCH_PROJECT_HINT = 'Envie *!project* a qualquer momento para escolher outro projeto.';

const WA_CHAT_PREFIX = 'wa-';

function chatNameFor(phone: string): string {
  return `${WA_CHAT_PREFIX}${phone}`;
}

const WEBHOOK_GLOBAL_MAX = 300;
const WEBHOOK_GLOBAL_WINDOW_MS = 60 * 1000;
const WEBHOOK_PER_PHONE_MAX = 30;
const WEBHOOK_PER_PHONE_WINDOW_MS = 60 * 1000;

export class WebhookController {
  constructor(
    @repository(ProjectRepository) private projectRepo: ProjectRepository,
    @repository(PromptRepository) private promptRepo: PromptRepository,
    @repository(ChatSessionRepository) private chatSessionRepo: ChatSessionRepository,
    @inject(EVOLUTION_SERVICE) private evolutionService: EvolutionService,
    @inject(RATE_LIMITER_BINDING) private rateLimiter: RateLimiterService,
  ) {}

  @post('/webhook/evolution')
  @response(200, {
    description: 'Webhook recebido',
    content: {'application/json': {schema: {type: 'object', properties: {ok: {type: 'boolean'}}}}},
  })
  async receive(
    @requestBody({content: {'application/json': {schema: {type: 'object', additionalProperties: true}}}})
    payload: EvolutionWebhook,
    @inject(RestBindings.Http.REQUEST) req: Request,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<{ok: boolean}> {
    validateWebhookSecret(req);
    this.rateLimiter.check('webhook:global', WEBHOOK_GLOBAL_MAX, WEBHOOK_GLOBAL_WINDOW_MS);
    res.status(200);
    try {
      await this.process(payload);
    } catch (err) {
      console.error('[webhook] Erro ao processar payload:', JSON.stringify({
        event: payload.event,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
    return {ok: true};
  }

  private async process(payload: EvolutionWebhook): Promise<void> {
    if (payload.event !== 'messages.upsert') return;
    if (!payload.data?.key) return;
    if (payload.data.key.fromMe) return;
    if (payload.data.key.remoteJid.endsWith('@g.us')) return;

    const phone = extractPhone(payload.data.key.remoteJid);
    if (!NORMALIZED_PHONE_REGEX.test(phone)) return;
    if (!isPhoneAllowed(phone)) return;

    const text = extractText(payload.data.message ?? {});
    if (!text) return;

    this.rateLimiter.check(`webhook:${phone}`, WEBHOOK_PER_PHONE_MAX, WEBHOOK_PER_PHONE_WINDOW_MS);
    await this.dispatch(phone, text.trim());
  }

  private async dispatch(phone: string, text: string): Promise<void> {
    if (text === '!projeto' || text === '!project') {
      await this.startProjectSelection(phone);
      return;
    }
    const mode = phoneState.get(phone) ?? {kind: 'none'};
    if (mode.kind === 'none') {
      await this.startProjectSelection(phone);
      return;
    }
    if (mode.kind === 'selecting') {
      await this.handleSelection(phone, text);
      return;
    }
    await this.createPrompt(phone, text, mode.projectId);
  }

  private async startProjectSelection(phone: string): Promise<void> {
    const projects = await this.projectRepo.find({order: ['createdAt DESC']});
    if (projects.length === 0) {
      await this.evolutionService.sendText(phone, 'Nenhum projeto cadastrado.');
      return;
    }
    const list = projects.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
    await this.evolutionService.sendText(
      phone,
      `Seus projetos:\n${list}\n\nResponda com o número do projeto.\n\n${SWITCH_PROJECT_HINT}`,
    );
    setPhoneState(phone, {kind: 'selecting'});
  }

  private async handleSelection(phone: string, text: string): Promise<void> {
    const projects = await this.projectRepo.find({order: ['createdAt DESC']});
    const index = parseInt(text, 10) - 1;
    const project = projects[index];
    if (!project) {
      const list = projects.map((p, i) => `${i + 1}. ${p.name}`).join('\n');
      await this.evolutionService.sendText(phone, `Opção inválida. Seus projetos:\n${list}\n\nResponda com o número.`);
      return;
    }
    await this.upsertChatSession(phone, project.id);
    setPhoneState(phone, {kind: 'active', projectId: project.id});
    await this.evolutionService.sendText(
      phone,
      `Projeto *${project.name}* selecionado! Pode enviar seu prompt.\n\n${SWITCH_PROJECT_HINT}`,
    );
  }

  private async upsertChatSession(phone: string, projectId: number): Promise<void> {
    const chatName = chatNameFor(phone);
    const existing = await this.chatSessionRepo.findOne({where: {chatName}});
    if (existing) {
      await this.chatSessionRepo.updateById(existing.id, {projectId, sessionId: null});
      return;
    }
    await this.chatSessionRepo.create(new ChatSession({
      chatName,
      projectId,
      sessionId: null,
      totalPrompts: 0,
      lastUsed: null,
      createdAt: new Date().toISOString(),
    }));
  }

  private async createPrompt(phone: string, text: string, projectId: number): Promise<void> {
    const project = await this.projectRepo.findById(projectId).catch(() => null);
    if (!project) {
      await this.startProjectSelection(phone);
      return;
    }
    const chatName = chatNameFor(phone);
    const session = await this.chatSessionRepo.findOne({where: {chatName}});
    if (!session) {
      await this.startProjectSelection(phone);
      return;
    }
    const isSessionStart = session.totalPrompts === 0;
    await this.promptRepo.create(new Prompt({
      content: text,
      workingDirectory: project.workDir,
      chatName,
      sessionId: session.sessionId,
      isSessionStart,
      whatsappPhone: phone,
      status: 'queued' as PromptStatus,
      priority: 0,
      maxRetries: 3,
      retryCount: 0,
      output: '',
      estimatedTokens: null,
      lastExecuted: null,
      rateLimitedAt: null,
      resetTime: null,
      createdAt: new Date().toISOString(),
    }));
    await this.chatSessionRepo.updateById(session.id, {
      totalPrompts: session.totalPrompts + 1,
      lastUsed: new Date().toISOString(),
    });
  }
}
