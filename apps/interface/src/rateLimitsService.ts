import axios from 'axios';
import { execSync } from 'child_process';

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const OAUTH_BETA_FALLBACK = 'oauth-2025-04-20';
const PROBE_MODEL = 'claude-haiku-4-5-20251001';

function resolveOauthBeta(): string {
  try {
    const result = execSync("strings $(which claude) | grep -oE 'oauth-20[0-9-]+' | tail -1", { encoding: 'utf-8', timeout: 5000 });
    const value = result.trim();
    return value.length > 0 ? value : OAUTH_BETA_FALLBACK;
  } catch {
    return OAUTH_BETA_FALLBACK;
  }
}

const OAUTH_BETA = resolveOauthBeta();
const PERCENTAGE_FACTOR = 100;
const HEADER_5H_UTILIZATION = 'anthropic-ratelimit-unified-5h-utilization';
const HEADER_7D_UTILIZATION = 'anthropic-ratelimit-unified-7d-utilization';

export interface RateLimitPercentages {
  sessionLimitPercentage: number;
  weeklyLimitPercentage: number;
}

export async function fetchRateLimits(oauthToken: string): Promise<RateLimitPercentages> {
  const response = await axios.post(
    ANTHROPIC_MESSAGES_URL,
    { model: PROBE_MODEL, max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] },
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

  const fiveH = parseFloat(String(response.headers[HEADER_5H_UTILIZATION] ?? '0'));
  const sevenD = parseFloat(String(response.headers[HEADER_7D_UTILIZATION] ?? '0'));

  return {
    sessionLimitPercentage: Math.round(fiveH * PERCENTAGE_FACTOR),
    weeklyLimitPercentage: Math.round(sevenD * PERCENTAGE_FACTOR),
  };
}
