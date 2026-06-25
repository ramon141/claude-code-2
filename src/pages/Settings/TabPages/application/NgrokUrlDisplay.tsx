import React, { useEffect, useState } from 'react'
import { Copy, ExternalLink, RefreshCw, Check } from 'lucide-react'
import { useSetupControllerNgrokUrl } from '../../../../api/generated/api'

const COPY_FEEDBACK_MS = 1500
const POLL_INTERVAL_MS = 2000

interface NgrokUrlDisplayProps {
  polling?: boolean
  expectedDomain?: string
  onUrlReady?: () => void
}

const NgrokUrlDisplay: React.FC<NgrokUrlDisplayProps> = ({ polling = false, expectedDomain, onUrlReady }) => {
  const { data, isLoading, refetch, isFetching } = useSetupControllerNgrokUrl({
    query: { refetchInterval: polling ? POLL_INTERVAL_MS : false },
  })
  const [copied, setCopied] = useState(false)
  const url = data?.url ?? ''

  useEffect(() => {
    if (!polling || !url || !onUrlReady) return
    const domainMatches = !expectedDomain || url.includes(expectedDomain)
    if (domainMatches) onUrlReady()
  }, [polling, url, expectedDomain, onUrlReady])

  const copy = async () => {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
  }

  if (isLoading || (polling && !url)) {
    return (
      <div className="mt-3 flex items-center gap-2 text-claude-muted text-sm">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Aguardando ngrok iniciar...</span>
      </div>
    )
  }

  if (!url) {
    return (
      <div className="mt-3 flex items-center gap-2">
        <p className="text-claude-muted text-sm">Túnel ainda não disponível. Reinicie a API e aguarde.</p>
        <RefreshButton onClick={() => void refetch()} spinning={isFetching} />
      </div>
    )
  }

  return (
    <div className="mt-3 flex items-center gap-2 bg-claude-bg border border-claude-border rounded-lg px-3 py-2">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="flex-1 min-w-0 text-claude-primary text-sm truncate hover:underline"
        title={url}
      >
        {url}
      </a>
      <IconButton onClick={() => void copy()} title="Copiar">
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </IconButton>
      <a href={url} target="_blank" rel="noreferrer" title="Abrir" className="p-1.5 text-claude-muted hover:text-claude-text rounded-lg transition-colors">
        <ExternalLink className="w-4 h-4" />
      </a>
      <RefreshButton onClick={() => void refetch()} spinning={isFetching} />
    </div>
  )
}

const IconButton: React.FC<{ onClick: () => void; title: string; children: React.ReactNode }> = ({ onClick, title, children }) => (
  <button type="button" onClick={onClick} title={title} className="p-1.5 text-claude-muted hover:text-claude-text rounded-lg transition-colors">
    {children}
  </button>
)

const RefreshButton: React.FC<{ onClick: () => void; spinning: boolean }> = ({ onClick, spinning }) => (
  <IconButton onClick={onClick} title="Atualizar">
    <RefreshCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
  </IconButton>
)

export default NgrokUrlDisplay
