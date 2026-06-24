import {repository} from '@loopback/repository';
import {HttpErrors, Response, RestBindings, del, get, getModelSchemaRef, param, patch, post, requestBody, response} from '@loopback/rest';
import {inject} from '@loopback/core';
import {Project} from '../models';
import {ProjectRepository} from '../repositories';
import path from 'path';

type CreateProjectBody = {name: string; workDir: string; memory?: string | null};
type PatchProjectBody = {name?: string; workDir?: string; memory?: string | null};

function validateWorkDir(workDir: string): void {
  if (workDir.includes('\0')) {
    throw new HttpErrors.UnprocessableEntity('Path inválido: contém null byte');
  }
  if (!path.isAbsolute(workDir)) {
    throw new HttpErrors.UnprocessableEntity('workDir deve ser um caminho absoluto');
  }
  const segments = workDir.replace(/\\/g, '/').split('/');
  if (segments.some(s => s === '..')) {
    throw new HttpErrors.UnprocessableEntity('Path traversal não permitido em workDir');
  }
}

export class ProjectsController {
  constructor(
    @repository(ProjectRepository) private projectRepo: ProjectRepository,
  ) {}

  @post('/projects')
  @response(201, {
    description: 'Project criado',
    content: {'application/json': {schema: getModelSchemaRef(Project)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name', 'workDir'],
            additionalProperties: false,
            properties: {
              name: {type: 'string'},
              workDir: {type: 'string'},
              memory: {type: 'string', nullable: true},
            },
          },
        },
      },
    })
    body: CreateProjectBody,
    @inject(RestBindings.Http.RESPONSE) res: Response,
  ): Promise<Project> {
    res.status(201);
    validateWorkDir(body.workDir);
    const existing = await this.projectRepo.findOne({where: {name: body.name}});
    if (existing) {
      throw new HttpErrors.UnprocessableEntity(`Project "${body.name}" already exists`);
    }
    return this.projectRepo.create(
      new Project({
        name: body.name,
        workDir: body.workDir,
        memory: body.memory ?? null,
        createdAt: new Date().toISOString(),
      }),
    );
  }

  @get('/projects')
  @response(200, {
    description: 'Lista de projects',
    content: {
      'application/json': {
        schema: {type: 'array', items: getModelSchemaRef(Project)},
      },
    },
  })
  async find(): Promise<Project[]> {
    return this.projectRepo.find({order: ['createdAt DESC']});
  }

  @get('/projects/{id}')
  @response(200, {
    description: 'Project por id',
    content: {'application/json': {schema: getModelSchemaRef(Project)}},
  })
  async findById(@param.path.number('id') id: number): Promise<Project> {
    const project = await this.projectRepo.findById(id).catch(() => null);
    if (!project) throw new HttpErrors.NotFound(`Project ${id} not found`);
    return project;
  }

  @patch('/projects/{id}')
  @response(200, {
    description: 'Project atualizado',
    content: {'application/json': {schema: getModelSchemaRef(Project)}},
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              name: {type: 'string'},
              workDir: {type: 'string'},
              memory: {type: 'string', nullable: true},
            },
          },
        },
      },
    })
    body: PatchProjectBody,
  ): Promise<Project> {
    const project = await this.projectRepo.findById(id).catch(() => null);
    if (!project) throw new HttpErrors.NotFound(`Project ${id} not found`);
    const update: Partial<Project> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.workDir !== undefined) {
      validateWorkDir(body.workDir);
      update.workDir = body.workDir;
    }
    if (body.memory !== undefined) update.memory = body.memory;
    await this.projectRepo.updateById(id, update);
    return this.projectRepo.findById(id);
  }

  @del('/projects/{id}')
  @response(204, {description: 'Project deletado'})
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    const project = await this.projectRepo.findById(id).catch(() => null);
    if (!project) throw new HttpErrors.NotFound(`Project ${id} not found`);
    await this.projectRepo.deleteById(id);
  }
}
