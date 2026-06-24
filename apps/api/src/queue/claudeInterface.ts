import {spawn, ChildProcess} from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import {ExecutionResult, RateLimitInfo, QueuedPrompt} from './queue.models';

type StreamEvent = {
  type: string;
  event?: {type: string; delta?: {type: string; text?: string}};
  result?: string;
  session_id?: string;
  is_error?: boolean;
};

const STREAM_FLUSH_INTERVAL_MS = 5_000;
const VERIFY_TIMEOUT_MS = 10_000;
const LIMIT_MESSAGE_MAX_CHARS = 500;
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
    return this.executeWithCli(prompt, startTime, oauthToken, onOutputFlush);
  }

  private buildContextArgs(prompt: QueuedPrompt, workingDir: string): string {
    if (prompt.contextFiles.length === 0) return prompt.content;
    const refs = prompt.contextFiles
      .filter(f => fs.existsSync(path.resolve(workingDir, f)))
      .map(f => `@${f}`);
    return refs.length > 0 ? `${refs.join(' ')} ${prompt.content}` : prompt.content;
  }

  private buildSpawnArgs(prompt: QueuedPrompt, workingDir: string): string[] {
    const args = ['--print', '--dangerously-skip-permissions', '--output-format', 'stream-json', '--include-partial-messages', '--verbose'];
    if (prompt.sessionId) args.push('--resume', prompt.sessionId);
    args.push(this.buildContextArgs(prompt, workingDir));
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
      let buffer = '';
      let stderr = '';
      let currentOutput = '';
      let sessionId: string | null = null;
      let finalResult: string | null = null;
      let isFinalError = false;
      let timedOut = false;

      const killTimer = setTimeout(() => {timedOut = true; child.kill();}, this.timeout * SECONDS_TO_MS);
      const flushTimer = onOutputFlush
        ? setInterval(() => {if (currentOutput) void onOutputFlush(currentOutput).catch(() => {});}, STREAM_FLUSH_INTERVAL_MS)
        : null;

      child.stdout?.setEncoding('utf-8');
      child.stderr?.setEncoding('utf-8');

      child.stdout?.on('data', (chunk: string) => {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = this.parseStreamLine(line);
          if (!event) continue;
          const delta = this.extractTextDelta(event);
          if (delta) currentOutput += delta;
          if (event.type === 'result') {
            finalResult = event.result ?? null;
            sessionId = event.session_id ?? null;
            isFinalError = event.is_error ?? false;
          }
        }
      });

      child.stderr?.on('data', (c: string) => {stderr += c;});

      child.on('close', code => {
        clearTimeout(killTimer);
        if (flushTimer) clearInterval(flushTimer);
        const executionTime = (Date.now() - startTime) / SECONDS_TO_MS;
        if (timedOut) {
          resolve(new ExecutionResult({success: false, output: '', error: `Execution timed out after ${this.timeout}s`, executionTime}));
          return;
        }
        const output = finalResult ?? currentOutput;
        const rateLimitInfo = this.detectRateLimit(output + stderr);
        const success = code === 0 && !rateLimitInfo.isRateLimited && !isFinalError;
        if (!success) console.error(`✗ CLI exit code=${code} isFinalError=${isFinalError} stderr=${JSON.stringify(stderr)} output=${JSON.stringify(output.substring(0, 200))}`);
        resolve(new ExecutionResult({success, output, error: stderr, rateLimitInfo, executionTime, sessionId}));
      });

      child.on('error', err => {
        clearTimeout(killTimer);
        if (flushTimer) clearInterval(flushTimer);
        resolve(new ExecutionResult({success: false, output: '', error: `Execution failed: ${err.message}`, executionTime: (Date.now() - startTime) / SECONDS_TO_MS}));
      });
    });
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
