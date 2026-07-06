import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {SqliteDataSource} from '../datasources';
import {ClaudeCodeApiKey, ClaudeCodeApiKeyRelations} from '../models';

export class ClaudeCodeApiKeyRepository extends DefaultCrudRepository<
  ClaudeCodeApiKey,
  typeof ClaudeCodeApiKey.prototype.id,
  ClaudeCodeApiKeyRelations
> {
  constructor(
    @inject('datasources.sqlite') dataSource: SqliteDataSource,
  ) {
    super(ClaudeCodeApiKey, dataSource);
  }
}
