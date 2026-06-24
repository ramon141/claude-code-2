import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import Spinner from '../ui/Spinner'
import { useModalAnimation } from '../../hooks/useModalAnimation'

interface ModalDesktopProps {
  isOpen: boolean
  handleClose: () => void
  title?: string
  children: React.ReactNode
  sx?: object
  useCloser?: boolean
  isLoading?: boolean
}

export default function ModalDesktop({
  isOpen, handleClose, title, children, useCloser = true, isLoading = false,
}: ModalDesktopProps) {
  const { mounted, visible } = useModalAnimation(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleClose])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-220',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Panel */}
      <div className="fixed inset-0 overflow-auto flex items-start justify-center p-4 pt-16">
        <div className={cn(
          'relative bg-white rounded-2xl shadow-dropdown w-fit max-w-[90%] max-h-[80vh] overflow-auto p-6 flex flex-col',
          'transition-all duration-220',
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2'
        )}>
          <div className="flex items-center justify-between mb-5 gap-4">
            <h2 className="text-heading text-slate-800 flex-1">{title}</h2>
            {useCloser && (
              <button
                type="button"
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-danger-light hover:text-danger transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Spinner className="border-primary border-t-transparent" size="md" />
            </div>
          ) : children}
        </div>
      </div>
    </div>,
    document.body
  )
}
