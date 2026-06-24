import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'
import { useModalAnimation } from '../../hooks/useModalAnimation'
import type { ConfirmPopupProps } from './types'

const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
  isOpen, handleClose, onConfirm,
  title = 'Tem certeza?',
  message = 'Esta ação não pode ser desfeita.',
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
      <div
        onClick={handleClose}
        className={cn(
          'fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-220',
          visible ? 'opacity-100' : 'opacity-0'
        )}
      />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className={cn(
          'relative bg-white rounded-2xl w-[380px] max-w-full p-6 shadow-dropdown',
          'transition-all duration-220',
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'
        )}>
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-warning-light flex items-center justify-center mb-4">
              <TriangleAlert className="w-7 h-7 text-warning" />
            </div>

            <p className="text-heading text-slate-800 mb-2">{title}</p>
            <p className="text-body text-muted mb-6">{message}</p>

            <div className="flex flex-col gap-2 w-full">
              <Button variant="danger" size="md" className="w-full" onClick={onConfirm}>
                Sim, confirmar
              </Button>
              <Button variant="ghost" size="md" className="w-full" onClick={handleClose}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmPopup
