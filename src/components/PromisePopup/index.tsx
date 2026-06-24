import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, X } from 'lucide-react'
import Spinner from '../ui/Spinner'
import { useLoading } from '../../contexts/LoadingContext'

const PRIMARY = '#003D68'

const LoadingPopup: React.FC = () => {
  const { isOpen, handleClose, type, message } = useLoading()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, handleClose])

  if (!isOpen) return null

  const config = {
    loading: { icon: <Spinner size="lg" />, bg: '#ffa000', label: 'Carregando' },
    success: { icon: <CheckCircle className="w-16 h-16 text-white" />, bg: PRIMARY, label: message as string },
    error: { icon: <X className="w-16 h-16 text-white" />, bg: '#ed2626', label: message as string },
  }

  const current = config[type as keyof typeof config] ?? config.error

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="bg-white rounded-[20px] w-[400px] max-w-[90%] p-8 flex flex-col items-center justify-center text-center shadow-xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-full p-4 flex items-center justify-center mb-5" style={{ backgroundColor: current.bg }}>
          {current.icon}
        </div>

        <p className="font-bold text-xl my-5">{current.label}</p>

        <button
          type="button"
          onClick={handleClose}
          className="text-black font-medium hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
        >
          Ok
        </button>
      </div>
    </div>,
    document.body
  )
}

export default LoadingPopup
