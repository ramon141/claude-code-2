import { Pencil, Trash2, FolderOpen } from 'lucide-react'
import type { Project } from '../../../api/generated/models'

interface RowProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (id: number) => void
  isDeleting: boolean
}

function ProjectRow({ project, onEdit, onDelete, isDeleting }: RowProps) {
  return (
    <tr className="border-b border-claude-border last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-claude-primary/10 border border-claude-primary/20 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-3.5 h-3.5 text-claude-primary" />
          </div>
          <span className="text-sm text-claude-text font-medium">{project.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm font-mono text-claude-muted truncate max-w-xs">{project.workDir}</td>
      <td className="px-4 py-3 text-sm text-claude-muted">
        {project.createdAt ? new Date(project.createdAt).toLocaleDateString('pt-BR') : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => onEdit(project)}
            className="p-1.5 text-claude-muted hover:text-claude-text hover:bg-white/6 rounded-lg transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => project.id !== undefined && onDelete(project.id)}
            disabled={isDeleting}
            className="p-1.5 text-claude-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

interface Props {
  projects: Project[]
  isLoading: boolean
  onEdit: (project: Project) => void
  onDelete: (id: number) => void
  isDeleting: boolean
}

export default function ProjectsTable({ projects, isLoading, onEdit, onDelete, isDeleting }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="w-5 h-5 border-2 border-claude-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-xl bg-claude-surface border border-claude-border flex items-center justify-center mb-3">
          <FolderOpen className="w-6 h-6 text-claude-muted" />
        </div>
        <p className="text-claude-muted text-sm">Nenhum projeto ainda. Crie o primeiro!</p>
      </div>
    )
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-claude-border">
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Nome</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Diretório</th>
          <th className="text-left px-4 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Criado em</th>
          <th className="text-right px-4 py-2.5 text-xs font-semibold text-claude-muted uppercase tracking-wider">Ações</th>
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={isDeleting}
          />
        ))}
      </tbody>
    </table>
  )
}
