import {SchemaObject} from '@loopback/rest';

export type SetupStatus = {
  databaseConfigured: boolean;
  claudeConfigured: boolean;
  evolutionConfigured: boolean;
  completed: boolean;
};

export type DatabaseSetupBody = {
  databaseUrl: string;
};

export type ClaudeSetupBody = {
  claudeCommand: string;
  timeout: number;
};

export type EvolutionSetupBody = {
  url: string;
  token: string;
  instanceName: string;
};

export type NgrokWebhookBody = {
  url: string;
  token: string;
  instanceName: string;
};

export type NgrokWebhookResult = {
  webhookUrl: string;
};

export type WebsocketSetupBody = {
  origins: string[];
};

export type NgrokToggleBody = {
  enabled: boolean;
};

export type AuthTokenBody = {
  token: string;
};

export type PhonesBody = {
  phones: string[];
};

export type NotificationsBody = {
  enabled: boolean;
  phones: string[];
};

export type NgrokUrlResult = {
  url: string | null;
};

export type AppConfigView = {
  databaseUrl: string;
  claudeCommand: string;
  timeout: number;
  evolutionUrl: string;
  evolutionToken: string;
  evolutionInstanceName: string;
  websocketAllowedOrigins: string[];
  ngrokEnabled: boolean;
  authConfigured: boolean;
  allowedPhones: string[];
  notificationsEnabled: boolean;
  notificationPhones: string[];
};

const TYPE_STRING = 'string';
const TYPE_NUMBER = 'number';
const TYPE_BOOLEAN = 'boolean';

export const setupStatusSchema: SchemaObject = {
  type: 'object',
  required: ['databaseConfigured', 'claudeConfigured', 'evolutionConfigured', 'completed'],
  properties: {
    databaseConfigured: {type: TYPE_BOOLEAN},
    claudeConfigured: {type: TYPE_BOOLEAN},
    evolutionConfigured: {type: TYPE_BOOLEAN},
    completed: {type: TYPE_BOOLEAN},
  },
};

export const databaseResultSchema: SchemaObject = {
  type: 'object',
  required: ['success', 'migrated'],
  properties: {
    success: {type: TYPE_BOOLEAN},
    migrated: {type: TYPE_BOOLEAN},
  },
};

export const successResultSchema: SchemaObject = {
  type: 'object',
  required: ['success'],
  properties: {
    success: {type: TYPE_BOOLEAN},
  },
};

export const completeResultSchema: SchemaObject = {
  type: 'object',
  required: ['completed'],
  properties: {
    completed: {type: TYPE_BOOLEAN},
  },
};

export const databaseSetupSchema: SchemaObject = {
  type: 'object',
  required: ['databaseUrl'],
  properties: {
    databaseUrl: {type: TYPE_STRING},
  },
};

export const claudeSetupSchema: SchemaObject = {
  type: 'object',
  required: ['claudeCommand', 'timeout'],
  properties: {
    claudeCommand: {type: TYPE_STRING},
    timeout: {type: TYPE_NUMBER},
  },
};

export const evolutionSetupSchema: SchemaObject = {
  type: 'object',
  required: ['url', 'token', 'instanceName'],
  properties: {
    url: {type: TYPE_STRING},
    token: {type: TYPE_STRING},
    instanceName: {type: TYPE_STRING},
  },
};

export const ngrokWebhookSchema: SchemaObject = {
  type: 'object',
  required: ['url', 'token', 'instanceName'],
  properties: {
    url: {type: TYPE_STRING},
    token: {type: TYPE_STRING},
    instanceName: {type: TYPE_STRING},
  },
};

export const ngrokWebhookResultSchema: SchemaObject = {
  type: 'object',
  required: ['webhookUrl'],
  properties: {
    webhookUrl: {type: TYPE_STRING},
  },
};

export const websocketSetupSchema: SchemaObject = {
  type: 'object',
  required: ['origins'],
  properties: {
    origins: {type: 'array', items: {type: TYPE_STRING}},
  },
};

export const ngrokToggleSchema: SchemaObject = {
  type: 'object',
  required: ['enabled'],
  properties: {
    enabled: {type: TYPE_BOOLEAN},
  },
};

export const authTokenSchema: SchemaObject = {
  type: 'object',
  required: ['token'],
  properties: {
    token: {type: TYPE_STRING},
  },
};

export const phonesSchema: SchemaObject = {
  type: 'object',
  required: ['phones'],
  properties: {
    phones: {type: 'array', items: {type: TYPE_STRING}},
  },
};

export const notificationsSchema: SchemaObject = {
  type: 'object',
  required: ['enabled', 'phones'],
  properties: {
    enabled: {type: TYPE_BOOLEAN},
    phones: {type: 'array', items: {type: TYPE_STRING}},
  },
};

export const ngrokUrlResultSchema: SchemaObject = {
  type: 'object',
  required: ['url'],
  properties: {
    url: {type: TYPE_STRING, nullable: true},
  },
};

export const appConfigViewSchema: SchemaObject = {
  type: 'object',
  required: [
    'databaseUrl',
    'claudeCommand',
    'timeout',
    'evolutionUrl',
    'evolutionToken',
    'evolutionInstanceName',
    'websocketAllowedOrigins',
    'ngrokEnabled',
    'authConfigured',
    'allowedPhones',
    'notificationsEnabled',
    'notificationPhones',
  ],
  properties: {
    databaseUrl: {type: TYPE_STRING},
    claudeCommand: {type: TYPE_STRING},
    timeout: {type: TYPE_NUMBER},
    evolutionUrl: {type: TYPE_STRING},
    evolutionToken: {type: TYPE_STRING},
    evolutionInstanceName: {type: TYPE_STRING},
    websocketAllowedOrigins: {type: 'array', items: {type: TYPE_STRING}},
    ngrokEnabled: {type: TYPE_BOOLEAN},
    authConfigured: {type: TYPE_BOOLEAN},
    allowedPhones: {type: 'array', items: {type: TYPE_STRING}},
    notificationsEnabled: {type: TYPE_BOOLEAN},
    notificationPhones: {type: 'array', items: {type: TYPE_STRING}},
  },
};
