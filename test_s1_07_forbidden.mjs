import assert from 'node:assert/strict'

// Import constants & pure utils
import { ROLES, PERMISSIONS } from './src/constants/permissions.ts'
import { checkUserRole, checkUserPermission } from './src/utils/permissionUtils.ts'

console.log('───────────────────────────────────────────────────────')
console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CHO STORY S1-07 (TRANG LỖI 403 / KHÔNG ĐỦ QUYỀN)')
console.log('───────────────────────────────────────────────────────\n')

let passCount = 0
let failCount = 0

function runTest(name, fn) {
  try {
    fn()
    console.log(`✅ [PASS] ${name}`)
    passCount++
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`)
    console.error(err)
    failCount++
  }
}

/* ──────────── Mock Users ──────────── */
const adminUser = {
  id: 1,
  email: 'admin@company.com',
  full_name: 'Quản trị viên Hệ thống',
  role: ROLES.ADMIN,
  team_id: 1,
}

const managerUser = {
  id: 2,
  email: 'manager@company.com',
  full_name: 'Trưởng phòng Kinh doanh',
  role: ROLES.MANAGER,
  team_id: 1,
}

const staffUser = {
  id: 3,
  email: 'staff@company.com',
  full_name: 'Nhân viên Kinh doanh',
  role: ROLES.USER,
  team_id: 1,
}

/* ──────────── Route Decision Logic Helper (Mô phỏng ProtectedRoute) ──────────── */
/**
 * Mô phỏng chính xác thuật toán phân nhánh của ProtectedRoute (S1-07):
 * - Nếu chưa authenticated: Trả về { status: 'REDIRECT', target: '/login' }
 * - Nếu authenticated nhưng thiếu role hoặc permission: Trả về { status: 'REDIRECT', target: '/forbidden' }
 * - Nếu thỏa mãn: Trả về { status: 'ALLOWED' }
 */
function evaluateRouteAccess({ user, isAuthenticated, roles, permission, requireAll = false, redirectTo = '/forbidden' }) {
  if (!isAuthenticated || !user) {
    return { status: 'REDIRECT', target: '/login' }
  }

  if (roles && !checkUserRole(user, roles)) {
    return { status: 'REDIRECT', target: redirectTo, reason: 'role' }
  }

  if (permission && !checkUserPermission(user, permission, requireAll)) {
    return { status: 'REDIRECT', target: redirectTo, reason: 'permission' }
  }

  return { status: 'ALLOWED' }
}

/* ──────────── TEST SUITE S1-07 ──────────── */

// 1. Kiểm tra trường hợp User chưa đăng nhập (Chưa Authenticated)
runTest('1.1. Chưa đăng nhập khi truy cập /dashboard/settings → Redirect về /login (Không chuyển sang Forbidden)', () => {
  const result = evaluateRouteAccess({
    user: null,
    isAuthenticated: false,
    roles: [ROLES.ADMIN],
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  })
  assert.strictEqual(result.status, 'REDIRECT')
  assert.strictEqual(result.target, '/login')
})

runTest('1.2. Chưa đăng nhập khi truy cập /dashboard/reports → Redirect về /login', () => {
  const result = evaluateRouteAccess({
    user: null,
    isAuthenticated: false,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
    permission: PERMISSIONS.REPORT_VIEW,
  })
  assert.strictEqual(result.status, 'REDIRECT')
  assert.strictEqual(result.target, '/login')
})

runTest('1.3. Chưa đăng nhập khi truy cập trực tiếp /forbidden → Vẫn redirect về /login (Bảo lưu cơ chế auth)', () => {
  const result = evaluateRouteAccess({
    user: null,
    isAuthenticated: false,
  })
  assert.strictEqual(result.status, 'REDIRECT')
  assert.strictEqual(result.target, '/login')
})

// 2. Kiểm tra trường hợp User vai trò USER (Nhân viên thông thường)
runTest('2.1. USER truy cập trang Dashboard chung → ALLOWED (Cho phép truy cập)', () => {
  const result = evaluateRouteAccess({
    user: staffUser,
    isAuthenticated: true,
  })
  assert.strictEqual(result.status, 'ALLOWED')
})

runTest('2.2. USER truy cập Quản lý khách hàng (CUSTOMER_VIEW) → ALLOWED', () => {
  const result = evaluateRouteAccess({
    user: staffUser,
    isAuthenticated: true,
    permission: PERMISSIONS.CUSTOMER_VIEW,
  })
  assert.strictEqual(result.status, 'ALLOWED')
})

runTest('2.3. USER truy cập Cấu hình hệ thống (yêu cầu ADMIN) → BỊ CHẶN và Redirect về /forbidden', () => {
  const result = evaluateRouteAccess({
    user: staffUser,
    isAuthenticated: true,
    roles: [ROLES.ADMIN],
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  })
  assert.strictEqual(result.status, 'REDIRECT')
  assert.strictEqual(result.target, '/forbidden')
  assert.strictEqual(result.reason, 'role')
})

runTest('2.4. USER truy cập Báo cáo & Thống kê (yêu cầu REPORT_VIEW) → BỊ CHẶN và Redirect về /forbidden', () => {
  const result = evaluateRouteAccess({
    user: staffUser,
    isAuthenticated: true,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
    permission: PERMISSIONS.REPORT_VIEW,
  })
  assert.strictEqual(result.status, 'REDIRECT')
  assert.strictEqual(result.target, '/forbidden')
})

runTest('2.5. USER truy cập Quản lý Đội nhóm (yêu cầu ADMIN, MANAGER) → BỊ CHẶN và Redirect về /forbidden', () => {
  const result = evaluateRouteAccess({
    user: staffUser,
    isAuthenticated: true,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  })
  assert.strictEqual(result.status, 'REDIRECT')
  assert.strictEqual(result.target, '/forbidden')
})

runTest('2.6. USER đã đăng nhập khi truy cập /forbidden → ALLOWED (Hiển thị trang 403 Forbidden)', () => {
  const result = evaluateRouteAccess({
    user: staffUser,
    isAuthenticated: true,
  })
  assert.strictEqual(result.status, 'ALLOWED')
})

// 3. Kiểm tra trường hợp User vai trò MANAGER (Quản lý)
runTest('3.1. MANAGER truy cập Báo cáo & Thống kê (REPORT_VIEW) → ALLOWED', () => {
  const result = evaluateRouteAccess({
    user: managerUser,
    isAuthenticated: true,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
    permission: PERMISSIONS.REPORT_VIEW,
  })
  assert.strictEqual(result.status, 'ALLOWED')
})

runTest('3.2. MANAGER truy cập Quản lý Đội nhóm → ALLOWED', () => {
  const result = evaluateRouteAccess({
    user: managerUser,
    isAuthenticated: true,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
  })
  assert.strictEqual(result.status, 'ALLOWED')
})

runTest('3.3. MANAGER truy cập Cấu hình hệ thống (chỉ dành cho ADMIN) → BỊ CHẶN và Redirect về /forbidden', () => {
  const result = evaluateRouteAccess({
    user: managerUser,
    isAuthenticated: true,
    roles: [ROLES.ADMIN],
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  })
  assert.strictEqual(result.status, 'REDIRECT')
  assert.strictEqual(result.target, '/forbidden')
})

// 4. Kiểm tra trường hợp User vai trò ADMIN (Toàn quyền)
runTest('4.1. ADMIN truy cập Bảng điều khiển → ALLOWED', () => {
  const result = evaluateRouteAccess({
    user: adminUser,
    isAuthenticated: true,
  })
  assert.strictEqual(result.status, 'ALLOWED')
})

runTest('4.2. ADMIN truy cập Báo cáo & Thống kê → ALLOWED', () => {
  const result = evaluateRouteAccess({
    user: adminUser,
    isAuthenticated: true,
    roles: [ROLES.ADMIN, ROLES.MANAGER],
    permission: PERMISSIONS.REPORT_VIEW,
  })
  assert.strictEqual(result.status, 'ALLOWED')
})

runTest('4.3. ADMIN truy cập Cấu hình hệ thống → ALLOWED', () => {
  const result = evaluateRouteAccess({
    user: adminUser,
    isAuthenticated: true,
    roles: [ROLES.ADMIN],
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  })
  assert.strictEqual(result.status, 'ALLOWED')
})

// 5. Kiểm tra cấu trúc file và nội dung yêu cầu của S1-07
runTest('5.1. File ForbiddenPage.tsx có đầy đủ mã lỗi 403, tiêu đề và nút điều hướng', async () => {
  const fs = await import('node:fs')
  const content = fs.readFileSync('./src/pages/ForbiddenPage/ForbiddenPage.tsx', 'utf-8')

  assert.ok(content.includes('403'), 'Phải chứa mã lỗi 403')
  assert.ok(content.includes('Không có quyền truy cập'), 'Phải chứa tiêu đề không có quyền')
  assert.ok(content.includes('Quay lại'), 'Phải có nút Quay lại')
  assert.ok(content.includes('Về trang chủ'), 'Phải có nút Về trang chủ')
  assert.ok(content.includes('btn-forbidden-back'), 'Phải có id btn-forbidden-back')
  assert.ok(content.includes('btn-forbidden-home'), 'Phải có id btn-forbidden-home')
})

runTest('5.2. File App.tsx đã cấu hình route /forbidden và các route phân quyền có ProtectedRoute', async () => {
  const fs = await import('node:fs')
  const content = fs.readFileSync('./src/App.tsx', 'utf-8')

  assert.ok(content.includes('/forbidden'), 'App.tsx phải chứa route /forbidden')
  assert.ok(content.includes('<ForbiddenPage />'), 'App.tsx phải render ForbiddenPage')
  assert.ok(content.includes('/dashboard/settings/*'), 'App.tsx phải bảo vệ route settings')
  assert.ok(content.includes('/dashboard/reports/*'), 'App.tsx phải bảo vệ route reports')
})

runTest('5.3. ProtectedRoute không làm thay đổi luồng Login khi user chưa đăng nhập', () => {
  const unauthUser = evaluateRouteAccess({
    user: null,
    isAuthenticated: false,
    permission: PERMISSIONS.SYSTEM_SETTINGS,
  })
  assert.strictEqual(unauthUser.status, 'REDIRECT')
  assert.strictEqual(unauthUser.target, '/login', 'Chưa đăng nhập bắt buộc phải redirect /login')
})

console.log('\n───────────────────────────────────────────────────────')
console.log(`📊 TỔNG KẾT KIỂM THỬ S1-07: ${passCount} PASSED / ${failCount} FAILED`)
console.log('───────────────────────────────────────────────────────\n')

if (failCount > 0) {
  process.exit(1)
}
