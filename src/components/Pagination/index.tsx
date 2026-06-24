import React from 'react'
import { cn } from '../../lib/utils'
import useDimensions from '../../hooks/useDimensions'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

interface PageButtonProps {
  selected?: boolean
  isNext?: boolean
  isEllipsis?: boolean
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  ariaLabel?: string
}

const PageButton: React.FC<PageButtonProps> = ({
  selected, isNext, isEllipsis, disabled, onClick, children, ariaLabel,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    className={cn(
      'min-w-[36px] h-9 px-1 mx-0.5 rounded-lg text-body font-medium transition-colors',
      selected && 'bg-primary text-white shadow-sm',
      isNext && !selected && 'bg-primary-light text-primary hover:bg-primary/20',
      isEllipsis && 'bg-transparent text-muted cursor-default',
      !selected && !isNext && !isEllipsis && 'bg-slate-100 text-slate-500 hover:bg-slate-200',
      disabled && 'opacity-40 cursor-not-allowed',
    )}
  >
    {children}
  </button>
)

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const { width } = useDimensions()
  const isMobile = width < 640

  const renderPageButtons = () => {
    const maxVisible = isMobile ? 3 : 7
    const buttons: React.ReactNode[] = []

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(
          <PageButton key={i} selected={i === currentPage} isNext={i === currentPage + 1} onClick={() => onPageChange(i)}>
            {i}
          </PageButton>
        )
      }
      return buttons
    }

    buttons.push(
      <PageButton key={1} selected={1 === currentPage} isNext={1 === currentPage + 1} onClick={() => onPageChange(1)}>1</PageButton>
    )

    const side = Math.floor((maxVisible - 3) / 2)

    if (currentPage <= side + 2) {
      const end = Math.min(2 + maxVisible - 3, totalPages - 1)
      for (let i = 2; i <= end; i++) {
        buttons.push(<PageButton key={i} selected={i === currentPage} isNext={i === currentPage + 1} onClick={() => onPageChange(i)}>{i}</PageButton>)
      }
      if (end < totalPages - 1) buttons.push(<PageButton key="e1" isEllipsis disabled>...</PageButton>)
    } else if (currentPage >= totalPages - side - 1) {
      if (2 < totalPages - maxVisible + 2) buttons.push(<PageButton key="e0" isEllipsis disabled>...</PageButton>)
      const start = Math.max(totalPages - maxVisible + 2, 2)
      for (let i = start; i <= totalPages - 1; i++) {
        buttons.push(<PageButton key={i} selected={i === currentPage} isNext={i === currentPage + 1} onClick={() => onPageChange(i)}>{i}</PageButton>)
      }
    } else {
      buttons.push(<PageButton key="e0" isEllipsis disabled>...</PageButton>)
      for (let i = Math.max(currentPage - side, 2); i <= Math.min(currentPage + side, totalPages - 1); i++) {
        buttons.push(<PageButton key={i} selected={i === currentPage} isNext={i === currentPage + 1} onClick={() => onPageChange(i)}>{i}</PageButton>)
      }
      if (currentPage + side < totalPages - 1) buttons.push(<PageButton key="e1" isEllipsis disabled>...</PageButton>)
    }

    buttons.push(
      <PageButton key={totalPages} selected={totalPages === currentPage} isNext={totalPages === currentPage + 1} onClick={() => onPageChange(totalPages)}>{totalPages}</PageButton>
    )

    return buttons
  }

  return (
    <div className="flex justify-end items-center mt-4 flex-wrap gap-1">
      <PageButton disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} ariaLabel="Página anterior">&lt;</PageButton>
      {renderPageButtons()}
      <PageButton disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} ariaLabel="Próxima página">&gt;</PageButton>
    </div>
  )
}

export default Pagination
