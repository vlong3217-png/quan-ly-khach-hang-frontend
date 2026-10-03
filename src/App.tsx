import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage.tsx'
import DashboardPage from './pages/DashboardPage/DashboardPage.tsx'
import ImportUsersPage from './pages/ImportUsersPage/ImportUsersPage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import AdminRoute from './components/AdminRoute.tsx'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      {/* S2-01: Nhập danh sách người dùng hàng loạt từ Excel */}
      <Route
        path="/import-users"
        element={
          <AdminRoute>
            <ImportUsersPage />
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
