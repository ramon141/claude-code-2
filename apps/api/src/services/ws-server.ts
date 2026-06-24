import {ClaudeCodeApiApplication} from '../application';
import {NOTIFICATION_SERVICE, NotificationService} from './notification.service';
import {DEFAULT_ALLOWED_ORIGINS} from '../config/app-config';
import WebSocket, {WebSocketServer} from 'ws';
import http from 'http';

const MAX_CONNECTIONS_PER_IP = 20;
const connectionsByIp = new Map<string, number>();

const IPV4_REGEX = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_REGEX = /^[0-9a-fA-F:]+$/;

function isValidIp(ip: string): boolean {
  return IPV4_REGEX.test(ip) || IPV6_REGEX.test(ip);
}

function getClientIp(req: http.IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const candidate = forwarded.split(',')[0].trim();
    if (isValidIp(candidate)) return candidate;
  }
  return req.socket.remoteAddress ?? 'unknown';
}

const ORIGIN_SEPARATOR = ',';

function getAllowedOrigins(): string[] {
  const fromEnv = process.env.WEBSOCKET_ALLOWED_ORIGINS;
  if (!fromEnv) return DEFAULT_ALLOWED_ORIGINS;
  const list = fromEnv.split(ORIGIN_SEPARATOR).map(o => o.trim()).filter(o => o.length > 0);
  return list.length > 0 ? list : DEFAULT_ALLOWED_ORIGINS;
}

function isOriginAllowed(req: http.IncomingMessage): boolean {
  const allowed = getAllowedOrigins();
  const origin = req.headers['origin'];
  if (!origin) return false;
  return allowed.includes(origin);
}

function trackConnection(ip: string, ws: WebSocket): boolean {
  const current = connectionsByIp.get(ip) ?? 0;
  if (current >= MAX_CONNECTIONS_PER_IP) return false;
  connectionsByIp.set(ip, current + 1);
  ws.on('close', () => {
    const count = connectionsByIp.get(ip) ?? 1;
    if (count <= 1) connectionsByIp.delete(ip);
    else connectionsByIp.set(ip, count - 1);
  });
  return true;
}

function handleConnection(
  ws: WebSocket,
  req: http.IncomingMessage,
  notificationService: NotificationService,
): void {
  if (!isOriginAllowed(req)) {
    ws.close(4003, 'Forbidden origin');
    return;
  }
  const ip = getClientIp(req);
  if (!trackConnection(ip, ws)) {
    ws.close(4029, 'Too many connections from this IP');
    return;
  }
  notificationService.addConnection(ws);
  console.log(`[ws] cliente conectado ip=${ip}`);
  ws.on('close', () => console.log(`[ws] cliente desconectado ip=${ip}`));
}

export async function setupWebSocketServer(
  app: ClaudeCodeApiApplication,
  httpServer: http.Server,
): Promise<void> {
  const notificationService = await app.get(NOTIFICATION_SERVICE);

  const wss = new WebSocketServer({server: httpServer, path: '/ws'});
  wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
    handleConnection(ws, req, notificationService);
  });

  console.log('WebSocket server listening on path /ws');
}
