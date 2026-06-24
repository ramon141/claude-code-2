import 'dotenv/config';
import {ApplicationConfig, ClaudeCodeApiApplication} from './application';
import {RestServer} from '@loopback/rest';
import {setupWebSocketServer} from './services/ws-server';
import http from 'http';

export * from './application';

const REQUIRED_ENV_VARS = [
  'ENCRYPTION_KEY',
  'EVOLUTION_WEBHOOK_SECRET',
  'DATABASE_URL',
];

function assertEnvVars(): void {
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias não configuradas: ${missing.join(', ')}`);
  }
}

export async function main(options: ApplicationConfig = {}) {
  assertEnvVars();
  const app = new ClaudeCodeApiApplication(options);
  await app.boot();
  await app.start();

  const restServer = await app.getServer(RestServer);
  const httpServer = restServer.httpServer?.server as http.Server | undefined;
  if (httpServer) {
    await setupWebSocketServer(app, httpServer);
  }

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  return app;
}

if (require.main === module) {
  // Run the application
  const config = {
    rest: {
      port: +(process.env.PORT ?? 3000),
      host: process.env.HOST || '127.0.0.1',
      // The `gracePeriodForClose` provides a graceful close for http/https
      // servers with keep-alive clients. The default value is `Infinity`
      // (don't force-close). If you want to immediately destroy all sockets
      // upon stop, set its value to `0`.
      // See https://www.npmjs.com/package/stoppable
      gracePeriodForClose: 5000, // 5 seconds
      openApiSpec: {
        // useful when used with OpenAPI-to-GraphQL to locate your application
        setServersFromRequest: true,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
