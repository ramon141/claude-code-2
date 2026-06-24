import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    postgresql: {schema: 'public', table: 'projects'},
  },
})
export class Project extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    postgresql: {columnName: 'id', dataType: 'integer'},
  })
  id: number;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'name', dataType: 'varchar'},
  })
  name: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'work_dir', dataType: 'text'},
  })
  workDir: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {nullable: true},
    postgresql: {columnName: 'memory', dataType: 'text'},
  })
  memory: string | null;

  @property({
    type: 'date',
    defaultFn: 'now',
    postgresql: {
      columnName: 'created_at',
      dataType: 'timestamp with time zone',
    },
  })
  createdAt: string;

  constructor(data?: Partial<Project>) {
    super(data);
  }
}

export interface ProjectRelations {}
export type ProjectWithRelations = Project & ProjectRelations;
