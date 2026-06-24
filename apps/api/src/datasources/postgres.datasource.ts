import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

type PostgresConfig = {
  name: string;
  connector: string;
  url: string | undefined;
};

const config: PostgresConfig = {
  name: 'postgres',
  connector: 'postgresql',
  url: process.env.DATABASE_URL,
};

@lifeCycleObserver('datasource')
export class PostgresDataSource
  extends juggler.DataSource
  implements LifeCycleObserver
{
  static dataSourceName = 'postgres';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.postgres', {optional: true})
    dsConfig: PostgresConfig = config,
  ) {
    super(dsConfig);
  }
}
