import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    sqlite3: {table: 'prompt_context_files'},
  },
})
export class PromptContextFile extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    sqlite3: {columnName: 'id'},
  })
  id: number;

  @property({
    type: 'number',
    required: true,
    sqlite3: {columnName: 'prompt_id'},
  })
  promptId: number;

  @property({
    type: 'string',
    required: true,
    sqlite3: {columnName: 'file_path'},
  })
  filePath: string;

  constructor(data?: Partial<PromptContextFile>) {
    super(data);
  }
}

export interface PromptContextFileRelations {}
export type PromptContextFileWithRelations = PromptContextFile & PromptContextFileRelations;
