import WebSocket from 'ws';

type WsMessage = { event: string };

const RECONNECT_DELAY_MS = 5_000;

export function createWsClient(wsUrl: string, onQueued: () => void): () => void {
  let active = true;

  function connect(): void {
    if (!active) return;
    const ws = new WebSocket(wsUrl);

    ws.on('open', () => {
      console.log('[ws] Connected to API — real-time mode active');
      onQueued();
    });

    ws.on('message', (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString()) as WsMessage;
        if (msg.event === 'prompt:queued') onQueued();
      } catch { /* ignore malformed frames */ }
    });

    ws.on('close', () => {
      if (active) {
        console.log(`[ws] Disconnected — reconnecting in ${RECONNECT_DELAY_MS / 1000}s`);
        setTimeout(connect, RECONNECT_DELAY_MS);
      }
    });

    ws.on('error', (err: Error) => {
      console.warn(`[ws] Error: ${err.message}`);
    });
  }

  connect();
  return () => { active = false; };
}
