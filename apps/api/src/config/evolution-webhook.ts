import https from 'https';
import http from 'http';
import {URL} from 'url';

const MESSAGES_UPSERT_EVENT = 'MESSAGES_UPSERT';
const WEBHOOK_SET_PATH = 'webhook/set';
const CONNECTION_STATE_PATH = 'instance/connectionState';
const HTTPS_PORT = 443;
const HTTP_PORT = 80;
const SUCCESS_MIN = 200;
const SUCCESS_MAX = 299;

export type RegisterWebhookParams = {
  baseUrl: string;
  token: string;
  instanceName: string;
  webhookUrl: string;
};

export type RegisterWebhookResult = {ok: boolean; error?: string};

type WebhookPayload = {
  webhook: {
    enabled: boolean;
    url: string;
    events: string[];
  };
};

export type EvolutionConnectionState = 'open' | 'close' | 'connecting' | 'notConfigured' | 'error';

export type ConnectionStateResult = {state: EvolutionConnectionState; error?: string};

type ConnectionStateResponse = {instance?: {state?: string}};

function buildSetUrl(baseUrl: string, instanceName: string): string {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalized}${WEBHOOK_SET_PATH}/${instanceName}`;
}

function buildConnectionStateUrl(baseUrl: string, instanceName: string): string {
  const normalized = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalized}${CONNECTION_STATE_PATH}/${instanceName}`;
}

export function getEvolutionConnectionState(
  baseUrl: string,
  token: string,
  instanceName: string,
): Promise<ConnectionStateResult> {
  if (!baseUrl || !token || !instanceName) {
    return Promise.resolve({state: 'notConfigured'});
  }
  return getJson(buildConnectionStateUrl(baseUrl, instanceName), token);
}

function getJson(rawUrl: string, token: string): Promise<ConnectionStateResult> {
  return new Promise(resolve => {
    const parsed = new URL(rawUrl);
    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : isHttps ? HTTPS_PORT : HTTP_PORT,
      path: parsed.pathname,
      method: 'GET',
      headers: {apikey: token},
    };
    const req = transport.request(options, res => handleStateResponse(res, resolve));
    req.on('error', err => resolve({state: 'error', error: err.message}));
    req.end();
  });
}

function handleStateResponse(
  res: http.IncomingMessage,
  resolve: (result: ConnectionStateResult) => void,
): void {
  let body = '';
  res.on('data', chunk => (body += String(chunk)));
  res.on('end', () => {
    const status = res.statusCode ?? 0;
    if (status < SUCCESS_MIN || status > SUCCESS_MAX) {
      resolve({state: 'error', error: `Evolution respondeu ${status}`});
      return;
    }
    try {
      const parsed = JSON.parse(body) as ConnectionStateResponse;
      const raw = parsed.instance?.state ?? 'error';
      const state = toConnectionState(raw);
      resolve({state});
    } catch {
      resolve({state: 'error', error: 'Resposta inválida'});
    }
  });
}

function toConnectionState(raw: string): EvolutionConnectionState {
  if (raw === 'open' || raw === 'close' || raw === 'connecting') return raw;
  return 'error';
}

export function registerEvolutionWebhook(params: RegisterWebhookParams): Promise<RegisterWebhookResult> {
  const payload: WebhookPayload = {
    webhook: {enabled: true, url: params.webhookUrl, events: [MESSAGES_UPSERT_EVENT]},
  };
  return postJson(buildSetUrl(params.baseUrl, params.instanceName), params.token, payload);
}

function postJson(rawUrl: string, token: string, body: WebhookPayload): Promise<RegisterWebhookResult> {
  return new Promise(resolve => {
    const parsed = new URL(rawUrl);
    const data = JSON.stringify(body);
    const isHttps = parsed.protocol === 'https:';
    const transport = isHttps ? https : http;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : isHttps ? HTTPS_PORT : HTTP_PORT,
      path: parsed.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        apikey: token,
      },
    };
    const req = transport.request(options, res => handleResponse(res, resolve));
    req.on('error', err => resolve({ok: false, error: err.message}));
    req.write(data);
    req.end();
  });
}

function handleResponse(
  res: http.IncomingMessage,
  resolve: (result: RegisterWebhookResult) => void,
): void {
  let body = '';
  res.on('data', chunk => (body += String(chunk)));
  res.on('end', () => {
    const status = res.statusCode ?? 0;
    if (status >= SUCCESS_MIN && status <= SUCCESS_MAX) resolve({ok: true});
    else resolve({ok: false, error: `Evolution respondeu ${status}: ${body}`});
  });
}
