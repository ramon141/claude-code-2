import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {PostgresDataSource} from '../datasources';
import {QueueState, QueueStateRelations} from '../models';

export class QueueStateRepository extends DefaultCrudRepository<
  QueueState,
  typeof QueueState.prototype.id,
  QueueStateRelations
> {
  constructor(@inject('datasources.postgres') dataSource: PostgresDataSource) {
    super(QueueState, dataSource);
  }
}
