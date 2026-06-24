import { useMask } from '@react-input/mask'
import { Input } from '../Input'

export default function InputPhone({ useForm, ...rest }: any) {
  const inputRef = useMask({
    mask: '(__) _____-____',
    replacement: { _: /\d/ },
  })

  return <Input inputRef={inputRef} {...rest} useForm={useForm} />
}