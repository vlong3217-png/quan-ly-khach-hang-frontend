import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage.tsx'
import DashboardPage from './pages/DashboardPage/DashboardPage.tsx'
import ForbiddenPage from './pages/ForbiddenPage/ForbiddenPage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import { ROLES, PERMISSIONS } from './constants/permissions.ts'

function App() {
  return (
    <Routes>
      {/* ── Route Đăng nhập ── */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── Route 403 Forbidden: Hiển thị trang không có quyền truy cập (User Story S1-07) ── */}
      <Route
        path="/forbidden"
        element={
          <ProtectedRoute>
            <ForbiddenPage />
          </ProtectedRoute>
        }
      />
      <Route path="/403" element={<Navigate to="/forbidden" replace />} />

      {/* ── Các route yêu cầu quyền hạn và vai trò cụ thể ── */}
      {/* 1. Cấu hình hệ thống & Quản trị: Yêu cầu Role ADMIN và quyền SYSTEM_SETTINGS */}
      <Route
        path="/dashboard/settings/*"
        element={
          <ProtectedRoute
            roles={[ROLES.ADMIN]}
            permission={PERMISSIONS.SYSTEM_SETTINGS}
          >
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 2. Báo cáo & Thống kê: Yêu cầu Role ADMIN hoặc MANAGER và quyền REPORT_VIEW */}
      <Route
        path="/dashboard/reports/*"
        element={
          <ProtectedRoute
            roles={[ROLES.ADMIN, ROLES.MANAGER]}
            permission={PERMISSIONS.REPORT_VIEW}
          >
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 3. Quản lý Đội nhóm: Yêu cầu Role ADMIN hoặc MANAGER */}
      <Route
        path="/dashboard/teams/*"
        element={
          <ProtectedRoute roles={[ROLES.ADMIN, ROLES.MANAGER]}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 4. Quản lý Khách hàng: Yêu cầu quyền xem khách hàng CUSTOMER_VIEW */}
      <Route
        path="/dashboard/customers/*"
        element={
          <ProtectedRoute permission={PERMISSIONS.CUSTOMER_VIEW}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 5. Route Dashboard tổng quan (chung cho tất cả người dùng đã đăng nhập) */}
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Các alias tiện ích */}
      <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
      <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />
      <Route path="/teams" element={<Navigate to="/dashboard/teams" replace />} />
      <Route path="/customers" element={<Navigate to="/dashboard/customers" replace />} />

      {/* Redirect trang gốc về dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Mọi route không khớp khác → chuyển về dashboard (ProtectedRoute sẽ kiểm tra auth) */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
