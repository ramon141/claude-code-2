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
    <div className="min-h-screen bg-[#1A1A1A]">
      <div className="border-b border-[#3A3A3A] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-[#9A9A9A] hover:text-[#F5F5F5] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[#F5F5F5] font-semibold">Projetos</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D97757]/10 hover:bg-[#D97757]/20 border border-[#D97757]/30 rounded-lg text-[#D97757] text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-[#2A2A2A] rounded-xl border border-[#3A3A3A] overflow-hidden">
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
