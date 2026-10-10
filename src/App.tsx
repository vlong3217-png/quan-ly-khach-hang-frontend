import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage/LoginPage.tsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage/ForgotPasswordPage.tsx'
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage.tsx'
import ChangePasswordPage from './pages/ChangePasswordPage/ChangePasswordPage.tsx'
import DashboardPage from './pages/DashboardPage/DashboardPage.tsx'
import ForbiddenPage from './pages/ForbiddenPage/ForbiddenPage.tsx'
import ImportUsersPage from './pages/ImportUsersPage/ImportUsersPage.tsx'
import ProfilePage from './pages/ProfilePage/ProfilePage.tsx'
import PublicLeadFormPage from './pages/PublicLeadFormPage/PublicLeadFormPage.tsx'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import AdminRoute from './components/AdminRoute.tsx'
import { ROLES, PERMISSIONS } from './constants/permissions.ts'

function App() {
  return (
    <Routes>
      {/* ── Public Web-to-Lead Form (S4-01) ── */}
      <Route path="/lead-form/:formId" element={<PublicLeadFormPage />} />
      <Route path="/forms/:formId" element={<PublicLeadFormPage />} />

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

      {/* 4b. S2-05: Quản lý Sản phẩm / Dịch vụ & Bảng giá */}
      <Route
        path="/dashboard/products/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 4c. S4-01: Quản lý Biểu mẫu & Thu thập Lead */}
      <Route
        path="/dashboard/lead-forms/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/leads/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 4d. S4-03: Quản lý & Theo dõi Lead theo Chiến dịch */}
      <Route
        path="/dashboard/campaigns/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 4e. S5-03 & S5-04: Quản lý Cơ hội bán hàng, Hoạt động & Công việc */}
      <Route
        path="/dashboard/opportunities/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* 5. Quản lý tài khoản (S1-08 / S1-10) */}
      <Route
        path="/dashboard/users/*"
        element={
          <AdminRoute>
            <DashboardPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/users"
        element={<Navigate to="/dashboard/users" replace />}
      />
      <Route
        path="/users"
        element={<Navigate to="/dashboard/users" replace />}
      />

      {/* ── S2-01: Nhập danh sách người dùng từ Excel ── */}
      <Route
        path="/import-users"
        element={
          <AdminRoute>
            <ImportUsersPage />
          </AdminRoute>
        }
      />

      {/* ── S2-02 / S2-03: Hồ sơ cá nhân & Ảnh đại diện ── */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* ── S2-04: Nhật ký thay đổi dữ liệu nhạy cảm (Audit Logs) ── */}
      <Route
        path="/admin/audit-logs"
        element={<Navigate to="/dashboard/audit-logs" replace />}
      />
      <Route
        path="/audit-logs"
        element={<Navigate to="/dashboard/audit-logs" replace />}
      />

      {/* 6. Route Dashboard tổng quan */}
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

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      {/* Mọi route khác → redirect về dashboard (ProtectedRoute sẽ kiểm tra auth) */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
