import http from 'http';

const NGROK_API_HOST = '127.0.0.1';
const NGROK_API_PORT = 4040;
const NGROK_API_PATH = '/api/tunnels';
const HTTPS_PROTO = 'https';
const REQUEST_TIMEOUT_MS = 4000;

type NgrokTunnel = {
  public_url?: string;
  proto?: string;
};

type NgrokTunnelsResponse = {
  tunnels?: NgrokTunnel[];
};

function fetchTunnels(): Promise<NgrokTunnelsResponse> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {host: NGROK_API_HOST, port: NGROK_API_PORT, path: NGROK_API_PATH, timeout: REQUEST_TIMEOUT_MS},
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
    req.on('timeout', () => req.destroy(new Error('Tempo esgotado ao consultar ngrok')));
    req.on('error', reject);
  });
}

export async function getNgrokUrl(): Promise<string | null> {
  const data = await fetchTunnels();
  const tunnel = data.tunnels?.find(t => t.proto === HTTPS_PROTO) ?? data.tunnels?.[0];
  return tunnel?.public_url ?? null;
}
