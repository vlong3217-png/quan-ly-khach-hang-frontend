import assert from 'node:assert/strict'

// Import constants & pure utils
import { ROLES, PERMISSIONS } from './src/constants/permissions.ts'
import { APP_MENU_GROUPS } from './src/constants/menuConfig.ts'
import {
  canAccessMenuItem,
  filterMenuItemsByRole,
  filterMenuGroupsByRole,
  flattenMenuItems,
  findMenuItemById,
} from './src/utils/menuUtils.ts'

console.log('───────────────────────────────────────────────────────')
console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CHO STORY S1-06 (MENU THEO QUYỀN)')
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
  email: 'admin@gmail.com',
  full_name: 'Quản trị viên',
  role: ROLES.ADMIN,
  team_id: 1,
}

const managerUser = {
  id: 2,
  email: 'manager@gmail.com',
  full_name: 'Trưởng phòng kinh doanh',
  role: ROLES.MANAGER,
  team_id: 1,
}

const staffUser = {
  id: 3,
  email: 'staff1@gmail.com',
  full_name: 'Nhân viên kinh doanh',
  role: ROLES.USER,
  team_id: 1,
}

/* ──────────── TEST SUITE ──────────── */

// 1. Kiểm tra an toàn khi chưa đăng nhập hoặc thiếu role
runTest('1.1. canAccessMenuItem trả về false khi user = null (Chưa đăng nhập)', () => {
  const item = { id: 'test', title: 'Test', path: '/test' }
  assert.strictEqual(canAccessMenuItem(item, null), false)
})

runTest('1.2. canAccessMenuItem trả về false khi user không có role (Role rỗng/undefined)', () => {
  const item = { id: 'test', title: 'Test', path: '/test' }
  assert.strictEqual(canAccessMenuItem(item, { id: 99, email: 'norole@test.com' }), false)
  assert.strictEqual(canAccessMenuItem(item, { id: 99, email: 'norole@test.com', role: '' }), false)
})

runTest('1.3. filterMenuGroupsByRole trả về mảng rỗng khi user = null hoặc chưa đăng nhập', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, null)
  assert.deepStrictEqual(groups, [])
})

runTest('1.4. filterMenuGroupsByRole trả về mảng rỗng khi user không có thông tin role', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, { id: 99, email: 'a@b.com' })
  assert.deepStrictEqual(groups, [])
})

// 2. Kiểm thử Role ADMIN
runTest('2.1. ADMIN có quyền xem toàn bộ 3 nhóm menu chính (group-core, group-management, group-admin)', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, adminUser)
  const groupIds = groups.map((g) => g.id)
  assert.ok(groupIds.includes('group-core'))
  assert.ok(groupIds.includes('group-management'))
  assert.ok(groupIds.includes('group-admin'))
})

runTest('2.2. ADMIN nhìn thấy toàn bộ menu và submenu chi tiết trong hệ thống', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, adminUser)
  const flat = []
  for (const g of groups) {
    flat.push(...flattenMenuItems(g.items))
  }
  const itemIds = flat.map((i) => i.id)

  assert.ok(itemIds.includes('menu-dashboard'), 'ADMIN phải thấy Bảng điều khiển')
  assert.ok(itemIds.includes('menu-customers'), 'ADMIN phải thấy Quản lý khách hàng')
  assert.ok(itemIds.includes('menu-customers-export'), 'ADMIN phải thấy Xuất dữ liệu KH')
  assert.ok(itemIds.includes('menu-reports'), 'ADMIN phải thấy Báo cáo & Thống kê')
  assert.ok(itemIds.includes('menu-teams'), 'ADMIN phải thấy Quản lý Đội nhóm')
  assert.ok(itemIds.includes('menu-settings'), 'ADMIN phải thấy Cấu hình hệ thống')
  assert.ok(itemIds.includes('menu-settings-roles'), 'ADMIN phải thấy Phân quyền vai trò')
})

// 3. Kiểm thử Role MANAGER
runTest('3.1. MANAGER xem được nhóm TỔNG QUAN và NGHIỆP VỤ & QUẢN LÝ', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, managerUser)
  const groupIds = groups.map((g) => g.id)
  assert.ok(groupIds.includes('group-core'), 'MANAGER phải thấy group-core')
  assert.ok(groupIds.includes('group-management'), 'MANAGER phải thấy group-management')
})

