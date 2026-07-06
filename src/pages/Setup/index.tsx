import React, { useCallback, useEffect, useState } from 'react'
import ClaudeStep from './steps/ClaudeStep'
import EvolutionStep from './steps/EvolutionStep'
import Stepper from './components/Stepper'
import RestartScreen from './components/RestartScreen'
import {
  setupControllerStatus,
  useSetupControllerComplete,
} from '../../api/generated/api'

const STEP_LABELS = ['Claude', 'Evolution']
const RESTART_POLL_MS = 1500

const Setup: React.FC = () => {
  const [step, setStep] = useState(0)
  const [restarting, setRestarting] = useState(false)
  const { mutateAsync: complete, isPending: completing } = useSetupControllerComplete()

  const finish = useCallback(async () => {
    await complete()
    setRestarting(true)
  }, [complete])

  useRestartWatcher(restarting)

  if (restarting) return <RestartScreen />

  return (
    <div className="min-h-screen bg-claude-bg flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-claude-surface border border-claude-border rounded-2xl p-8 flex flex-col gap-6">
        <div>
          <h1 className="text-claude-text text-xl font-semibold">Configuração inicial</h1>
          <p className="text-claude-muted text-sm">Configure a aplicação antes de começar.</p>
        </div>

        <Stepper labels={STEP_LABELS} current={step} />

        {step === 0 && <ClaudeStep onNext={() => setStep(1)} />}
        {step === 1 && (
          <EvolutionStep onFinish={finish} onBack={() => setStep(0)} finishing={completing || restarting} />
        )}
      </div>
    </div>
  )
}

function useRestartWatcher(active: boolean): void {
  useEffect(() => {
    if (!active) return
    const timer = setInterval(async () => {
      try {
        const status = await setupControllerStatus()
        if (status.completed) window.location.reload()
      } catch {
        // API reiniciando — segue tentando
      }
    }, RESTART_POLL_MS)
    return () => clearInterval(timer)
  }, [active])
}

export default Setup
