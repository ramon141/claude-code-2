import { useContext } from 'react'
import { HiHome, HiChevronRight } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'
import { BreadcrumbContext } from '../../contexts/BreadcrumbContext'
import type { BreadcrumbItem } from './types'

const Breadcrumb = () => {
  const navigate = useNavigate()
  const context = useContext(BreadcrumbContext)
  if (!context) return null
  const { breadcrumbItems } = context

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 mb-4 text-sm">
      <button
        onClick={() => navigate('/budget/list')}
        className="flex items-center text-gray-500 hover:text-primary transition-colors"
      >
        <HiHome className="w-4 h-4" />
      </button>

      {breadcrumbItems.map((item: BreadcrumbItem) => (
        <span key={item.path} className="flex items-center gap-1">
          <HiChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => navigate(item.path || '/')}
            className="text-gray-700 hover:text-primary transition-colors"
          >
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  )
}

export default Breadcrumb
