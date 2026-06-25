import React, { useState } from 'react'
import { Copy, Globe, Check } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { extractErrorMessage, type ApiError } from '../errorMessage'
import { useSetupControllerGenerateNgrokWebhook } from '../../../api/generated/api'
import type { SetupControllerGenerateNgrokWebhookBody } from '../../../api/generated/models'

interface NgrokWebhookProps {
  getValues: () => SetupControllerGenerateNgrokWebhookBody
}

const COPY_RESET_MS = 2000

const NgrokWebhook: React.FC<NgrokWebhookProps> = ({ getValues }) => {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [apiError, setApiError] = useState('')
  const [copied, setCopied] = useState(false)
  const { mutateAsync, isPending } = useSetupControllerGenerateNgrokWebhook()

  const generate = async () => {
    setApiError('')
    try {
      const res = await mutateAsync({ data: getValues() })
      setWebhookUrl(res.webhookUrl)
    } catch (error) {
      setApiError(extractErrorMessage(error as ApiError))
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), COPY_RESET_MS)
  }

  return (
    <div className="flex flex-col gap-2 border-t border-claude-border pt-4">
      <Button type="button" variant="secondary" onClick={generate} loading={isPending}>
        <Globe className="w-4 h-4" /> Gerar URL Webhook usando Ngrok
      </Button>
      {apiError && <p className="text-red-400 text-xs">{apiError}</p>}
      {webhookUrl && (
        <div className="flex items-center gap-2 bg-claude-surface border border-claude-border rounded-lg px-3 py-2">
          <span className="text-claude-muted text-xs break-all flex-1">{webhookUrl}</span>
          <button type="button" onClick={copy} className="text-claude-muted hover:text-claude-text shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
      {webhookUrl && <p className="text-green-400 text-xs">Webhook registrado na Evolution (evento MESSAGES_UPSERT).</p>}
    </div>
  )
}

export default NgrokWebhook
