import React, { useState } from 'react'
import { Copy, ExternalLink, RefreshCw, Check } from 'lucide-react'
import { useSetupControllerNgrokUrl } from '../../../../api/generated/api'

const COPY_FEEDBACK_MS = 1500

const NgrokUrlDisplay: React.FC = () => {
  const { data, isLoading, refetch, isFetching } = useSetupControllerNgrokUrl()
  const [copied, setCopied] = useState(false)
  const url = data?.url ?? ''

  const copy = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
  }

  if (isLoading) {
    return <p className="text-[#9A9A9A] text-sm mt-3">Consultando URL pública...</p>
  }

  if (!url) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <p className="text-[#9A9A9A] text-sm">Túnel ainda não disponível. Reinicie a API e aguarde.</p>
        <RefreshButton onClick={() => void refetch()} spinning={isFetching} />
      </div>
    )
  }

  return (
    <div className="mt-3 flex items-center gap-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg px-3 py-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0 text-[#D97757] text-sm truncate hover:underline"
        title={url}
      >
        {url}
      </a>
      <IconButton onClick={() => void copy()} title="Copiar">
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </IconButton>
      <a href={url} target="_blank" rel="noreferrer" title="Abrir" className="p-1.5 text-[#9A9A9A] hover:text-[#F5F5F5] rounded-lg transition-colors">
        <ExternalLink className="w-4 h-4" />
      </a>
      <RefreshButton onClick={() => void refetch()} spinning={isFetching} />
    </div>
  )
}

const IconButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
  <button type="button" onClick={onClick} title={title} className="p-1.5 text-[#9A9A9A] hover:text-[#F5F5F5] rounded-lg transition-colors">
    {children}
  </button>
)

const RefreshButton: React.FC<{ onClick: () => void; spinning: boolean }> = ({ onClick, spinning }) => (
  <IconButton onClick={onClick} title="Atualizar">
    <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
  </IconButton>
)

export default NgrokUrlDisplay
