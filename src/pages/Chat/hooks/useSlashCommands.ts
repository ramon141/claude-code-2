import { useEffect, useMemo, useState } from 'react'
import {
  SLASH_TRIGGER,
  filterSlashCommands,
  type SlashCommand,
} from '../constants/slashCommands'

interface UseSlashCommandsResult {
  open: boolean
  commands: SlashCommand[]
  activeIndex: number
  setActiveIndex: (index: number) => void
  moveSelection: (delta: number) => void
  resolveSelection: () => SlashCommand | null
}

function isTriggering(value: string): boolean {
  return value.startsWith(SLASH_TRIGGER) && !value.includes(' ')
}

export function useSlashCommands(value: string): UseSlashCommandsResult {
  const [activeIndex, setActiveIndex] = useState(0)

  const commands = useMemo(
    () => (isTriggering(value) ? filterSlashCommands(value) : []),
    [value],
  )
  const open = commands.length > 0

  useEffect(() => {
    setActiveIndex(0)
  }, [value])

  const moveSelection = (delta: number) => {
    setActiveIndex((prev) => {
      const total = commands.length
      if (total === 0) return 0
      return (prev + delta + total) % total
    })
  }

  const resolveSelection = (): SlashCommand | null => {
    if (!open) return null
    return commands[activeIndex] ?? commands[0] ?? null
  }

  return { open, commands, activeIndex, setActiveIndex, moveSelection, resolveSelection }
}
