import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import type { RouteConfig } from './types'
import PrivateLayout from './components/Layouts'
import Notifications from './pages/Notifications'
import NotFoundPage from './pages/NotFound'
import ForbiddenPage from './pages/Forbidden'
import ServerErrorPage from './pages/ServerError'
import Chat from './pages/Chat'
import Settings from './pages/Settings'
import Projects from './pages/Projects'
import QueueDashboard from './pages/QueueDashboard'
import ClaudeApiKeys from './pages/ClaudeApiKeys'
import GlobalPipeline from './pages/GlobalPipeline'

const routes: RouteConfig[] = [
  { path: '/',                  element: <Chat />,           isPrivate: false, breadcrumb: false },
  { path: '/settings',          element: <Settings />,       isPrivate: false, breadcrumb: false },
  { path: '/projects',          element: <Projects />,       isPrivate: false, breadcrumb: false },
  { path: '/claude-code-accounts', element: <ClaudeApiKeys />,  isPrivate: false, breadcrumb: false },
  { path: '/dashboard',         element: <QueueDashboard />, isPrivate: false, breadcrumb: false },
  { path: '/pipeline',          element: <GlobalPipeline />, isPrivate: false, breadcrumb: false },
  { path: '/403',               element: <ForbiddenPage />,  isPrivate: false, breadcrumb: false },
  { path: '/500',               element: <ServerErrorPage />,isPrivate: false, breadcrumb: false },
  { path: '/notifications',     element: <Notifications />,  isPrivate: true,  breadcrumb: true  },
]

const RouteComponent: React.FC<RouteConfig> = ({ element, breadcrumb, isPrivate }) => {
  if (!isPrivate) return <>{element}</>
  return <PrivateLayout breadcrumb={breadcrumb}>{element}</PrivateLayout>
}

const AppRoutes: React.FC = () => {
  const location = useLocation()
  return (
    <Routes location={location}>
      {routes.map((route, index) => (
        <Route key={index} path={route.path} element={<RouteComponent {...route} />} />
      ))}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes
