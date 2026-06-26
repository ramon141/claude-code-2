export type ChatSessionResponse = {
  id: number;
  chatName: string;
  sessionId: string | null;
  projectId: number;
  projectName: string;
  workingDirectory: string;
  totalPrompts: number;
  lastUsed: string | null;
  createdAt: string;
  hasPendingPrompts: boolean;
};

export type ChatPromptSummary = {
  id: number;
  content: string;
  status: string;
  output: string;
  createdAt: string;
  lastExecuted: string | null;
  contextFiles: string[];
  waitForPromptId: number | null;
  useWaitResponse: boolean;
};

export type ChatSearchResult = {
  chatName: string;
  sessionId: string | null;
  projectId: number;
  projectName: string;
  workingDirectory: string;
  totalPrompts: number;
  lastUsed: string | null;
  createdAt: string;
  matchedIn: ('chatName' | 'content' | 'output')[];
  snippet: string;
};

export const chatSessionResponseSchema = {
  type: 'object',
  properties: {
    id: {type: 'number'},
    chatName: {type: 'string'},
    sessionId: {type: 'string', nullable: true},
    projectId: {type: 'number'},
    projectName: {type: 'string'},
    workingDirectory: {type: 'string'},
    totalPrompts: {type: 'number'},
    lastUsed: {type: 'string', format: 'date-time', nullable: true},
    createdAt: {type: 'string', format: 'date-time'},
    hasPendingPrompts: {type: 'boolean'},
  },
};

export const chatPromptSummarySchema = {
  type: 'object',
  properties: {
    id: {type: 'number'},
    content: {type: 'string'},
    status: {type: 'string'},
    output: {type: 'string'},
    createdAt: {type: 'string', format: 'date-time'},
    lastExecuted: {type: 'string', format: 'date-time', nullable: true},
    contextFiles: {type: 'array', items: {type: 'string'}},
    waitForPromptId: {type: 'number', nullable: true},
    useWaitResponse: {type: 'boolean'},
  },
};

export const chatSearchResultSchema = {
  type: 'object',
  properties: {
    chatName: {type: 'string'},
    sessionId: {type: 'string', nullable: true},
    projectId: {type: 'number'},
    workingDirectory: {type: 'string'},
    totalPrompts: {type: 'number'},
    lastUsed: {type: 'string', format: 'date-time', nullable: true},
    createdAt: {type: 'string', format: 'date-time'},
    projectName: {type: 'string'},
    matchedIn: {type: 'array', items: {type: 'string', enum: ['chatName', 'content', 'output']}},
    snippet: {type: 'string'},
  },
};
