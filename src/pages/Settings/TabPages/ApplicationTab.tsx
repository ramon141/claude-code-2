import React, { useState } from 'react'
import RestartScreen from '../../Setup/components/RestartScreen'
import { useRestartWatcher } from '../hooks/useRestartWatcher'
import DatabaseSection from './application/DatabaseSection'
import ClaudeSection from './application/ClaudeSection'
import EvolutionSection from './application/EvolutionSection'
import NgrokSection from './application/NgrokSection'
import AuthSection from './application/AuthSection'
import WebsocketSection from './application/WebsocketSection'
import {
  useSetupControllerConfig,
  useSetupControllerRestart,
} from '../../../api/generated/api'

const ApplicationTab: React.FC = () => {
  const { data, isLoading } = useSetupControllerConfig()
  const [restarting, setRestarting] = useState(false)
  const { mutateAsync: restart } = useSetupControllerRestart()
  useRestartWatcher(restarting)

  const triggerRestart = async () => {
    await restart()
    setRestarting(true)
  }

  if (restarting) return <RestartScreen />

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="w-8 h-8 border-4 border-[#D97757] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <DatabaseSection databaseUrl={data.databaseUrl} onNeedRestart={triggerRestart} />
      <ClaudeSection
        claudeCommand={data.claudeCommand}
        timeout={data.timeout}
        onNeedRestart={triggerRestart}
      />
      <EvolutionSection
        url={data.evolutionUrl}
        token={data.evolutionToken}
        instanceName={data.evolutionInstanceName}
      />
      <NgrokSection enabled={data.ngrokEnabled} onNeedRestart={triggerRestart} />
      <AuthSection authConfigured={data.authConfigured} />
      <WebsocketSection origins={data.websocketAllowedOrigins} />
    </div>
  )
}

export default ApplicationTab
