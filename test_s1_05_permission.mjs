import assert from 'node:assert/strict'

// Import pure utility functions
import {
  ROLES,
  PERMISSIONS,
  DATA_SCOPES,
  ROLE_PERMISSIONS,
  DEFAULT_ROLE_SCOPE,
  getUserPermissions,
  getUserDataScope,
} from './src/constants/permissions.ts'

import {
  canAccessItem,
  filterByScope,
} from './src/utils/dataScope.ts'

import {
  checkUserRole,
  checkUserPermission,
} from './src/utils/permissionUtils.ts'

console.log('───────────────────────────────────────────────────────')
console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CHO STORY S1-05 (FRONTEND)')
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
  full_name: 'Nhân viên kinh doanh 1',
  role: ROLES.USER,
  team_id: 1,
}

const otherTeamUser = {
  id: 4,
  email: 'staff2@gmail.com',
  full_name: 'Nhân viên kinh doanh 2',
  role: ROLES.USER,
  team_id: 2,
}

/* ──────────── Mock Customer Data ──────────── */
const mockCustomers = [
  {
    id: 101,
    name: 'Khách hàng của Staff 1',
    owner_id: 3,
    team_id: 1,
  },
  {
    id: 102,
    name: 'Khách hàng của Manager',
    owner_id: 2,
    team_id: 1,
  },
  {
    id: 103,
    name: 'Khách hàng của Staff 2 (Team 2)',
    owner_id: 4,
    team_id: 2,
  },
  {
    id: 104,
    name: 'Khách hàng của Admin',
    owner_id: 1,
    team_id: 1,
  },
]

/* ──────────── TEST SUITES ──────────── */

// Test 1: Kiểm tra Role & Scope mặc định
runTest('1.0. ROLE_PERMISSIONS và DEFAULT_ROLE_SCOPE được cấu hình chuẩn', () => {
  assert.ok(ROLE_PERMISSIONS[ROLES.ADMIN].length >= 7)
  assert.ok(ROLE_PERMISSIONS[ROLES.MANAGER].length >= 5)
  assert.ok(ROLE_PERMISSIONS[ROLES.USER].length >= 3)
  assert.equal(DEFAULT_ROLE_SCOPE[ROLES.ADMIN], DATA_SCOPES.ALL)
  assert.equal(DEFAULT_ROLE_SCOPE[ROLES.MANAGER], DATA_SCOPES.TEAM)
  assert.equal(DEFAULT_ROLE_SCOPE[ROLES.USER], DATA_SCOPES.MY)
})

runTest('1.1. Role ADMIN có scope mặc định là ALL', () => {
  assert.equal(getUserDataScope(adminUser), DATA_SCOPES.ALL)
})

runTest('1.2. Role MANAGER có scope mặc định là TEAM', () => {
  assert.equal(getUserDataScope(managerUser), DATA_SCOPES.TEAM)
})

runTest('1.3. Role USER có scope mặc định là MY', () => {
  assert.equal(getUserDataScope(staffUser), DATA_SCOPES.MY)
})

// Test 2: Kiểm tra Quyền (Permissions) của ADMIN
runTest('2.1. ADMIN có toàn bộ quyền (7/7 quyền)', () => {
  const perms = getUserPermissions(adminUser)
  assert.equal(perms.length, 7)
  assert.ok(checkUserPermission(adminUser, PERMISSIONS.CUSTOMER_VIEW))
  assert.ok(checkUserPermission(adminUser, PERMISSIONS.CUSTOMER_CREATE))
  assert.ok(checkUserPermission(adminUser, PERMISSIONS.CUSTOMER_EDIT))
  assert.ok(checkUserPermission(adminUser, PERMISSIONS.CUSTOMER_DELETE))
  assert.ok(checkUserPermission(adminUser, PERMISSIONS.CUSTOMER_EXPORT))
  assert.ok(checkUserPermission(adminUser, PERMISSIONS.REPORT_VIEW))
  assert.ok(checkUserPermission(adminUser, PERMISSIONS.SYSTEM_SETTINGS))
})

// Test 3: Kiểm tra Quyền của MANAGER
runTest('3.1. MANAGER có quyền CUSTOMER_VIEW, CREATE, EDIT, EXPORT, REPORT_VIEW', () => {
  assert.ok(checkUserPermission(managerUser, PERMISSIONS.CUSTOMER_VIEW))
  assert.ok(checkUserPermission(managerUser, PERMISSIONS.CUSTOMER_CREATE))
  assert.ok(checkUserPermission(managerUser, PERMISSIONS.CUSTOMER_EDIT))
  assert.ok(checkUserPermission(managerUser, PERMISSIONS.CUSTOMER_EXPORT))
  assert.ok(checkUserPermission(managerUser, PERMISSIONS.REPORT_VIEW))
})

runTest('3.2. MANAGER BỊ CHẶN quyền CUSTOMER_DELETE và SYSTEM_SETTINGS', () => {
  assert.equal(checkUserPermission(managerUser, PERMISSIONS.CUSTOMER_DELETE), false)
  assert.equal(checkUserPermission(managerUser, PERMISSIONS.SYSTEM_SETTINGS), false)
})

