import React from 'react'

interface SectionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
}

const SectionCard: React.FC<SectionCardProps> = ({ title, description, icon, children }) => {
  return (
    <section className="bg-[#222222] border border-[#3A3A3A] rounded-2xl p-6 flex flex-col gap-5">
      <header className="flex items-center gap-3">
        <span className="text-[#D97757]">{icon}</span>
        <div>
          <h2 className="text-[#F5F5F5] font-semibold">{title}</h2>
          <p className="text-[#9A9A9A] text-sm">{description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

export default SectionCard
