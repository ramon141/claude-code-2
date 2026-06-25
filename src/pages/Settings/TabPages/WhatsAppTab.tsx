import React from 'react'
import EvolutionSection from './application/EvolutionSection'
import PhoneAllowlistSection from './application/PhoneAllowlistSection'
import NotificationSection from './application/NotificationSection'
import { useSetupControllerConfig } from '../../../api/generated/api'

const WhatsAppTab: React.FC = () => {
  const { data, isLoading } = useSetupControllerConfig()

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="w-8 h-8 border-4 border-[#D97757] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <EvolutionSection
        url={data.evolutionUrl}
        token={data.evolutionToken}
        instanceName={data.evolutionInstanceName}
      />
      <PhoneAllowlistSection allowedPhones={data.allowedPhones} />
      <NotificationSection
        notificationsEnabled={data.notificationsEnabled}
        notificationPhones={data.notificationPhones}
      />
    </div>
  )
}

export default WhatsAppTab
