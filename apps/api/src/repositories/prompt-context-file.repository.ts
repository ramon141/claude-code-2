import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {SqliteDataSource} from '../datasources';
import {PromptContextFile, PromptContextFileRelations} from '../models';

export class PromptContextFileRepository extends DefaultCrudRepository<
  PromptContextFile,
  typeof PromptContextFile.prototype.id,
  PromptContextFileRelations
> {
  constructor(@inject('datasources.sqlite') dataSource: SqliteDataSource) {
    super(PromptContextFile, dataSource);
  }
}
