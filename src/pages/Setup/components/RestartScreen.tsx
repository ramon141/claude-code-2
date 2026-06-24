import React from 'react'

const RestartScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <span className="w-10 h-10 border-4 border-[#D97757] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#F5F5F5] font-medium">Aplicando configurações e reiniciando...</p>
        <p className="text-[#9A9A9A] text-sm">Isso leva alguns segundos.</p>
      </div>
    </div>
  )
}

export default RestartScreen
