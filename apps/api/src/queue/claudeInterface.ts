import {spawn, ChildProcess} from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import {ExecutionResult, RateLimitInfo, QueuedPrompt} from './queue.models';

type StreamEventUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

type StreamEvent = {
  type: string;
  event?: {type: string; delta?: {type: string; text?: string}};
  result?: string;
  session_id?: string;
  is_error?: boolean;
  usage?: StreamEventUsage;
};

type CliStreamState = {
  buffer: string;
  stderr: string;
  currentOutput: string;
  sessionId: string | null;
  finalResult: string | null;
  isFinalError: boolean;
  timedOut: boolean;
  inputTokens: number | null;
  outputTokens: number | null;
};

const STREAM_FLUSH_INTERVAL_MS = 5_000;
const VERIFY_TIMEOUT_MS = 10_000;
const LIMIT_MESSAGE_MAX_CHARS = 500;
const ERROR_OUTPUT_PREVIEW_CHARS = 200;
const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
const SECONDS_TO_MS = 1000;
const RESET_HOUR_WINDOWS = [5, 10, 15, 20] as const;

const RATE_LIMIT_PATTERNS = [
  'usage limit reached',
  'hit your limit',
  'rate limit exceeded',
  'too many requests',
  'quota exceeded',
  'limit exceeded',
] as const;

const AUTH_ERROR_PATTERNS = [
  'invalid token',
  'invalid api key',
  'unauthorized',
  'authentication failed',
  'authentication_error',
  'not logged in',
  'unauthenticated',
  'invalid oauth',
  'token expired',
  'invalid credentials',
] as const;

const CLI_NOT_FOUND_MSG = 'Claude Code CLI não encontrado. Instale com: npm install -g @anthropic-ai/claude-code';
const AUTH_ERROR_MSG = 'Token inválido ou expirado. Atualize o token nas configurações de contas.';
const TOKEN_REDACTED = '[TOKEN_REDACTED]';

function redactToken(text: string, token: string): string {
  if (!token || token.length < 8) return text;
  return text.split(token).join(TOKEN_REDACTED);
}

const USAGE_LIMIT_PATTERN = /usage limit reached\|(\d+)/i;
const RESET_DATE_TEXT_PATTERN = /resets\s+(\w+\s+\d+)\s+at\s+(\d+(?::\d+)?)(am|pm)/i;
const ISO_DATE_PATTERN = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)/g;

export class ClaudeCodeInterface {
  claudeCommand: string;
  timeout: number;

  constructor(claudeCommand: string = 'claude', timeout: number = 3600) {
    this.claudeCommand = claudeCommand;
    this.timeout = timeout;
  }

  async executePrompt(
    prompt: QueuedPrompt,
    oauthToken: string,
    onOutputFlush?: (text: string) => Promise<void>,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const result = await this.executeWithCli(prompt, startTime, oauthToken, onOutputFlush);
    // Garante que o token não apareça em nenhum campo do resultado
    return new ExecutionResult({
      ...result,
      output: redactToken(result.output, oauthToken),
      error: redactToken(result.error, oauthToken),
    });
  }

  private buildContextArgs(prompt: QueuedPrompt, workingDir: string): string {
    if (prompt.contextFiles.length === 0) return prompt.content;
    const refs = prompt.contextFiles
      .filter(f => {
        const resolved = path.resolve(workingDir, f);
        const exists = fs.existsSync(resolved);
        if (!exists) console.warn(`[claude] arquivo não encontrado e ignorado: ${resolved}`);
        return exists;
      })
      .map(f => `@${f}`);
    console.log(`[claude] contextFiles recebidos: ${JSON.stringify(prompt.contextFiles)}`);
    console.log(`[claude] refs geradas: ${JSON.stringify(refs)}`);
    return refs.length > 0 ? `${refs.join(' ')} ${prompt.content}` : prompt.content;
  }

  private buildSpawnArgs(prompt: QueuedPrompt, workingDir: string): string[] {
    const args = ['--print', '--dangerously-skip-permissions', '--output-format', 'stream-json', '--include-partial-messages', '--verbose'];
    if (prompt.claudeModel) args.push('--model', prompt.claudeModel);
    if (prompt.sessionId) args.push('--resume', prompt.sessionId);
    args.push(this.buildContextArgs(prompt, workingDir));
    const safeArgs = args.map((a, i) => (args[i - 1] === '--resume' ? '[REDACTED]' : a));
    console.log(`[claude] spawn args: ${JSON.stringify(safeArgs)}`);
    return args;
  }

