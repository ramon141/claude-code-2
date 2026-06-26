import type { ChatSessionsControllerGetPrompts200Item } from '../../../api/generated/models'

const SEPARATOR = '\n\n---\n\n'

function formatPrompt(prompt: ChatSessionsControllerGetPrompts200Item, index: number): string {
  const lines: string[] = [`# Mensagem ${index + 1}`]
  if (prompt.contextFiles?.length) {
    lines.push(`**Arquivos:** ${prompt.contextFiles.join(', ')}`)
  }
  lines.push(`## Prompt\n\n${prompt.content ?? ''}`)
  if (prompt.output) lines.push(`## Resposta\n\n${prompt.output}`)
  return lines.join('\n\n')
}

function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function useExportChat(
  chatName: string | undefined,
  prompts: ChatSessionsControllerGetPrompts200Item[],
) {
  const exportAsMarkdown = (): void => {
    if (!chatName || !prompts.length) return
    const sections = prompts.map(formatPrompt).join(SEPARATOR)
    downloadMarkdown(`${chatName}.md`, `# ${chatName}\n\n${sections}`)
  }

  return { exportAsMarkdown }
}
