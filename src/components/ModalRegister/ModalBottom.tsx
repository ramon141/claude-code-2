import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import Spinner from '../ui/Spinner'
import { useModalAnimation } from '../../hooks/useModalAnimation'

interface ModalBottomProps {
  isOpen: boolean
  handleClose: () => void
  children: React.ReactNode
  isLoading?: boolean
  useCloser?: boolean
  title?: string
  sx?: object
}

const ModalBottom: React.FC<ModalBottomProps> = ({
  isOpen, handleClose, children, isLoading, useCloser = true, title,
}) => {
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

      {/* Bottom sheet */}
      <div className={cn(
        'fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-dropdown',
        'overflow-y-auto max-h-[85vh] min-h-[60vh]',
        'transition-transform duration-220 ease-out',
        visible ? 'translate-y-0' : 'translate-y-full'
      )}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-heading text-slate-800">{title}</h2>
          {useCloser && (
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-danger-light hover:text-danger transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Spinner className="border-primary border-t-transparent" size="md" />
            </div>
          ) : children}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ModalBottom
