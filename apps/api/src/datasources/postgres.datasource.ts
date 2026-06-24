import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

type PostgresConfig = {
  name: string;
  connector: string;
  url: string | undefined;
  lazyConnect: boolean;
};

// lazyConnect evita conectar no boot: em modo setup (sem DATABASE_URL) o
// processo não tenta abrir o pool e não derruba a API. Conecta na 1ª query.
// A URL é lida na CONSTRUÇÃO (não no load do módulo) porque o config do app
// é aplicado ao process.env durante o boot, após os imports serem resolvidos.
function buildConfig(): PostgresConfig {
  return {
    name: 'postgres',
    connector: 'postgresql',
    url: process.env.DATABASE_URL,
    lazyConnect: true,
  };
}

@lifeCycleObserver('datasource')
export class PostgresDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'postgres';
  static get defaultConfig(): PostgresConfig {
    return buildConfig();
  }

  constructor(
    @inject('datasources.config.postgres', {optional: true})
    dsConfig?: PostgresConfig,
  ) {
    super(dsConfig ?? buildConfig());
    this.on('error', err => {
      console.error(`[postgres] erro de conexão: ${err.message}`);
    });
  }
}
