import https from 'https';
import http from 'http';
import {URL} from 'url';
import {BindingKey, BindingScope, injectable} from '@loopback/core';

type SendTextBody = {
  number: string;
  text: string;
};

@injectable({scope: BindingScope.SINGLETON})
export class EvolutionService {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly instance: string;

  constructor() {
    this.baseUrl = process.env.EVOLUTION_URL ?? '';
    this.token = process.env.EVOLUTION_TOKEN ?? '';
    this.instance = process.env.EVOLUTION_INSTANCE_NAME ?? '';
  }

  async sendText(phone: string, text: string): Promise<void> {
    const url = `${this.baseUrl}/message/sendText/${this.instance}`;
    await this.post(url, {number: phone, text});
  }

  private post(rawUrl: string, body: SendTextBody): Promise<void> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(rawUrl);
      const data = JSON.stringify(body);
      const isHttps = parsed.protocol === 'https:';
      const port = parsed.port ? Number(parsed.port) : (isHttps ? 443 : 80);
      const transport = isHttps ? https : http;
      const req = transport.request(
        {
          hostname: parsed.hostname,
          port,
          path: parsed.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'apikey': this.token,
          },
        },
        res => { res.resume(); resolve(); },
      );
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
}

export const EVOLUTION_SERVICE = BindingKey.create<EvolutionService>('services.EvolutionService');
