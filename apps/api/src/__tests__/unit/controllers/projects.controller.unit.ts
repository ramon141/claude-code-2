import {expect, sinon} from '@loopback/testlab';
import {Response} from '@loopback/rest';
import {ProjectsController} from '../../../controllers/projects.controller';
import {ProjectRepository} from '../../../repositories';
import {Project} from '../../../models';

const mockRes = {status: sinon.stub().returnsThis()} as Partial<Response> as Response;

describe('ProjectsController (unit)', () => {
  let controller: ProjectsController;
  let projectRepo: sinon.SinonStubbedInstance<ProjectRepository>;

  const mockProject = (overrides: Partial<Project> = {}): Project =>
    new Project({
      id: 10,
      name: 'My Project',
      workDir: '/home/user/project',
      memory: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      ...overrides,
    });

  beforeEach(() => {
    projectRepo = sinon.createStubInstance(ProjectRepository);
    controller = new ProjectsController(projectRepo);
  });

  describe('create', () => {
    it('lança 422 se projeto com mesmo nome já existe', async () => {
      projectRepo.findOne.resolves(mockProject());

      await expect(
        controller.create({name: 'My Project', workDir: '/dir'}, mockRes),
      ).to.be.rejectedWith(/already exists/);
    });

    it('cria projeto quando nome não existe', async () => {
      projectRepo.findOne.resolves(null);
      projectRepo.create.resolves(mockProject());

      const result = await controller.create({name: 'My Project', workDir: '/dir'}, mockRes);

      expect(result).to.containEql({id: 10, name: 'My Project'});
    });
  });

  describe('findById', () => {
    it('lança 404 se projeto não encontrado', async () => {
      projectRepo.findById.rejects(new Error('Not found'));

      await expect(controller.findById(99)).to.be.rejectedWith(/not found/);
    });

    it('retorna projeto', async () => {
      projectRepo.findById.resolves(mockProject());

      const result = await controller.findById(10);

      expect(result).to.containEql({id: 10});
    });
  });

  describe('updateById', () => {
    it('lança 404 se projeto não existe ao atualizar', async () => {
      projectRepo.findById.rejects(new Error('Not found'));

      await expect(
        controller.updateById(99, {name: 'New Name'}),
      ).to.be.rejectedWith(/not found/);
    });

    it('atualiza e retorna projeto', async () => {
      const updated = mockProject({name: 'New Name'});
      projectRepo.findById.onFirstCall().resolves(mockProject());
      projectRepo.updateById.resolves();
      projectRepo.findById.onSecondCall().resolves(updated);

      const result = await controller.updateById(10, {name: 'New Name'});

      expect(result).to.containEql({name: 'New Name'});
    });
  });

  describe('deleteById', () => {
    it('lança 404 se projeto não existe ao deletar', async () => {
      projectRepo.findById.rejects(new Error('Not found'));

      await expect(controller.deleteById(99)).to.be.rejectedWith(/not found/);
    });

    it('deleta projeto', async () => {
      projectRepo.findById.resolves(mockProject());
      projectRepo.deleteById.resolves();

      await controller.deleteById(10);

      sinon.assert.calledWith(projectRepo.deleteById, 10);
    });
  });
});
