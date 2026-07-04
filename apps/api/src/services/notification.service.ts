import {BindingKey, BindingScope, injectable} from '@loopback/core';
import WebSocket from 'ws';
import {PromptStatus} from '../models';

export type PromptNotification = {
  event: 'prompt:updated';
  promptId: number;
  chatName: string | null;
  status: PromptStatus;
  output: string;
  inputTokens: number | null;
  outputTokens: number | null;
};

export type SystemWarningNotification = {
  event: 'system:warning';
  message: string;
};

export type Notification = PromptNotification | SystemWarningNotification;

export const NOTIFICATION_SERVICE = BindingKey.create<NotificationService>(
  'services.NotificationService',
);

@injectable({scope: BindingScope.SINGLETON})
export class NotificationService {
  private connections = new Set<WebSocket>();

  addConnection(ws: WebSocket): void {
    this.connections.add(ws);
    ws.on('close', () => this.connections.delete(ws));
  }

  notify(payload: Notification): void {
    const message = JSON.stringify(payload);
    let sent = 0;
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
        sent++;
      }
    });
    if (payload.event === 'prompt:updated') {
      console.log(`[ws] promptId=${payload.promptId} status=${payload.status} clients=${sent}`);
    } else {
      console.log(`[ws] system:warning clients=${sent}`);
    }
  }
}