  private ensureWorkingDir(workingDirectory: string): string {
    const dir = path.resolve(workingDirectory);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
    return dir;
  }

  private parseStreamLine(line: string): StreamEvent | null {
    try { return JSON.parse(line) as StreamEvent; } catch { return null; }
  }

  private extractTextDelta(event: StreamEvent): string {
    if (event.type !== 'stream_event') return '';
    if (event.event?.type !== 'content_block_delta') return '';
    if (event.event.delta?.type !== 'text_delta') return '';
    return event.event.delta.text ?? '';
  }

  private executeWithCli(
    prompt: QueuedPrompt,
    startTime: number,
    oauthToken: string,
    onOutputFlush?: (text: string) => Promise<void>,
  ): Promise<ExecutionResult> {
    return new Promise(resolve => {
      const workingDir = this.ensureWorkingDir(prompt.workingDirectory);
      const spawnEnv = {...process.env, CLAUDE_CODE_OAUTH_TOKEN: oauthToken};
      const child: ChildProcess = spawn(this.claudeCommand, this.buildSpawnArgs(prompt, workingDir), {
        cwd: workingDir, env: spawnEnv, stdio: ['ignore', 'pipe', 'pipe'],
      });
      const state = this.createStreamState();

      const killTimer = setTimeout(() => {state.timedOut = true; child.kill();}, this.timeout * SECONDS_TO_MS);
      const flushTimer = onOutputFlush
        ? setInterval(() => {if (state.currentOutput) void onOutputFlush(state.currentOutput).catch(() => {});}, STREAM_FLUSH_INTERVAL_MS)
        : null;
      const clearTimers = () => {
        clearTimeout(killTimer);
        if (flushTimer) clearInterval(flushTimer);
      };

      child.stdout?.setEncoding('utf-8');
      child.stderr?.setEncoding('utf-8');

      child.stdout?.on('data', (chunk: string) => this.handleStdoutChunk(chunk, state));
      child.stderr?.on('data', (c: string) => {state.stderr += c;});

      child.on('close', code => {
        clearTimers();
        resolve(this.buildCloseResult(code, state, startTime));
      });

      child.on('error', err => {
        clearTimers();
        const isNotFound = (err as NodeJS.ErrnoException).code === 'ENOENT';
        resolve(new ExecutionResult({
          success: false,
          output: isNotFound ? CLI_NOT_FOUND_MSG : '',
          error: isNotFound ? CLI_NOT_FOUND_MSG : `Execution failed: ${err.message}`,
          isCliNotFound: isNotFound,
          executionTime: (Date.now() - startTime) / SECONDS_TO_MS,
        }));
      });
    });
  }

  private createStreamState(): CliStreamState {
    return {
      buffer: '',
      stderr: '',
      currentOutput: '',
      sessionId: null,
      finalResult: null,
      isFinalError: false,
      timedOut: false,
      inputTokens: null,
      outputTokens: null,
    };
  }

  private handleStdoutChunk(chunk: string, state: CliStreamState): void {
    state.buffer += chunk;
    const lines = state.buffer.split('\n');
    state.buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = this.parseStreamLine(line);
      if (!event) continue;
      const delta = this.extractTextDelta(event);
      if (delta) state.currentOutput += delta;
      if (event.type === 'result') {
        state.finalResult = event.result ?? null;
        state.sessionId = event.session_id ?? null;
        state.isFinalError = event.is_error ?? false;
        if (event.usage) {
          const u = event.usage;
          state.inputTokens = (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
          state.outputTokens = u.output_tokens ?? 0;
        }
      }
    }
  }

