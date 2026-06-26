import { useState, useRef, useEffect } from 'react'

interface Props {
  text: string
  children: React.ReactNode
  position?: 'top' | 'bottom'
  align?: 'left' | 'center' | 'right'
}

const ALIGN_CLASS: Record<NonNullable<Props['align']>, string> = {
  left: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
}

export function Tooltip({ text, children, position = 'bottom', align = 'center' }: Props) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible) return
    const hide = () => setVisible(false)
    document.addEventListener('scroll', hide, true)
    return () => document.removeEventListener('scroll', hide, true)
  }, [visible])

  const posClass = position === 'top'
    ? 'bottom-full mb-2'
    : 'top-full mt-2'

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute ${posClass} ${ALIGN_CLASS[align]} z-50 whitespace-nowrap px-2 py-1 rounded-md text-xs text-white bg-gray-800 border border-white/10 shadow-lg pointer-events-none`}
        >
          {text}
        </div>
      )}
    </div>
  )
}
