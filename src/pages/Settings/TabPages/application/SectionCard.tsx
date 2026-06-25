import React from 'react'

interface SectionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
  headerAction?: React.ReactNode
}

const SectionCard: React.FC<SectionCardProps> = ({ title, description, icon, children, headerAction }) => {
  return (
    <section className="bg-claude-surface border border-claude-border rounded-2xl p-6 flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <span className="text-claude-primary">{icon}</span>
        <div className="flex-1">
          <h2 className="text-claude-text font-semibold">{title}</h2>
          <p className="text-claude-muted text-sm">{description}</p>
        </div>
        {headerAction && <div className="ml-auto">{headerAction}</div>}
      </header>
      {children}
    </section>
  )
}

export default SectionCard
