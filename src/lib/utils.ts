import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Informa ao tailwind-merge que os tokens customizados de tipografia
// são utilitários de font-size, não de cor — evita conflito com text-white, text-primary, etc.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        'text-display',
        'text-heading',
        'text-subhead',
        'text-body',
        'text-caption',
        'text-label',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
