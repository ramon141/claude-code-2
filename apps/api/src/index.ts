import 'dotenv/config';
import './config/bootstrap';
import {ApplicationConfig, ClaudeCodeApiApplication} from './application';
import {RestServer} from '@loopback/rest';
import {setupWebSocketServer} from './services/ws-server';
import {applyConfigToEnv, readConfig} from './config/app-config';
import {restartNgrok} from './services/ngrok-process';
import {NOTIFICATION_SERVICE} from './services/notification.service';
import {SqliteDataSource} from './datasources';
import http from 'http';

export * from './application';

const REQUIRED_ENV_VARS = ['ENCRYPTION_KEY'];

// O connector sqlite3 tem bug no caminho de ALTER (autoupdate / migrateSchema
// 'alter'): ignora o mapeamento sqlite3.table e busca o nome default do model
// (ex.: "queuestate"), quebrando quando a tabela já existe. Por isso só criamos
// o schema quando ele ainda não existe (banco novo). Em banco existente não
// mexemos. ponytail: heurística por uma tabela; mudança de schema exige recriar.
async function ensureSchema(app: ClaudeCodeApiApplication): Promise<void> {
  const ds = await app.get<SqliteDataSource>('datasources.sqlite');
  const rows = (await ds.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='queue_state'",
  )) as {name: string}[];
  if (!rows || rows.length === 0) {
    await app.migrateSchema({existingSchema: 'alter'});
  }
}

function assertEnvVars(): void {
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias não configuradas: ${missing.join(', ')}`);
  }
}

export async function main(options: ApplicationConfig = {}) {
  applyConfigToEnv(readConfig());
  assertEnvVars();
  const app = new ClaudeCodeApiApplication(options);
  await app.boot();
  await ensureSchema(app);
  await app.start();

  const restServer = await app.getServer(RestServer);
  const httpServer = restServer.httpServer?.server as http.Server | undefined;
  if (httpServer) {
    await setupWebSocketServer(app, httpServer);
  }

  const cfg = readConfig();
  if (cfg.ngrokEnabled) {
    const notificationService = await app.get(NOTIFICATION_SERVICE);
    void restartNgrok(true, cfg.ngrokDomain, message =>
      notificationService.notify({event: 'system:warning', message}),
    );
  }

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);

  return app;
}

if (require.main === module) {
  // Run the application
  const ALLOWED_CORS_ORIGINS = [
    'tauri://localhost',
    'http://127.0.0.1:1420',
    'http://localhost:1420',
  ];

  const config = {
    rest: {
      port: +(process.env.PORT ?? 7300),
      host: process.env.HOST || '127.0.0.1',
      gracePeriodForClose: 5000,
      openApiSpec: {
        setServersFromRequest: true,
      },
      cors: {
        origin: ALLOWED_CORS_ORIGINS,
        credentials: true,
      },
    },
  };
  main(config).catch(err => {
    console.error('Cannot start the application.', err);
    process.exit(1);
  });
}
