import useDimensions from '../../hooks/useDimensions'
import ModalDesktop from './ModalDesktop'
import ModalBottom from './ModalBottom'
import type { ModalRegisterProps } from './types'

export default function ModalRegister(props: ModalRegisterProps) {
  const { width } = useDimensions()
  const isMobile = width < 900

  return isMobile ? <ModalBottom {...props} /> : <ModalDesktop {...props} />
}
