import {spawnSync, spawn} from 'child_process';

const NGROK_PORT = 7300;
const NGROK_WEB_PORTS = [4040, 4041, 4042, 4043, 4044];
const NGROK_KILL_DELAY_MS = 800;

type NgrokTunnel = {public_url?: string; config?: {addr?: string}};
type NgrokResponse = {tunnels?: NgrokTunnel[]};

async function fetchJson(port: number): Promise<NgrokResponse | null> {
  return new Promise(resolve => {
    const http = require('http') as typeof import('http');
    const req = http.get({host: '127.0.0.1', port, path: '/api/tunnels', timeout: 1000}, res => {
      let body = '';
      res.on('data', (c: Buffer) => (body += String(c)));
      res.on('end', () => {
        try { resolve(JSON.parse(body) as NgrokResponse); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

async function findNgrokWebPort(): Promise<number | null> {
  for (const port of NGROK_WEB_PORTS) {
    const data = await fetchJson(port);
    const isOurs = data?.tunnels?.some(t => {
      const addr = t.config?.addr ?? '';
      return addr.includes(`:${NGROK_PORT}`) || addr === String(NGROK_PORT);
    });
    if (isOurs) return port;
  }
  return null;
}

function killNgrokForPort(): void {
  spawnSync('pkill', ['-f', `ngrok http ${NGROK_PORT}`], {encoding: 'utf-8'});
}

function spawnNgrok(domain?: string): void {
  const args = ['http', String(NGROK_PORT), '--log=stdout'];
  if (domain && domain.length > 0) args.push(`--url=${domain}`);
  spawn('ngrok', args, {detached: true, stdio: 'ignore'}).unref();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function restartNgrok(enabled: boolean, domain?: string): Promise<void> {
  killNgrokForPort();
  await sleep(NGROK_KILL_DELAY_MS);
  if (enabled) spawnNgrok(domain && domain.length > 0 ? domain : undefined);
}

export {findNgrokWebPort};
