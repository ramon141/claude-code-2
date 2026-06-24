import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export function useModalAnimation(isOpen: boolean, duration = 220) {
  const [mounted, setMounted] = useState(isOpen)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // flushSync força o React a commitar mounted=true de forma síncrona
      // para que o browser pinte o estado inicial (invisible) antes de
      // setVisible(true) disparar a transição CSS
      flushSync(() => setMounted(true))
      const t = setTimeout(() => setVisible(true), 16)
      return () => clearTimeout(t)
    } else {
      setVisible(false)
      const t = setTimeout(() => setMounted(false), duration)
      return () => clearTimeout(t)
    }
  }, [isOpen, duration])

  return { mounted, visible }
}
