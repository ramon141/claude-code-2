import React from 'react'
import { Search, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useDimensions from '../../hooks/useDimensions'
import MobileActionsFab from './MobileActionsFab'
import { Button } from '../ui/Button'
import type { ActionItem } from './types'

interface TableToolbarProps {
  searchEnabled?: boolean
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  filterEnabled?: boolean
  onFilterClick?: () => void
  actions?: ActionItem[]
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  searchEnabled = true, searchPlaceholder = 'Buscar', searchValue, onSearchChange,
  filterEnabled = false, onFilterClick, actions = [],
}) => {
  const navigate = useNavigate()
  const { width } = useDimensions()
  const isMobile = width < 640

  const handleActionClick = (item: ActionItem) => {
    if (item.onClick) item.onClick()
    else if (item.path) navigate(item.path)
  }

  if (!searchEnabled && !filterEnabled && actions.length === 0) return null

  return (
    <>
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border">
        <div />
        <div className="flex items-center gap-2">
          {searchEnabled && (
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                className="w-full h-8 pl-8 pr-3 bg-white border border-border rounded-lg text-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 hover:border-slate-300 transition-all placeholder:text-muted"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          )}
          {filterEnabled && (
            <Button variant="secondary" size="sm" onClick={onFilterClick}>
              <Filter className="w-3.5 h-3.5" />
              Filtros
            </Button>
          )}
          {!isMobile && actions.map((item, index) => {
            const IconComponent = item.icon
            return (
              <Button key={index} variant="primary" size="sm" disabled={item.disabled} onClick={() => handleActionClick(item)}>
                {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
                {item.label}
              </Button>
            )
          })}
        </div>
      </div>
      {isMobile && <MobileActionsFab actions={actions} />}
    </>
  )
}

export default TableToolbar
