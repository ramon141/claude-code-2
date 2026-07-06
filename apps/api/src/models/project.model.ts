import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    sqlite3: {table: 'projects'},
  },
})
export class Project extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    sqlite3: {columnName: 'id'},
  })
  id: number;

  @property({
    type: 'string',
    required: true,
    sqlite3: {columnName: 'name'},
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    sqlite3: {columnName: 'work_dir'},
  })
  workDir: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    sqlite3: {columnName: 'memory'},
  })
  memory: string | null;

  @property({
    type: 'date',
    defaultFn: 'now',
    sqlite3: {columnName: 'created_at'},
  })
  createdAt: string;

  constructor(data?: Partial<Project>) {
    super(data);
  }
}

export interface ProjectRelations {}
export type ProjectWithRelations = Project & ProjectRelations;
