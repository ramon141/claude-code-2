import React from 'react'

const RestartScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-claude-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="w-10 h-10 border-4 border-claude-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-claude-text font-medium">Aplicando configurações e reiniciando...</p>
        <p className="text-claude-muted text-sm">Isso leva alguns segundos.</p>
      </div>
    </div>
  )
}

export default RestartScreen
