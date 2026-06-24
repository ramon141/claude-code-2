import { useMask } from '@react-input/mask'
import { Input } from '../Input'

interface CNPJTextFieldProps {
  useForm: any;
  label?: string;
  [key: string]: any;
}

export default function CNPJTextField({ useForm, label = '', ...rest }: CNPJTextFieldProps) {
  const inputRef = useMask({
    mask: '__.___.___/____-__',
    replacement: { _: /\d/ },
  })

  return <Input inputRef={inputRef} label={label} {...rest} useForm={useForm} />
}