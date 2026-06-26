import {SchemaObject} from '@loopback/rest';
import {getModelSchemaRef} from '@loopback/rest';
import {Prompt, PromptStatus} from '../models';

export type PromptResponse = {
  id: number;
  content: string;
  status: PromptStatus;
  priority: number;
  workingDirectory: string;
  contextFiles: string[];
  maxRetries: number;
  retryCount: number;
  estimatedTokens: number | null;
  sessionId: string | null;
  chatName: string | null;
  isSessionStart: boolean;
  output: string;
  whatsappPhone: string | null;
  claudeModel: string | null;
  waitForPromptId: number | null;
  useWaitResponse: boolean;
  createdAt: string;
  lastExecuted: string | null;
  rateLimitedAt: string | null;
  resetTime: string | null;
};

export const promptResponseSchema: SchemaObject = {
  allOf: [
    getModelSchemaRef(Prompt, {exclude: ['contextFiles']}),
    {properties: {contextFiles: {type: 'array', items: {type: 'string'}}}},
  ],
};

export const createPromptSchema: SchemaObject = {
  type: 'object',
  required: ['content', 'workingDirectory'],
  additionalProperties: false,
  properties: {
    content: {type: 'string'},
    priority: {type: 'number', default: 0},
    workingDirectory: {type: 'string'},
    contextFiles: {type: 'array', items: {type: 'string'}, default: []},
    maxRetries: {type: 'number', default: 3},
    estimatedTokens: {type: 'number', nullable: true},
    sessionId: {type: 'string', nullable: true},
    chatName: {type: 'string', nullable: true},
    claudeModel: {type: 'string', nullable: true},
    waitForPromptId: {type: 'number', nullable: true},
    useWaitResponse: {type: 'boolean', default: false},
  },
};

export const patchPromptSchema: SchemaObject = {
  type: 'object',
  additionalProperties: false,
  properties: {
    status: {
      type: 'string',
      enum: ['queued', 'executing', 'completed', 'failed', 'cancelled', 'rate_limited'],
    },
    content: {type: 'string'},
    retryCount: {type: 'number'},
    lastExecuted: {type: 'string', format: 'date-time'},
    rateLimitedAt: {type: 'string', format: 'date-time'},
    resetTime: {type: 'string', format: 'date-time'},
    isSessionStart: {type: 'boolean'},
    output: {type: 'string'},
    sessionId: {type: 'string', nullable: true},
  },
};

export const EDITABLE_STATUSES: PromptStatus[] = ['queued' as PromptStatus, 'rate_limited' as PromptStatus];

export const ACTIVE_STATUSES: PromptStatus[] = ['queued' as PromptStatus, 'executing' as PromptStatus];
