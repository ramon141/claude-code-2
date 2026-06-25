import {ClaudeCodeInterface} from './claudeInterface';
import {QueuedPrompt, ExecutionResult, RateLimitInfo} from './queue.models';

type WorkerInput = {
  promptData: Pick<QueuedPrompt, 'id' | 'content' | 'workingDirectory' | 'sessionId' | 'contextFiles' | 'isSessionStart' | 'claudeModel'>;
  oauthToken: string;
  claudeCommand: string;
  timeout: number;
};

type WorkerResultData = {
  success: boolean;
  output: string;
  error: string;
  rateLimitInfo: RateLimitInfo | null;
  executionTime: number;
  sessionId: string | null;
};

type FlushMessage = {type: 'flush'; text: string};
type DoneMessage = {type: 'done'; result: WorkerResultData};
type ErrorMessage = {type: 'error'; message: string};
type WorkerMessage = FlushMessage | DoneMessage | ErrorMessage;

process.on('message', async (input: WorkerInput) => {
  try {
    const claude = new ClaudeCodeInterface(input.claudeCommand, input.timeout);
    const prompt = new QueuedPrompt(input.promptData);

    const result = await claude.executePrompt(prompt, input.oauthToken, async (text: string) => {
      const msg: FlushMessage = {type: 'flush', text};
      process.send!(msg);
    });

    const done: DoneMessage = {
      type: 'done',
      result: {
        success: result.success,
        output: result.output,
        error: result.error,
        rateLimitInfo: result.rateLimitInfo,
        executionTime: result.executionTime,
        sessionId: result.sessionId,
      },
    };
    process.send!(done);
  } catch (e) {
    const err: ErrorMessage = {type: 'error', message: e instanceof Error ? e.message : String(e)};
    process.send!(err);
  } finally {
    process.exit(0);
  }
});

// Keep process alive until message arrives
process.on('disconnect', () => process.exit(0));

export type {WorkerMessage, WorkerInput, WorkerResultData};
