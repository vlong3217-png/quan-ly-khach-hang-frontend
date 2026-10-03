import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage.tsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage.tsx'
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage.tsx'
import ChangePasswordPage from './pages/ChangePasswordPage/ChangePasswordPage.tsx'
import DashboardPage from './pages/DashboardPage/DashboardPage.tsx'
import UserManagementPage from './pages/UserManagementPage/UserManagementPage.tsx'
import AuditLogPage from './pages/AuditLogPage/AuditLogPage.tsx'
import ProfilePage from './pages/ProfilePage/ProfilePage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import AdminRoute from './components/AdminRoute.tsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <AdminRoute>
            <UserManagementPage />
          </AdminRoute>
        }
      />
      <Route
        path="/users"
        element={
          <AdminRoute>
            <UserManagementPage />
          </AdminRoute>
        }
      />
      {/* ── Route Nhật ký thay đổi dữ liệu nhạy cảm (User Story S2-04: Dành riêng cho ADMIN) ── */}
      <Route
        path="/admin/audit-logs"
        element={
          <AdminRoute>
            <AuditLogPage />
          </AdminRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <AdminRoute>
            <AuditLogPage />
          </AdminRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      {/* Mọi route khác → redirect về dashboard (ProtectedRoute sẽ kiểm tra auth) */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
