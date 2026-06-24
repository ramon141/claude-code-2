export interface SlashCommand {
  command: string
  description: string
}

// Comandos do Claude CLI que funcionam em print mode (--print) via fila.
// Comandos interativos (/status, /model, /help, /config) foram omitidos
// porque retornam "isn't available in this environment".
export const SLASH_COMMANDS: SlashCommand[] = [
  { command: '/compact', description: 'Comprime o histórico da sessão' },
  { command: '/context', description: 'Mostra o uso de contexto' },
  { command: '/cost', description: 'Mostra o consumo da sessão' },
  { command: '/usage', description: 'Mostra os limites de uso' },
  { command: '/clear', description: 'Limpa o contexto (reseta a sessão)' },
]

export const SLASH_TRIGGER = '/'

export function filterSlashCommands(query: string): SlashCommand[] {
  const normalized = query.toLowerCase()
  return SLASH_COMMANDS.filter((item) => item.command.startsWith(normalized))
}
