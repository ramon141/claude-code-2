import { Sparkles } from 'lucide-react'

interface AutocompleteButtonProps {
  onClick: () => void
  title?: string
}

const AutocompleteButton = ({ onClick, title = 'Autocompletar' }: AutocompleteButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 border border-gray-300 rounded-lg px-2 py-1 text-primary text-sm mb-2 hover:bg-gray-50 transition-colors"
    >
      <Sparkles className="w-4 h-4" />
      {title}
    </button>
  )
}

export default AutocompleteButton
