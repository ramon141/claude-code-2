import http from 'http';

const NGROK_API_HOST = '127.0.0.1';
const NGROK_API_PATH = '/api/tunnels';
const HTTPS_PROTO = 'https';
const REQUEST_TIMEOUT_MS = 2000;
const API_PORT = 7300;
const NGROK_WEB_PORTS = [4040, 4041, 4042, 4043, 4044];

type NgrokTunnel = {
  public_url?: string;
  proto?: string;
  config?: {addr?: string};
};

type NgrokTunnelsResponse = {
  tunnels?: NgrokTunnel[];
};

function fetchTunnels(port: number): Promise<NgrokTunnelsResponse> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {host: NGROK_API_HOST, port, path: NGROK_API_PATH, timeout: REQUEST_TIMEOUT_MS},
      res => {
        let body = '';
        res.on('data', chunk => (body += String(chunk)));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body) as NgrokTunnelsResponse);
          } catch (err) {
            reject(err instanceof Error ? err : new Error(String(err)));
          }
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

function isApiTunnel(tunnel: NgrokTunnel): boolean {
  const addr = tunnel.config?.addr ?? '';
  return addr.includes(`:${API_PORT}`) || addr === String(API_PORT);
}

export async function getNgrokUrl(): Promise<string | null> {
  for (const port of NGROK_WEB_PORTS) {
    const data = await fetchTunnels(port).catch(() => null);
    if (!data?.tunnels?.length) continue;
    const tunnel =
      data.tunnels.find(t => isApiTunnel(t) && t.proto === HTTPS_PROTO) ??
      data.tunnels.find(t => isApiTunnel(t));
    if (tunnel?.public_url) return tunnel.public_url;
  }
  return null;
}
