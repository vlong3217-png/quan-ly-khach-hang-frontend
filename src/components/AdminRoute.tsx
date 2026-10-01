import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.tsx'

/**
 * Chỉ cho phép user có role "ADMIN" truy cập.
 * Nếu chưa đăng nhập → redirect /login.
 * Nếu đã đăng nhập nhưng không phải ADMIN → redirect /dashboard.
 */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role?.toUpperCase() !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
