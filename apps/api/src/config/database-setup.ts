import {juggler} from '@loopback/repository';
import {spawn} from 'child_process';
import path from 'path';

export type DbTestResult = {ok: boolean; error?: string};
export type MigrateResult = {ok: boolean; error?: string};

const PING_CONNECTOR = 'postgresql';
const PING_NAME = 'setup-ping';
const PING_TIMEOUT_MS = 8000;
const MIGRATE_ENTRY = 'migrate.js';

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Tempo de conexão esgotado')), ms),
  );
  return Promise.race([promise, timeout]);
}

export async function testDatabaseConnection(url: string): Promise<DbTestResult> {
  const ds = new juggler.DataSource({name: PING_NAME, connector: PING_CONNECTOR, url});
  // Captura o evento 'error' do pool pg: sem isso uma falha de conexão
  // dispara um 'error' não tratado e derruba o processo da API.
  let poolError = '';
  ds.on('error', err => {
    poolError = err instanceof Error ? err.message : String(err);
  });
  try {
    await withTimeout(ds.ping(), PING_TIMEOUT_MS);
    return {ok: true};
  } catch (err) {
    const message = poolError || (err instanceof Error ? err.message : String(err));
    return {ok: false, error: message};
  } finally {
    await ds.disconnect().catch(() => undefined);
  }
}

export function runMigrations(url: string): Promise<MigrateResult> {
  const entry = path.join(__dirname, '..', MIGRATE_ENTRY);
  return new Promise(resolve => {
    const child = spawn(process.execPath, [entry], {
      cwd: path.join(__dirname, '..'),
      env: {...process.env, DATABASE_URL: url},
    });
    let stderr = '';
    child.stderr.on('data', chunk => {
      stderr += String(chunk);
    });
    child.on('error', err => resolve({ok: false, error: err.message}));
    child.on('close', code => {
      if (code === 0) resolve({ok: true});
      else resolve({ok: false, error: stderr || `migrate exited with code ${code}`});
    });
  });
}
