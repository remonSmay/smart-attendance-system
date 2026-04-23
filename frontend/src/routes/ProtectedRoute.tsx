import { Navigate, Outlet } from 'react-router-dom'

import { authStore } from '../store/authStore'

interface ProtectedRouteProps {
  redirectPath?: string
}

export default function ProtectedRoute({
  redirectPath = '/login',
}: ProtectedRouteProps) {
  const token = authStore.getAccessToken()

  if (!token) {
    return <Navigate to={redirectPath} replace />
  }

  return <Outlet />
}
