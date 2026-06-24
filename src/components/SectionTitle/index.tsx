interface SectionTitleProps {
  title: string
  subtitle?: string
}

export default function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="w-full border-b border-border pb-4 mb-2">
      <p className="text-subhead text-slate-800">{title}</p>
      {subtitle && <p className="text-body text-muted mt-0.5">{subtitle}</p>}
    </div>
  )
}
