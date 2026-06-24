import React, { useState, useMemo } from 'react'
import { useTable, usePagination, useSortBy, useRowSelect } from 'react-table'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'
import useDimensions from '../../hooks/useDimensions'
import type { TableProps } from './types'
import TableToolbar from './TableToolbar'
import CardTable from './CardTable'

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

const DataTable: React.FC<TableProps> = ({
  columns, data, pageSize = 10, width = '100%', showToolbar = true,
  searchEnabled = true, searchPlaceholder = 'Buscar', onSearchChange,
  filterEnabled = false, onFilterClick, actions = [],
}) => {
  const { width: windowWidth } = useDimensions()
  const isMobile = windowWidth < 900
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredData = useMemo(() => {
    if (onSearchChange) return data
    return filterDataBySearch(data, searchTerm, columns)
  }, [data, searchTerm, columns, onSearchChange])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    if (onSearchChange) onSearchChange(value)
  }

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const {
    getTableProps, getTableBodyProps, headerGroups, page,
    prepareRow, nextPage, previousPage, canNextPage, canPreviousPage, pageOptions, state,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useTable({ columns, data: filteredData, initialState: { pageSize } as any }, useSortBy, usePagination, useRowSelect) as any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { pageIndex } = state as any

  if (isMobile) {
    return (
      <div className="w-full">
        {showToolbar && (
          <TableToolbar searchEnabled={searchEnabled} searchPlaceholder={searchPlaceholder} searchValue={searchTerm}
            onSearchChange={handleSearchChange} filterEnabled={filterEnabled} onFilterClick={onFilterClick} actions={actions} />
        )}
        <CardTable columns={columns} data={paginatedData} totalPages={totalPages || 1} currentPage={currentPage} onPageChange={setCurrentPage} />
      </div>
    )
  }

  const tableContent = (
    <>
      <div className="overflow-x-auto">
        <table {...getTableProps()} style={{ width, borderCollapse: 'collapse' }}>
          <thead>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {headerGroups.map((hg: any, i: number) => (
              <tr {...hg.getHeaderGroupProps()} key={i} className="border-b border-border">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {hg.headers.map((col: any, ci: number) => (
                  <th {...col.getHeaderProps(col.getSortByToggleProps())} key={ci}
                    className="text-left px-5 h-9 text-xs font-semibold text-slate-400 uppercase tracking-wide whitespace-nowrap select-none">
                    <span className="flex items-center gap-1">
                      {col.render('Header')}
                      {col.isSorted
                        ? col.isSortedDesc
                          ? <ChevronDown className="w-3 h-3" />
                          : <ChevronUp className="w-3 h-3" />
                        : null}
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {page.map((row: any, i: number) => {
              prepareRow(row)
              return (
                <tr {...row.getRowProps()} key={i}
                  className="border-b border-border last:border-0 hover:bg-slate-50/80 transition-colors">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {row.cells.map((cell: any, ci: number) => (
                    <td {...cell.getCellProps()} key={ci}
                      className="text-left px-5 h-12 text-sm text-slate-600">
                      {cell.render('Cell')}
                    </td>
                  ))}
                </tr>
              )
            })}
            {page.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-slate-400 text-sm">
                  Nenhum resultado encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 flex items-center justify-between border-t border-border">
        <span className="text-xs text-slate-400 font-medium">{filteredData.length} registro{filteredData.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-2">
          <button onClick={previousPage} disabled={!canPreviousPage}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-slate-400 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-slate-500 font-medium min-w-[60px] text-center">
            {pageIndex + 1} / {pageOptions.length || 1}
          </span>
          <button onClick={nextPage} disabled={!canNextPage}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-slate-400 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )

  if (!showToolbar) return <div className="w-full">{tableContent}</div>

  return (
    <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
      <TableToolbar searchEnabled={searchEnabled} searchPlaceholder={searchPlaceholder} searchValue={searchTerm}
        onSearchChange={handleSearchChange} filterEnabled={filterEnabled} onFilterClick={onFilterClick} actions={actions} />
      {tableContent}
    </div>
  )
}

export { TableToolbar }
export default DataTable
