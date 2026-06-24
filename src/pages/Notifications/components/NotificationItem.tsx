import React from 'react'
import { CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { cn } from '../../../lib/utils'

export type NotificationType = 'success' | 'warning' | 'error' | 'info'

export interface NotificationData {
  id: number
  type: NotificationType
  title: string
  description: string
  time: string
  read: boolean
}

interface NotificationItemProps {
  notification: NotificationData
  onRead: (id: number) => void
}

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; bg: string; text: string }> = {
  success: { icon: <CheckCircle className="w-4 h-4" />, bg: 'bg-success-light', text: 'text-success' },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, bg: 'bg-warning-light', text: 'text-warning' },
  error:   { icon: <AlertCircle className="w-4 h-4" />,  bg: 'bg-danger-light',  text: 'text-danger' },
  info:    { icon: <Info className="w-4 h-4" />,          bg: 'bg-info-light',    text: 'text-info' },
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onRead }) => {
  const config = TYPE_CONFIG[notification.type]

  return (
    <div
      className={cn(
        'flex items-start gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80 cursor-pointer',
        !notification.read && 'bg-primary-light/30',
      )}
      onClick={() => onRead(notification.id)}
    >
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5', config.bg, config.text)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-body font-medium', notification.read ? 'text-slate-600' : 'text-slate-800')}>
            {notification.title}
          </p>
          <span className="text-caption text-muted whitespace-nowrap flex-shrink-0">{notification.time}</span>
        </div>
        <p className="text-caption text-muted mt-0.5 line-clamp-2">{notification.description}</p>
      </div>
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </div>
  )
}
