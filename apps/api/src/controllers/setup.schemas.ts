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
