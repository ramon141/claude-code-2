import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'
import type { ActionItem } from './types'

interface MobileActionsFabProps {
  actions: ActionItem[]
}

const MobileActionsFab: React.FC<MobileActionsFabProps> = ({ actions }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleActionClick = (item: ActionItem) => {
    if (item.onClick) item.onClick()
    else if (item.path) navigate(item.path)
    setOpen(false)
  }

  if (actions.length === 0) return null

  if (actions.length === 1) {
    const single = actions[0] as ActionItem
    const IconComponent = single.icon

    return (
      <button
        aria-label={single.label}
        onClick={() => handleActionClick(single)}
        disabled={single.disabled}
        className="fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 transition-colors"
      >
        {IconComponent ? <IconComponent size={24} /> : <Plus className="w-6 h-6" />}
      </button>
    )
  }

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/20 z-[998]" onClick={() => setOpen(false)} />}

      <div className="fixed bottom-[90px] right-6 flex flex-col items-end gap-3 z-[1001]">
        {actions.map((action, index) => {
          const IconComponent = action.icon
          const reverseIndex = actions.length - 1 - index

          return (
            <button
              key={index}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled}
              className={cn(
                'flex items-center gap-2 rounded-3xl px-5 py-2 text-sm font-medium bg-primary text-white shadow-lg hover:bg-primary-hover disabled:opacity-50 transition-all duration-200',
                open ? 'opacity-100 translate-x-0 pointer-events-auto' : 'opacity-0 translate-x-5 pointer-events-none'
              )}
              style={{ transitionDelay: `${reverseIndex * 50}ms` }}
            >
              {IconComponent && <IconComponent size={16} />}
              {action.label}
            </button>
          )
        })}
      </div>

      <button
        aria-label="menu"
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 right-6 z-[1002] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300',
          open ? 'bg-white text-primary' : 'bg-primary text-white'
        )}
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </>
  )
}

export default MobileActionsFab
