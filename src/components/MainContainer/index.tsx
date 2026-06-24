import React from 'react'
import { cn } from '../../lib/utils'

interface MainContainerProps {
  children: React.ReactNode
  className?: string
}

const MainContainer: React.FC<MainContainerProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 shadow-card rounded-lg p-4 sm:gap-2 sm:p-3',
        className
      )}
    >
      {children}
    </div>
  )
}

export default MainContainer
