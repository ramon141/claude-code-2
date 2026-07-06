import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {SqliteDataSource} from '../datasources';
import {QueueState, QueueStateRelations} from '../models';

export class QueueStateRepository extends DefaultCrudRepository<
  QueueState,
  typeof QueueState.prototype.id,
  QueueStateRelations
> {
  constructor(@inject('datasources.sqlite') dataSource: SqliteDataSource) {
    super(QueueState, dataSource);
  }
}
