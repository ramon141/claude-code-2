import { useQueryClient } from '@tanstack/react-query'
import {
  useProjectsControllerFind,
  useProjectsControllerCreate,
  useProjectsControllerUpdateById,
  useProjectsControllerDeleteById,
  getProjectsControllerFindQueryKey,
} from '../../../api/generated/api'
import type {
  ProjectsControllerCreateBody,
  ProjectsControllerUpdateByIdBody,
} from '../../../api/generated/models'

export function useProjects() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getProjectsControllerFindQueryKey() })

  const { data: projects = [], isLoading } = useProjectsControllerFind()

  const { mutateAsync: createProject, isLoading: isCreating } = useProjectsControllerCreate({
    mutation: { onSuccess: invalidate },
  })

  const { mutateAsync: updateProject, isLoading: isUpdating } = useProjectsControllerUpdateById({
    mutation: { onSuccess: invalidate },
  })

  const { mutateAsync: deleteProject, isLoading: isDeleting } = useProjectsControllerDeleteById({
    mutation: { onSuccess: invalidate },
  })

  const handleCreate = (data: ProjectsControllerCreateBody) =>
    createProject({ data })

  const handleUpdate = (id: number, data: ProjectsControllerUpdateByIdBody) =>
    updateProject({ id, data })

  const handleDelete = (id: number) =>
    deleteProject({ id })

  return {
    projects,
    isLoading,
    createProject: handleCreate,
    isCreating,
    updateProject: handleUpdate,
    isUpdating,
    deleteProject: handleDelete,
    isDeleting,
  }
}
