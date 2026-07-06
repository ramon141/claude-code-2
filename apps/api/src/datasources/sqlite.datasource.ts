import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

type SqliteConfig = {
  name: string;
  connector: string;
  file: string | undefined;
};

// O arquivo é lido na CONSTRUÇÃO (não no load do módulo) porque o config do app
// é aplicado ao process.env durante o boot, após os imports serem resolvidos.
function buildConfig(): SqliteConfig {
  return {
    name: 'sqlite',
    connector: 'sqlite3',
    file: process.env.DATABASE_FILE,
  };
}

@lifeCycleObserver('datasource')
export class SqliteDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'sqlite';
  static get defaultConfig(): SqliteConfig {
    return buildConfig();
  }

  constructor(
    @inject('datasources.config.sqlite', {optional: true})
    dsConfig?: SqliteConfig,
  ) {
    super(dsConfig ?? buildConfig());
    this.on('error', err => {
      console.error(`[sqlite] erro de conexão: ${err.message}`);
    });
  }
}