runTest('3.2. MANAGER BỊ ẨN HOÀN TOÀN nhóm HỆ THỐNG & CẤU HÌNH (group-admin)', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, managerUser)
  const groupIds = groups.map((g) => g.id)
  assert.strictEqual(groupIds.includes('group-admin'), false, 'MANAGER KHÔNG ĐƯỢC thấy group-admin')
})

runTest('3.3. MANAGER xem được menu Báo cáo, Đội nhóm và chức năng Xuất dữ liệu KH', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, managerUser)
  const flat = []
  for (const g of groups) {
    flat.push(...flattenMenuItems(g.items))
  }
  const itemIds = flat.map((i) => i.id)

  assert.ok(itemIds.includes('menu-dashboard'))
  assert.ok(itemIds.includes('menu-customers'))
  assert.ok(itemIds.includes('menu-customers-export'), 'MANAGER có quyền export khách hàng')
  assert.ok(itemIds.includes('menu-reports'), 'MANAGER có quyền xem báo cáo thống kê')
  assert.ok(itemIds.includes('menu-teams'), 'MANAGER có quyền xem đội nhóm')
  assert.strictEqual(itemIds.includes('menu-settings'), false, 'MANAGER bị ẩn menu Cấu hình hệ thống')
})

// 4. Kiểm thử Role USER (Nhân viên)
runTest('4.1. USER chỉ xem được duy nhất nhóm TỔNG QUAN & LÀM VIỆC (group-core)', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, staffUser)
  const groupIds = groups.map((g) => g.id)
  assert.deepStrictEqual(groupIds, ['group-core'], 'USER chỉ được phép thấy group-core')
})

runTest('4.2. USER BỊ ẨN HOÀN TOÀN nhóm Báo cáo (group-management) và nhóm Cấu hình (group-admin)', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, staffUser)
  const groupIds = groups.map((g) => g.id)
  assert.strictEqual(groupIds.includes('group-management'), false, 'USER không được thấy group-management')
  assert.strictEqual(groupIds.includes('group-admin'), false, 'USER không được thấy group-admin')
})

runTest('4.3. USER không có quyền Xuất dữ liệu khách hàng (menu-customers-export bị ẩn khỏi submenu)', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, staffUser)
  const flat = []
  for (const g of groups) {
    flat.push(...flattenMenuItems(g.items))
  }
  const itemIds = flat.map((i) => i.id)

  assert.ok(itemIds.includes('menu-dashboard'), 'USER thấy Bảng điều khiển')
  assert.ok(itemIds.includes('menu-customers'), 'USER thấy Quản lý khách hàng')
  assert.ok(itemIds.includes('menu-customers-list'), 'USER thấy Danh sách KH')
  assert.ok(itemIds.includes('menu-customers-create'), 'USER thấy Thêm mới KH')
  assert.strictEqual(
    itemIds.includes('menu-customers-export'),
    false,
    'USER KHÔNG ĐƯỢC THẤY menu Xuất dữ liệu khách hàng (CUSTOMER_EXPORT)'
  )
})

runTest('4.4. USER BỊ ẨN các menu cấp cao: menu-reports, menu-teams, menu-settings', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, staffUser)
  const flat = []
  for (const g of groups) {
    flat.push(...flattenMenuItems(g.items))
  }
  const itemIds = flat.map((i) => i.id)

  assert.strictEqual(itemIds.includes('menu-reports'), false, 'USER bị ẩn menu Báo cáo & Thống kê')
  assert.strictEqual(itemIds.includes('menu-teams'), false, 'USER bị ẩn menu Quản lý Đội nhóm')
  assert.strictEqual(itemIds.includes('menu-settings'), false, 'USER bị ẩn menu Cấu hình hệ thống')
})

// 5. Utility findMenuItemById
runTest('5.1. findMenuItemById tìm kiếm chính xác menu item theo ID', () => {
  const groups = filterMenuGroupsByRole(APP_MENU_GROUPS, adminUser)
  const item = findMenuItemById(groups, 'menu-reports')
  assert.ok(item !== null)
  assert.strictEqual(item.title, 'Báo cáo & Thống kê')

  const nonExistent = findMenuItemById(groups, 'menu-not-found')
  assert.strictEqual(nonExistent, null)
})

console.log('───────────────────────────────────────────────────────')
console.log(`📊 TỔNG KẾT KIỂM THỬ S1-06: ${passCount} PASSED / ${failCount} FAILED`)
console.log('───────────────────────────────────────────────────────\n')

if (failCount > 0) {
  process.exit(1)
}