// Test 4: Kiểm tra Quyền của USER
runTest('4.1. USER có quyền CUSTOMER_VIEW, CREATE, EDIT', () => {
  assert.ok(checkUserPermission(staffUser, PERMISSIONS.CUSTOMER_VIEW))
  assert.ok(checkUserPermission(staffUser, PERMISSIONS.CUSTOMER_CREATE))
  assert.ok(checkUserPermission(staffUser, PERMISSIONS.CUSTOMER_EDIT))
})

runTest('4.2. USER BỊ CHẶN quyền CUSTOMER_DELETE, EXPORT, REPORT_VIEW, SYSTEM_SETTINGS', () => {
  assert.equal(checkUserPermission(staffUser, PERMISSIONS.CUSTOMER_DELETE), false)
  assert.equal(checkUserPermission(staffUser, PERMISSIONS.CUSTOMER_EXPORT), false)
  assert.equal(checkUserPermission(staffUser, PERMISSIONS.REPORT_VIEW), false)
  assert.equal(checkUserPermission(staffUser, PERMISSIONS.SYSTEM_SETTINGS), false)
})

// Test 5: Kiểm tra hàm checkUserRole
runTest('5.1. checkUserRole so khớp chính xác role đơn và mảng role', () => {
  assert.ok(checkUserRole(adminUser, ROLES.ADMIN))
  assert.ok(checkUserRole(adminUser, [ROLES.ADMIN, ROLES.MANAGER]))
  assert.equal(checkUserRole(staffUser, ROLES.ADMIN), false)
  assert.ok(checkUserRole(staffUser, [ROLES.USER, ROLES.MANAGER]))
})

// Test 6: Kiểm tra lọc dữ liệu theo Scope ALL (ADMIN)
runTest('6.1. Scope ALL: Hiển thị 100% dữ liệu (4/4 khách hàng)', () => {
  const result = filterByScope(mockCustomers, adminUser)
  assert.equal(result.length, 4)
})

// Test 7: Kiểm tra lọc dữ liệu theo Scope TEAM (MANAGER / TEAM 1)
runTest('7.1. Scope TEAM: Chỉ hiển thị khách hàng cùng team_id = 1 (3/4 khách hàng)', () => {
  const result = filterByScope(mockCustomers, managerUser)
  // Trong team 1 có: ID 101 (staff1), ID 102 (manager), ID 104 (admin team 1)
  assert.equal(result.length, 3)
  assert.ok(result.every((item) => item.team_id === 1))
  // Không chứa khách hàng của Team 2
  assert.ok(!result.some((item) => item.id === 103))
})

runTest('7.2. canAccessItem kiểm tra quyền truy cập bản ghi đơn lẻ theo scope', () => {
  // Staff 1 không truy cập được khách hàng của Staff 2
  assert.equal(canAccessItem(mockCustomers[2], staffUser), false)
  // Staff 2 truy cập được khách hàng của chính mình (ID 103)
  assert.equal(canAccessItem(mockCustomers[2], otherTeamUser), true)
  // Manager team 1 không truy cập được khách hàng thuộc team 2
  assert.equal(canAccessItem(mockCustomers[2], managerUser), false)
  // Admin truy cập được tất cả
  assert.equal(canAccessItem(mockCustomers[2], adminUser), true)
})

// Test 8: Kiểm tra lọc dữ liệu theo Scope MY (USER / ID = 3)
runTest('8.1. Scope MY: Chỉ hiển thị khách hàng do chính user phụ trách (1/4 khách hàng)', () => {
  const result = filterByScope(mockCustomers, staffUser)
  assert.equal(result.length, 1)
  assert.equal(result[0].id, 101)
  assert.equal(result[0].owner_id, 3)
})

// Test 9: Kiểm tra an toàn khi user là null (Chưa đăng nhập)
runTest('9.1. An toàn khi user = null (không crash, từ chối quyền và trả về mảng rỗng)', () => {
  assert.equal(checkUserPermission(null, PERMISSIONS.CUSTOMER_VIEW), false)
  assert.equal(checkUserRole(null, ROLES.ADMIN), false)
  assert.equal(getUserDataScope(null), DATA_SCOPES.MY)
  assert.deepEqual(getUserPermissions(null), [])
  assert.deepEqual(filterByScope(mockCustomers, null), [])
})

// Test 10: Kiểm tra tùy chỉnh ghi đè (Custom Override Scope & Permissions)
runTest('10.1. Tôn trọng data_scope tùy chỉnh khi được gán cho user', () => {
  const customUser = {
    ...staffUser,
    data_scope: DATA_SCOPES.ALL,
  }
  assert.equal(getUserDataScope(customUser), DATA_SCOPES.ALL)
  const result = filterByScope(mockCustomers, customUser)
  assert.equal(result.length, 4)
})

console.log('\n───────────────────────────────────────────────────────')
console.log(`📊 TỔNG KẾT KIỂM THỬ: ${passCount} PASSED / ${failCount} FAILED`)
console.log('───────────────────────────────────────────────────────')

if (failCount > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
