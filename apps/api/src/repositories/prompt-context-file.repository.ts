import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {PromptContextFile, PromptContextFileRelations} from '../models';

export class PromptContextFileRepository extends DefaultCrudRepository<
  PromptContextFile,
  typeof PromptContextFile.prototype.id,
  PromptContextFileRelations
> {
  constructor(@inject('datasources.postgres') dataSource: PostgresDataSource) {
    super(PromptContextFile, dataSource);
  }
}
