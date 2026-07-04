import {SchemaObject} from '@loopback/rest';
import {getModelSchemaRef} from '@loopback/rest';
import {Prompt, PromptStatus} from '../models';
import {PromptContextFile} from '../models';

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
  baseRef: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
};

export function toPromptResponse(
  prompt: Prompt,
  files: PromptContextFile[] | string[] = [],
): PromptResponse {
  const contextFiles = files.length === 0 || typeof files[0] === 'string'
    ? (files as string[])
    : (files as PromptContextFile[]).map(f => f.filePath);

  return {
    id: prompt.id,
    content: prompt.content,
    status: prompt.status,
    priority: prompt.priority,
    workingDirectory: prompt.workingDirectory,
    contextFiles,
    maxRetries: prompt.maxRetries,
    retryCount: prompt.retryCount,
    estimatedTokens: prompt.estimatedTokens,
    sessionId: prompt.sessionId,
    chatName: prompt.chatName ?? null,
    isSessionStart: prompt.isSessionStart,
    output: prompt.output,
    whatsappPhone: prompt.whatsappPhone ?? null,
    claudeModel: prompt.claudeModel ?? null,
    waitForPromptId: prompt.waitForPromptId ?? null,
    useWaitResponse: prompt.useWaitResponse ?? false,
    createdAt: prompt.createdAt,
    lastExecuted: prompt.lastExecuted,
    rateLimitedAt: prompt.rateLimitedAt,
    resetTime: prompt.resetTime,
    baseRef: prompt.baseRef ?? null,
    inputTokens: prompt.inputTokens ?? null,
    outputTokens: prompt.outputTokens ?? null,
  };
}

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
    status: {type: 'string', enum: ['draft', 'queued'], default: 'queued'},
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
      enum: ['draft', 'queued', 'executing', 'completed', 'failed', 'cancelled', 'rate_limited'],
    },
    content: {type: 'string'},
    retryCount: {type: 'number'},
    lastExecuted: {type: 'string', format: 'date-time'},
    rateLimitedAt: {type: 'string', format: 'date-time'},
    resetTime: {type: 'string', format: 'date-time'},
    isSessionStart: {type: 'boolean'},
    output: {type: 'string'},
    sessionId: {type: 'string', nullable: true},
    waitForPromptId: {type: 'number', nullable: true},
    useWaitResponse: {type: 'boolean'},
  },
};

export const EDITABLE_STATUSES: PromptStatus[] = ['draft' as PromptStatus, 'queued' as PromptStatus, 'rate_limited' as PromptStatus];

export const ACTIVE_STATUSES: PromptStatus[] = ['queued' as PromptStatus, 'executing' as PromptStatus];
