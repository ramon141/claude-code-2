import React, { useState } from 'react'
import { Phone } from 'lucide-react'
import { Button } from '../../../../components/ui/Button'
import { extractErrorMessage, type ApiError } from '../../../Setup/errorMessage'
import SectionCard from './SectionCard'
import { useSetupControllerConfigurePhones } from '../../../../api/generated/api'

interface PhoneAllowlistSectionProps {
  allowedPhones: string[]
}

const PHONE_SEPARATOR = '\n'

const PhoneAllowlistSection: React.FC<PhoneAllowlistSectionProps> = ({ allowedPhones }) => {
  const [value, setValue] = useState(allowedPhones.join(PHONE_SEPARATOR))
  const [apiError, setApiError] = useState('')
  const [saved, setSaved] = useState(false)
  const { mutateAsync, isPending } = useSetupControllerConfigurePhones()

  const onSave = async () => {
    setApiError('')
    setSaved(false)
    const list = value.split(PHONE_SEPARATOR).map((p) => p.trim()).filter((p) => p.length > 0)
    try {
      const result = await mutateAsync({ data: { phones: list } })
      setSaved(true)
      void result
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  }

  return (
    <SectionCard
      title="Telefones permitidos (WhatsApp)"
      description="Um número por linha (ex: 11999998888). Vazio = aceita qualquer número. Aplicado imediatamente."
      icon={<Phone className="w-5 h-5" />}
    >
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        spellCheck={false}
        placeholder="11999998888"
        className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-lg px-3 py-2 text-[#F5F5F5] text-sm font-mono outline-none focus:border-[#D97757] transition-colors placeholder:text-[#6A6A6A] resize-y"
      />
      {apiError && <p className="text-red-400 text-sm">{apiError}</p>}
      {saved && <p className="text-green-400 text-sm">Telefones salvos.</p>}
      <Button type="button" onClick={onSave} loading={isPending} className="self-end">
        Salvar
      </Button>
    </SectionCard>
  )
}

export default PhoneAllowlistSection
