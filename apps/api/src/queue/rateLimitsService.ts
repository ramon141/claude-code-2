import axios from 'axios';
import {spawnSync} from 'child_process';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const OAUTH_BETA_FALLBACK = 'oauth-2025-04-20';
const PROBE_MODEL = 'claude-haiku-4-5-20251001';

function resolveOauthBeta(): string {
  try {
    const which = spawnSync('which', ['claude'], {encoding: 'utf-8', timeout: 3000});
    const claudePath = which.stdout.trim();
    if (!claudePath) return OAUTH_BETA_FALLBACK;
    const strings = spawnSync('strings', [claudePath], {encoding: 'utf-8', timeout: 5000});
    const match = strings.stdout.match(/oauth-20[\d-]+/g);
    if (!match) return OAUTH_BETA_FALLBACK;
    const last = match[match.length - 1];
    return last.length > 0 ? last : OAUTH_BETA_FALLBACK;
  } catch {
    return OAUTH_BETA_FALLBACK;
  }
}

const OAUTH_BETA = resolveOauthBeta();
const PERCENTAGE_FACTOR = 100;

function safeParseRatio(value: string | string[] | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : null;
}

const HEADER_5H_UTILIZATION = 'anthropic-ratelimit-unified-5h-utilization';
const HEADER_7D_UTILIZATION = 'anthropic-ratelimit-unified-7d-utilization';
const HEADER_5H_RESET = 'anthropic-ratelimit-unified-5h-reset';
const HEADER_7D_RESET = 'anthropic-ratelimit-unified-7d-reset';

function safeParseResetDate(value: string | string[] | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  const epochSeconds = parseInt(String(value), 10);
  return Number.isFinite(epochSeconds) ? new Date(epochSeconds * 1000).toISOString() : null;
}

export interface RateLimitPercentages {
  sessionLimitPercentage: number | null;
  weeklyLimitPercentage: number | null;
  sessionResetAt: string | null;
  weeklyResetAt: string | null;
}

export async function fetchRateLimits(oauthToken: string): Promise<RateLimitPercentages> {
  const response = await axios.post(
    ANTHROPIC_MESSAGES_URL,
    {model: PROBE_MODEL, max_tokens: 1, messages: [{role: 'user', content: 'hi'}]},
    {
      headers: {
        Authorization: `Bearer ${oauthToken}`,
        'anthropic-version': ANTHROPIC_VERSION,
        'anthropic-beta': OAUTH_BETA,
        'anthropic-client-type': 'claude_code',
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    },
  );
  const fiveH = safeParseRatio(response.headers[HEADER_5H_UTILIZATION]);
  const sevenD = safeParseRatio(response.headers[HEADER_7D_UTILIZATION]);
  return {
    sessionLimitPercentage: fiveH !== null ? Math.round(fiveH * PERCENTAGE_FACTOR) : null,
    weeklyLimitPercentage: sevenD !== null ? Math.round(sevenD * PERCENTAGE_FACTOR) : null,
    sessionResetAt: safeParseResetDate(response.headers[HEADER_5H_RESET]),
    weeklyResetAt: safeParseResetDate(response.headers[HEADER_7D_RESET]),
  };
}
