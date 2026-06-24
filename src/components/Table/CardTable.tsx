import React from 'react'
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { TableColumn } from './types'

interface CardTableProps {
  columns: TableColumn[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  totalPages: number
  onPageChange: (page: number) => void
  currentPage: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDelete?: ((rowData: any) => void) | false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit?: ((rowData: any) => void) | false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnsPos?: any[]
  isLoading?: boolean
}

const CardTable: React.FC<CardTableProps> = ({
  columns, data, totalPages, onPageChange, currentPage, onDelete, onEdit, columnsPos, isLoading = false,
}) => {
  if (isLoading) {
    return <div className="px-5 py-8 text-center text-slate-400 text-sm">Carregando...</div>
  }

  if (data.length === 0) {
    return <div className="px-5 py-10 text-center text-slate-400 text-sm">Nenhum resultado encontrado</div>
  }

  const dataColumns = columns.filter((col) => col.Header !== 'Ações')
  const actionsColumn = columns.find((col) => col.Header === 'Ações')
  const hasActions = !!(actionsColumn?.Cell || onEdit || onDelete || columnsPos?.length)

  return (
    <div>
      <div className="p-4 flex flex-col gap-3">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {data.map((rowData: any, rowIndex: number) => (
          <div key={rowIndex} className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
            <div className="divide-y divide-border">
              {dataColumns.map((column, colIndex) => {
                const cellValue = column.Cell
                  ? column.Cell({ value: rowData[column.accessor], row: { original: rowData } })
                  : rowData[column.accessor]

                return (
                  <div key={colIndex} className="flex items-center justify-between gap-4 px-4 py-3">
                    <span className="text-sm font-medium text-slate-500 whitespace-nowrap">{column.Header}</span>
                    <span className="text-sm text-slate-800 text-right">{cellValue}</span>
                  </div>
                )
              })}

              {hasActions && (
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-sm font-medium text-slate-500">Ações</span>
                  <div className="flex items-center gap-1">
                    {actionsColumn?.Cell && actionsColumn.Cell({ value: rowData[actionsColumn.accessor], row: { original: rowData } })}
                    {onEdit && (
                      <button type="button" onClick={() => onEdit(rowData)}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button type="button" onClick={() => onDelete(rowData)}
                        className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {columnsPos?.map((col: any, idx: number) => (
                      <button key={idx} type="button" onClick={() => col.onClick?.(rowData)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        {col.Cell ? col.Cell({ value: rowData[col.accessor], row: { original: rowData } }) : null}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 flex items-center justify-end gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-slate-400 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-slate-500 font-medium min-w-[60px] text-center">
          {currentPage} / {totalPages}
        </span>
        <button type="button" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-slate-400 hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default CardTable
