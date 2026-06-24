import type { SlashCommand } from '../constants/slashCommands'

interface Props {
  commands: SlashCommand[]
  activeIndex: number
  onSelect: (command: SlashCommand) => void
  onHover: (index: number) => void
}

export default function SlashCommandMenu({ commands, activeIndex, onSelect, onHover }: Props) {
  if (commands.length === 0) return null

  return (
    <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-[#2A2A2A] border border-[#3A3A3A] rounded-xl overflow-hidden shadow-xl z-10">
      {commands.map((item, index) => (
        <button
          key={item.command}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            onSelect(item)
          }}
          onMouseEnter={() => onHover(index)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-left transition-colors ${
            index === activeIndex ? 'bg-[#D97757]/20' : 'hover:bg-[#3A3A3A]/40'
          }`}
        >
          <span className="text-[#F5F5F5] text-sm font-mono">{item.command}</span>
          <span className="text-[#9A9A9A] text-xs truncate">{item.description}</span>
        </button>
      ))}
    </div>
  )
}
