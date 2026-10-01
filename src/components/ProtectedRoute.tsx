import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'

/**
 * Wraps a route element so that unauthenticated users
 * are redirected to /login.
 *
 * While the auth state is loading (checking storage),
 * renders nothing to avoid a flash of the login page.
 */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    // Still checking localStorage → show nothing (or a spinner)
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
