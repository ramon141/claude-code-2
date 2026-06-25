export type ClaudeModelId =
  | 'claude-opus-4-8'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001'
  | 'claude-fable-5'

export type ClaudeModel = {
  id: ClaudeModelId
  label: string
}

export const CLAUDE_MODELS: ClaudeModel[] = [
  { id: 'claude-opus-4-8', label: 'Opus 4.8' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5' },
  { id: 'claude-fable-5', label: 'Fable 5' },
]
