import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useProjects } from './hooks/useProjects'
import ProjectModal from './components/ProjectModal'
import ProjectsTable from './components/ProjectsTable'
import type { Project } from '../../api/generated/models'

export default function Projects() {
  return <ProjectsContent />
}

function ProjectsContent() {
  const navigate = useNavigate()
  const { projects, isLoading, createProject, isCreating, updateProject, isUpdating, deleteProject, isDeleting } = useProjects()
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreate = async (data: { name: string; workDir: string; memory?: string | null }) => {
    await createProject({ name: data.name, workDir: data.workDir, memory: data.memory ?? null })
    setShowCreateModal(false)
  }

  const handleUpdate = async (data: { name: string; workDir: string; memory?: string | null }) => {
    if (!editingProject?.id) return
    await updateProject(editingProject.id, { name: data.name, workDir: data.workDir, memory: data.memory ?? null })
    setEditingProject(null)
  }

  const handleDelete = async (id: number) => {
    await deleteProject(id)
  }

  return (
    <div className="min-h-screen bg-claude-bg">
      <div className="border-b border-claude-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-claude-muted hover:text-claude-text transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-claude-text font-semibold">Projetos</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-claude-primary/10 hover:bg-claude-primary/20 border border-claude-primary/30 rounded-lg text-claude-primary text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-claude-surface rounded-xl border border-claude-border overflow-hidden">
          <ProjectsTable
            projects={projects}
            isLoading={isLoading}
            onEdit={setEditingProject}
            onDelete={handleDelete}
            isDeleting={isDeleting}
          />
        </div>
      </div>

      {showCreateModal && (
        <ProjectModal
          onConfirm={handleCreate}
          onClose={() => setShowCreateModal(false)}
          isLoading={isCreating}
        />
      )}

      {editingProject && (
        <ProjectModal
          project={editingProject}
          onConfirm={handleUpdate}
          onClose={() => setEditingProject(null)}
          isLoading={isUpdating}
        />
      )}
    </div>
  )
}
