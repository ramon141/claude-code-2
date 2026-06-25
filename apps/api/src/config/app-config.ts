import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type EvolutionConfig = {
  webhookSecret: string;
  url: string;
  token: string;
  instanceName: string;
};

export type AppConfig = {
  databaseUrl: string;
  claudeCommand: string;
  timeout: number;
  evolution: EvolutionConfig;
  websocketAllowedOrigins: string[];
  ngrokEnabled: boolean;
  claudeRotationEnabled: boolean;
  apiAuthToken: string;
  allowedPhones: string[];
  notificationsEnabled: boolean;
  notificationPhones: string[];
  setupCompleted: boolean;
};

export type AppConfigPatch = Partial<Omit<AppConfig, 'evolution'>> & {
  evolution?: Partial<EvolutionConfig>;
};

const DEFAULT_CLAUDE_COMMAND = 'claude';
const DEFAULT_TIMEOUT_SECONDS = 3600;
const CONFIG_FILE_NAME = 'app-config.json';
const WEBHOOK_SECRET_BYTES = 16;

export const DEFAULT_ALLOWED_ORIGINS: string[] = [
  'tauri://localhost',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:3000',
];

const EMPTY_EVOLUTION: EvolutionConfig = {
  webhookSecret: '',
  url: '',
  token: '',
  instanceName: '',
};

function defaultConfig(): AppConfig {
  return {
    databaseUrl: '',
    claudeCommand: DEFAULT_CLAUDE_COMMAND,
    timeout: DEFAULT_TIMEOUT_SECONDS,
    evolution: {...EMPTY_EVOLUTION},
    websocketAllowedOrigins: [...DEFAULT_ALLOWED_ORIGINS],
    ngrokEnabled: false,
    claudeRotationEnabled: false,
    apiAuthToken: '',
    allowedPhones: [],
    notificationsEnabled: false,
    notificationPhones: [],
    setupCompleted: false,
  };
}

export function getConfigPath(): string {
  const fromEnv = process.env.APP_CONFIG_PATH;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  return path.join(process.cwd(), CONFIG_FILE_NAME);
}

export function readConfig(): AppConfig {
  const file = getConfigPath();
  if (!fs.existsSync(file)) return defaultConfig();
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON.parse(raw) as Partial<AppConfig>;
  return mergeConfig(parsed);
}

function mergeConfig(parsed: Partial<AppConfig>): AppConfig {
  const base = defaultConfig();
  return {
    databaseUrl: parsed.databaseUrl ?? base.databaseUrl,
    claudeCommand: parsed.claudeCommand ?? base.claudeCommand,
    timeout: parsed.timeout ?? base.timeout,
    evolution: {...base.evolution, ...(parsed.evolution ?? {})},
    websocketAllowedOrigins:
      parsed.websocketAllowedOrigins && parsed.websocketAllowedOrigins.length > 0
        ? parsed.websocketAllowedOrigins
        : base.websocketAllowedOrigins,
    ngrokEnabled: parsed.ngrokEnabled ?? base.ngrokEnabled,
    claudeRotationEnabled: parsed.claudeRotationEnabled ?? base.claudeRotationEnabled,
    apiAuthToken: parsed.apiAuthToken ?? base.apiAuthToken,
    allowedPhones: parsed.allowedPhones ?? base.allowedPhones,
    notificationsEnabled: parsed.notificationsEnabled ?? base.notificationsEnabled,
    notificationPhones: parsed.notificationPhones ?? base.notificationPhones,
    setupCompleted: parsed.setupCompleted ?? base.setupCompleted,
  };
}

export function writeConfig(patch: AppConfigPatch): AppConfig {
  const current = readConfig();
  const next: AppConfig = {...current, ...patch, evolution: current.evolution};
  if (patch.evolution) next.evolution = {...current.evolution, ...patch.evolution};
  const file = getConfigPath();
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, JSON.stringify(next, null, 2), 'utf8');
  applyConfigToEnv(next);
  return next;
}

// Garante um EVOLUTION_WEBHOOK_SECRET: gera e persiste se ainda não existir.
// O secret não é pedido ao usuário — é criado automaticamente e usado tanto na
// validação do webhook quanto na URL registrada na Evolution.
export function ensureWebhookSecret(): string {
  const current = readConfig();
  if (current.evolution.webhookSecret.length > 0) return current.evolution.webhookSecret;
  const secret = crypto.randomBytes(WEBHOOK_SECRET_BYTES).toString('hex');
  writeConfig({evolution: {...current.evolution, webhookSecret: secret}});
  return secret;
}

export function applyConfigToEnv(cfg: AppConfig): void {
  if (cfg.databaseUrl) process.env.DATABASE_URL = cfg.databaseUrl;
  process.env.CLAUDE_COMMAND = cfg.claudeCommand;
  process.env.TIMEOUT = String(cfg.timeout);
  process.env.EVOLUTION_WEBHOOK_SECRET = cfg.evolution.webhookSecret;
  process.env.EVOLUTION_URL = cfg.evolution.url;
  process.env.EVOLUTION_TOKEN = cfg.evolution.token;
  process.env.EVOLUTION_INSTANCE_NAME = cfg.evolution.instanceName;
  process.env.WEBSOCKET_ALLOWED_ORIGINS = cfg.websocketAllowedOrigins.join(',');
}