  private buildCloseResult(code: number | null, state: CliStreamState, startTime: number): ExecutionResult {
    const executionTime = (Date.now() - startTime) / SECONDS_TO_MS;
    if (state.timedOut) {
      return new ExecutionResult({success: false, output: '', error: `Execution timed out after ${this.timeout}s`, executionTime});
    }
    const output = state.finalResult ?? state.currentOutput;
    const combined = output + state.stderr;
    const rateLimitInfo = this.detectRateLimit(combined);
    const isAuthError = !rateLimitInfo.isRateLimited && this.detectAuthError(combined);
    const success = code === 0 && !rateLimitInfo.isRateLimited && !state.isFinalError && !isAuthError;
    if (!success) console.error(`✗ CLI exit code=${code} isFinalError=${state.isFinalError} isAuthError=${isAuthError} stderr=${JSON.stringify(state.stderr.substring(0, ERROR_OUTPUT_PREVIEW_CHARS))} output=${JSON.stringify(output.substring(0, ERROR_OUTPUT_PREVIEW_CHARS))}`);
    return new ExecutionResult({
      success,
      output: isAuthError ? AUTH_ERROR_MSG : output,
      error: isAuthError ? AUTH_ERROR_MSG : state.stderr,
      rateLimitInfo,
      isAuthError,
      executionTime,
      sessionId: state.sessionId,
      inputTokens: state.inputTokens,
      outputTokens: state.outputTokens,
    });
  }

  detectAuthError(output: string): boolean {
    const lower = output.toLowerCase();
    return AUTH_ERROR_PATTERNS.some(p => lower.includes(p));
  }

  detectRateLimit(output: string): RateLimitInfo {
    const lower = output.toLowerCase();
    const matched = RATE_LIMIT_PATTERNS.find(p => lower.includes(p));
    if (!matched) return {isRateLimited: false, resetTime: null, limitMessage: '', timestamp: null};
    const patternsWithResetTime = ['usage limit reached', 'hit your limit'];
    const resetTime = patternsWithResetTime.includes(matched)
      ? this.extractResetTimeFromLimitMessage(output)
      : this.estimateResetTime();
    return {isRateLimited: true, resetTime, limitMessage: output.trim().substring(0, LIMIT_MESSAGE_MAX_CHARS), timestamp: new Date()};
  }

  private findLatestISODate(output: string): Date | null {
    let latest: Date | null = null;
    let match: RegExpExecArray | null;
    const re = new RegExp(ISO_DATE_PATTERN.source, 'g');
    while ((match = re.exec(output)) !== null) {
      const captured = match[1];
      if (!captured) continue;
      try {
        const ts = new Date(captured);
        if (!latest || ts > latest) latest = ts;
      } catch { /* ignore */ }
    }
    return latest;
  }

  private parseResetDateText(output: string): Date | null {
    const match = RESET_DATE_TEXT_PATTERN.exec(output);
    if (!match) return null;
    const year = new Date().getFullYear();
    const period = match[3] ?? 'AM';
    const parsed = new Date(`${match[1]}, ${year} ${match[2]}:00 ${period.toUpperCase()}`);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private extractResetTimeFromLimitMessage(output: string): Date {
    const match = USAGE_LIMIT_PATTERN.exec(output);
    if (match?.[1]) return new Date(parseInt(match[1], 10) * SECONDS_TO_MS);
    const resetDateText = this.parseResetDateText(output);
    if (resetDateText) return resetDateText;
    const latest = this.findLatestISODate(output);
    if (latest) return new Date(latest.getTime() + FIVE_HOURS_MS);
    return this.estimateResetTime();
  }

  private estimateResetTime(): Date {
    const now = new Date();
    const hour = now.getHours();
    const next = new Date(now);
    const nextHour = RESET_HOUR_WINDOWS.find(h => hour < h);
    if (nextHour !== undefined) {
      next.setHours(nextHour, 0, 0, 0);
    } else {
      next.setDate(next.getDate() + 1);
      next.setHours(0, 0, 0, 0);
    }
    if (next <= now) next.setTime(next.getTime() + FIVE_HOURS_MS);
    return next;
  }

  testConnection(): [boolean, string] {
    try {
      const {spawnSync} = require('child_process') as typeof import('child_process');
      const result = spawnSync(this.claudeCommand, ['--help'], {encoding: 'utf-8', timeout: VERIFY_TIMEOUT_MS});
      if (result.error) {
        const isNotFound = (result.error as NodeJS.ErrnoException).code === 'ENOENT';
        return isNotFound
          ? [false, `Claude Code CLI not found: ${this.claudeCommand}`]
          : [false, `Claude Code CLI test failed: ${result.error.message}`];
      }
      return result.status === 0 ? [true, 'Claude Code CLI is working'] : [false, `Claude Code CLI error: ${result.stderr}`];
    } catch (e) {
      return [false, `Claude Code CLI test failed: ${e}`];
    }
  }
}
