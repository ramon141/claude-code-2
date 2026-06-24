import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    postgresql: {schema: 'public', table: 'prompt_context_files'},
  },
})
export class PromptContextFile extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
    postgresql: {columnName: 'id', dataType: 'integer'},
  })
  id: number;

  @property({
    type: 'number',
    required: true,
    postgresql: {columnName: 'prompt_id', dataType: 'integer'},
  })
  promptId: number;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'file_path', dataType: 'text'},
  })
  filePath: string;

  constructor(data?: Partial<PromptContextFile>) {
    super(data);
  }
}

export interface PromptContextFileRelations {}
export type PromptContextFileWithRelations = PromptContextFile & PromptContextFileRelations;
