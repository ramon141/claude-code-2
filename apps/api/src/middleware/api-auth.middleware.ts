import crypto from 'crypto';
import {Next, ValueOrPromise} from '@loopback/core';
import {Middleware, MiddlewareContext} from '@loopback/express';
import {HttpErrors} from '@loopback/rest';
import {readConfig} from '../config/app-config';

const AUTH_FAIL_LIMIT = 10;
const AUTH_FAIL_WINDOW_MS = 60_000;
const authFailCounts = new Map<string, {count: number; since: number}>();

function checkAuthRateLimit(ip: string): void {
  const now = Date.now();
  const entry = authFailCounts.get(ip);
  if (!entry || now - entry.since > AUTH_FAIL_WINDOW_MS) {
    authFailCounts.set(ip, {count: 0, since: now});
    return;
  }
  if (entry.count >= AUTH_FAIL_LIMIT) {
    throw new HttpErrors.TooManyRequests('Muitas tentativas de autenticação. Aguarde um minuto.');
  }
}

function recordAuthFailure(ip: string): void {
  const entry = authFailCounts.get(ip);
  if (entry) entry.count += 1;
}

// Prefixos de rotas da API que exigem autenticação para acesso remoto.
// Arquivos estáticos (o app em si, tela de login) ficam fora — precisam carregar
// sem token. O webhook tem seu próprio secret e também fica fora.
const PROTECTED_PREFIXES = [
  '/prompts',
  '/projects',
  '/auth',
  '/claude-code-api-keys',
  '/queue',
  '/setup',
  '/chat-sessions',
];

const BEARER_PREFIX = 'Bearer ';
const LOOPBACK_IPS = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];

// Confiável só quando vem do loopback E sem cabeçalhos de proxy. O ngrok roda
// na própria máquina e encaminha para localhost, então o tráfego do celular
// também chega como 127.0.0.1 — mas com X-Forwarded-For/Host. Esses cabeçalhos
// denunciam que passou por um túnel e, portanto, exige token.
function isTrustedLocal(request: MiddlewareContext['request']): boolean {
  if (!isLoopback(request.socket.remoteAddress)) return false;
  if (request.headers['x-forwarded-for']) return false;
  if (request.headers['x-forwarded-host']) return false;
  return true;
}

function isLoopback(ip: string | undefined): boolean {
  if (!ip) return false;
  return LOOPBACK_IPS.includes(ip);
}

function isProtectedPath(path: string): boolean {
  return PROTECTED_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
}

function extractBearer(header: string | undefined): string {
  if (!header || !header.startsWith(BEARER_PREFIX)) return '';
  return header.slice(BEARER_PREFIX.length).trim();
}

// Auth por senha única para acesso externo (ngrok). Requisições do próprio
// computador (loopback) são confiáveis e passam sem token, então o desktop não
// precisa de login. Sem token configurado, o enforcement fica desligado.
export const apiAuthMiddleware: Middleware = (
  middlewareCtx: MiddlewareContext,
  next: Next,
): ValueOrPromise<object> => {
  const {request} = middlewareCtx;
  const token = readConfig().apiAuthToken;

  if (token.length === 0) return next() as ValueOrPromise<object>;
  if (!isProtectedPath(request.path)) return next() as ValueOrPromise<object>;
  if (isTrustedLocal(request)) return next() as ValueOrPromise<object>;

  const ip = request.socket.remoteAddress ?? 'unknown';
  checkAuthRateLimit(ip);
  const provided = extractBearer(request.headers['authorization']);
  const tokensMatch =
    provided.length === token.length &&
    crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(token));
  if (!tokensMatch) {
    recordAuthFailure(ip);
    throw new HttpErrors.Unauthorized('Token de acesso inválido ou ausente');
  }
  return next() as ValueOrPromise<object>;
};
