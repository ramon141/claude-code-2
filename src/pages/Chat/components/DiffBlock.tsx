import { useState } from 'react'
import { ChevronDown, ChevronRight, FileCode } from 'lucide-react'

type DiffLineType = 'added' | 'removed' | 'hunk' | 'header' | 'context'

interface DiffLine {
  type: DiffLineType
  content: string
}

interface FileSection {
  filename: string
  lines: DiffLine[]
}

const LINE_STYLE: Record<DiffLineType, string> = {
  added:   'bg-green-500/20 text-green-200',
  removed: 'bg-red-500/20 text-red-200',
  hunk:    'bg-blue-500/10 text-blue-300',
  header:  'bg-claude-border/40 text-claude-muted',
  context: 'text-claude-text',
}

function classifyLine(line: string): DiffLineType {
  if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('diff ') || line.startsWith('index '))
    return 'header'
  if (line.startsWith('+')) return 'added'
  if (line.startsWith('-')) return 'removed'
  if (line.startsWith('@@')) return 'hunk'
  return 'context'
}

function extractFilename(diffLine: string): string {
  const match = /^diff --git a\/.+ b\/(.+)$/.exec(diffLine)
  return match?.[1] ?? diffLine.replace('diff --git ', '')
}

function parseFileSections(raw: string): FileSection[] {
  const lines = raw.split('\n')
  const sections: FileSection[] = []
  let current: FileSection | null = null

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      current = { filename: extractFilename(line), lines: [] }
      sections.push(current)
      continue
    }
    if (!current) {
      current = { filename: 'changes', lines: [] }
      sections.push(current)
    }
    if (line !== '') current.lines.push({ type: classifyLine(line), content: line })
  }

  return sections
}

function countChanges(lines: DiffLine[]): { added: number; removed: number } {
  return lines.reduce(
    (acc, l) => {
      if (l.type === 'added') acc.added++
      if (l.type === 'removed') acc.removed++
      return acc
    },
    { added: 0, removed: 0 },
  )
}

function FileDiff({ section, defaultOpen }: { section: FileSection; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const { added, removed } = countChanges(section.lines)

  return (
    <div className="border-b border-claude-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5 text-claude-muted flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-claude-muted flex-shrink-0" />}
        <FileCode className="w-3.5 h-3.5 text-claude-muted flex-shrink-0" />
        <span className="text-xs text-claude-text font-mono flex-1 truncate">{section.filename}</span>
        <span className="text-xs text-green-400 flex-shrink-0">+{added}</span>
        <span className="text-xs text-red-400 flex-shrink-0 ml-1">-{removed}</span>
      </button>

      {open && (
        <div className="overflow-x-auto">
          {section.lines.map((line, i) => (
            <div key={i} className={`px-4 py-0.5 whitespace-pre font-mono text-xs leading-relaxed ${LINE_STYLE[line.type]}`}>
              {line.content}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DiffBlock({ content }: { content: string }) {
  const sections = parseFileSections(content)

  return (
    <div className="bg-claude-bg border border-claude-border rounded-lg overflow-hidden my-2">
      {sections.map((section, i) => (
        <FileDiff key={i} section={section} defaultOpen={false} />
      ))}
    </div>
  )
}
