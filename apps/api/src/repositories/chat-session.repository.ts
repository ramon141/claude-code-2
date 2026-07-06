import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {SqliteDataSource} from '../datasources';
import {ChatSession, ChatSessionRelations} from '../models';

export class ChatSessionRepository extends DefaultCrudRepository<
  ChatSession,
  typeof ChatSession.prototype.id,
  ChatSessionRelations
> {
  constructor(@inject('datasources.sqlite') dataSource: SqliteDataSource) {
    super(ChatSession, dataSource);
  }
}
