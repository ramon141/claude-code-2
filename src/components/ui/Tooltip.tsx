import React from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'

interface TooltipProps {
  title: string
  children: React.ReactNode
}

const Tooltip: React.FC<TooltipProps> = ({ title, children }) => {
  return (
    <RadixTooltip.Provider delayDuration={200}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          {children}
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            className="z-50 rounded bg-gray-800 px-2 py-1 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95"
            sideOffset={4}
          >
            {title}
            <RadixTooltip.Arrow className="fill-gray-800" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

export default Tooltip
