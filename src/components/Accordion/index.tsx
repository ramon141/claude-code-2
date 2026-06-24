import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'

interface AccordionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export default function Accordion({ title, children, className }: AccordionProps) {
  const [open, setOpen] = useState(true)

  return (
    <div className={cn('mb-2 p-4 border border-gray-200 rounded-lg shadow-sm', className)}>
      <div className="flex justify-between items-center mb-2">
        <h6 className="text-base font-semibold">{open ? '' : title}</h6>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          open ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {children}
      </div>
    </div>
  )
}
