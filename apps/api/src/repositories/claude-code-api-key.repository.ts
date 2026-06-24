import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {ClaudeCodeApiKey, ClaudeCodeApiKeyRelations} from '../models';

export class ClaudeCodeApiKeyRepository extends DefaultCrudRepository<
  ClaudeCodeApiKey,
  typeof ClaudeCodeApiKey.prototype.id,
  ClaudeCodeApiKeyRelations
> {
  constructor(
    @inject('datasources.postgres') dataSource: PostgresDataSource,
  ) {
    super(ClaudeCodeApiKey, dataSource);
  }
}
