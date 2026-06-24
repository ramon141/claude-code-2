import React, { useEffect, useMemo, useState } from 'react'
import { PlusCircle, Pencil, Search } from 'lucide-react'
import { cn } from '../../lib/utils'
import DataTable from '../Table'
import MobileActionsFab from '../Table/MobileActionsFab'
import { Button } from '../ui/Button'
import useDimensions from '../../hooks/useDimensions'
import type { TableTabsProps } from './types'
import type { ActionItem } from '../Table/types'
import { useNavigate } from 'react-router-dom'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getOptions = (data: any[], fieldTabsName: string): string[] => {
  if (!data || !Array.isArray(data)) return []
  return data.reduce((acc: string[], item) => {
    const value = item[fieldTabsName] as string
    if (!acc.includes(value)) acc.push(value || 'Vazio')
    return acc
  }, [])
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterDataByTab = (data: any[], fieldTabsName: string, filter: string): any[] => {
  if (!data || !Array.isArray(data)) return []
  return data.filter((item) => filter === 'Todos' || item[fieldTabsName] === filter)
}

const normalizeString = (str: string): string =>
  (str || '').toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ç/g, 'c').toLowerCase()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const filterDataBySearch = (data: any[], searchTerm: string, columns: any[]): any[] => {
  if (!searchTerm) return data
  const normalized = normalizeString(searchTerm)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.filter((row: any) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns.some((col: any) => normalizeString(String(row[col.accessor] ?? '')).includes(normalized))
  )
}

const ToolbarActions: React.FC<{ actions: ActionItem[] }> = ({ actions }) => {
  const navigate = useNavigate()
  const handleClick = (item: ActionItem) => {
    if (item.onClick) item.onClick()
    else if (item.path) navigate(item.path)
  }
  return (
    <>
      {actions.map((item, i) => {
        const Icon = item.icon
        return (
          <Button key={i} variant="primary" size="sm" disabled={item.disabled} onClick={() => handleClick(item)}>
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {item.label}
          </Button>
        )
      })}
    </>
  )
}

const TableTabs: React.FC<TableTabsProps> = ({
  data, fieldTabsName, columns, tabsName: tabsNameTemp, defaultTab, pageSize, width = '100%',
  searchEnabled = true, searchPlaceholder, onSearchChange, filterEnabled = false, onFilterClick, actions = [],
  onAddTab, useAddTab = false, useEditTab = false,
}) => {
  const [filter, setFilter] = useState('Todos')
  const [activeTab, setActiveTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const { width: windowWidth } = useDimensions()
  const isMobile = windowWidth < 640

  const allOptions = useMemo(
    () => getOptions(data, fieldTabsName || '').sort((a, b) => a.localeCompare(b)),
    [data, fieldTabsName]
  )

  const filteredDataByTab = useMemo(() => {
    const byTab = filterDataByTab(data, fieldTabsName || '', filter)
    if (onSearchChange) return byTab
    return filterDataBySearch(byTab, searchTerm, columns)
  }, [data, fieldTabsName, filter, searchTerm, columns, onSearchChange])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    if (onSearchChange) onSearchChange(value)
  }

  const tabsName = tabsNameTemp || ['Todos', ...allOptions]

  const handleTabChange = (_event: React.SyntheticEvent | null, newValue: number) => {
    setActiveTab(newValue)
    const tabName = tabsName[newValue]
    if (tabName) setFilter(tabName)
  }

  useEffect(() => {
    const tabIndex = tabsName.indexOf(defaultTab || '')
    if (tabIndex !== -1) handleTabChange(null, tabIndex)
  }, [defaultTab])

  return (
    <>
    <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border">
        <span className="text-caption text-muted">{filteredDataByTab.length} registro{filteredDataByTab.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          {searchEnabled && (
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                className="w-full h-8 pl-8 pr-3 bg-white border border-border rounded-lg text-body text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 hover:border-slate-300 transition-all placeholder:text-muted"
                placeholder={searchPlaceholder || 'Buscar...'}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          )}
          {filterEnabled && (
            <Button variant="secondary" size="sm" onClick={onFilterClick}>Filtros</Button>
          )}
          {!isMobile && <ToolbarActions actions={actions} />}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 py-2.5 flex flex-wrap gap-1.5 border-b border-border">
        {tabsName.map((tab: string, index: number) => (
          <button key={index} type="button" onClick={() => handleTabChange(null, index)}
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-lg text-label transition-all',
              activeTab === index
                ? 'bg-primary text-white shadow-sm'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            )}
          >
            {tab || 'Vazio'}
            {tab !== 'Todos' && useAddTab && (
              <span onClick={() => onAddTab?.(tab)}><PlusCircle className="w-3.5 h-3.5" /></span>
            )}
            {tab !== 'Todos' && useEditTab && (
              <span onClick={() => onAddTab?.(tab)}><Pencil className="w-3.5 h-3.5" /></span>
            )}
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filteredDataByTab} pageSize={pageSize} width={width} showToolbar={false} />
    </div>

    {isMobile && <MobileActionsFab actions={actions} />}
  </>
  )
}

export default TableTabs
