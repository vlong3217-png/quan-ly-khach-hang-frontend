/**
 * test_s2_04_audit_log.mjs
 * Test suite tự động cho User Story S2-04: Nhật ký thay đổi dữ liệu nhạy cảm
 */

import assert from 'node:assert/strict'
import {
  getAuditLogs,
  getDistinctPerformers,
  formatAuditDate,
  INITIAL_AUDIT_LOGS,
} from './src/services/auditLogService.ts'
import {
  ENTITY_TYPE_LABELS,
  ACTION_LABELS,
} from './src/types/auditLog.ts'
import { validateFullName, validateVietnamesePhone } from './src/utils/phoneValidation.ts'
import { validateAvatarFile } from './src/services/avatarService.ts'

// Mock localStorage cho môi trường Node.js
const localStorageMock = (() => {
  let store = {}
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value)
    },
    removeItem: (key) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
globalThis.localStorage = localStorageMock

let totalTests = 0
let passedTests = 0

async function runTest(name, fn) {
  totalTests++
  try {
    await fn()
    console.log(`  ✅ [PASS] ${name}`)
    passedTests++
  } catch (error) {
    console.error(`  ❌ [FAIL] ${name}`)
    console.error(`     Chi tiết: ${error.message}`)
    process.exitCode = 1
  }
}

console.log('─────────────────────────────────────────────────────────────')
console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG USER STORY S2-04 (AUDIT LOGS)')
console.log('─────────────────────────────────────────────────────────────')

console.log('\n[1. KIỂM THỬ CẤU TRÚC DỮ LIỆU VÀ YÊU CẦU MẪU S2-04]')

await runTest('1.1. Có ít nhất 8–10 bản ghi nhật ký mẫu', () => {
  assert.ok(INITIAL_AUDIT_LOGS.length >= 10, `Cần ít nhất 10 bản ghi, hiện có ${INITIAL_AUDIT_LOGS.length}`)
})

await runTest('1.2. Hỗ trợ đủ 4 loại đối tượng nhạy cảm bắt buộc', () => {
  const types = new Set(INITIAL_AUDIT_LOGS.map((l) => l.entity_type))
  assert.ok(types.has('DISCOUNT'), 'Thiếu loại Chiết khấu (DISCOUNT)')
  assert.ok(types.has('TARGET'), 'Thiếu loại Chỉ tiêu (TARGET)')
  assert.ok(types.has('OWNERSHIP'), 'Thiếu loại Quyền sở hữu (OWNERSHIP)')
  assert.ok(types.has('USER_ROLE'), 'Thiếu loại Vai trò người dùng (USER_ROLE)')
})

await runTest('1.3. Có nhãn tiếng Việt chuẩn xác cho tất cả Entity Types và Actions', () => {
  assert.equal(ENTITY_TYPE_LABELS.DISCOUNT, 'Chiết khấu')
  assert.equal(ENTITY_TYPE_LABELS.TARGET, 'Chỉ tiêu')
  assert.equal(ENTITY_TYPE_LABELS.OWNERSHIP, 'Quyền sở hữu dữ liệu')
  assert.equal(ENTITY_TYPE_LABELS.USER_ROLE, 'Vai trò người dùng')

  assert.equal(ACTION_LABELS.UPDATE, 'Cập nhật')
  assert.equal(ACTION_LABELS.CHANGE, 'Thay đổi')
  assert.equal(ACTION_LABELS.CREATE, 'Tạo mới')
  assert.equal(ACTION_LABELS.DELETE, 'Xóa')
})

await runTest('1.4. Có dữ liệu cụ thể khớp ví dụ người dùng yêu cầu', () => {
  // 1. Nguyễn Văn A sửa Chiết khấu KH001 từ 5% -> 10%
  const case1 = INITIAL_AUDIT_LOGS.find(
    (l) => l.performer_name === 'Nguyễn Văn A' && l.entity_id === 'KH001' && l.entity_type === 'DISCOUNT'
  )
  assert.ok(case1, 'Không tìm thấy bản ghi Chiết khấu KH001 của Nguyễn Văn A')
  assert.equal(case1.old_value, '5%')
  assert.equal(case1.new_value, '10%')

  // 2. Trần Văn B sửa Chỉ tiêu TARGET-01 từ 100.000.000 -> 150.000.000
  const case2 = INITIAL_AUDIT_LOGS.find(
    (l) => l.performer_name === 'Trần Văn B' && l.entity_id === 'TARGET-01' && l.entity_type === 'TARGET'
  )
  assert.ok(case2, 'Không tìm thấy bản ghi Chỉ tiêu TARGET-01 của Trần Văn B')
  assert.equal(case2.old_value, '100.000.000')
  assert.equal(case2.new_value, '150.000.000')

  // 3. Lê Văn C thay đổi Quyền sở hữu KH002 từ Nguyễn Văn A -> Trần Văn B
  const case3 = INITIAL_AUDIT_LOGS.find(
    (l) => l.performer_name === 'Lê Văn C' && l.entity_id === 'KH002' && l.entity_type === 'OWNERSHIP'
  )
  assert.ok(case3, 'Không tìm thấy bản ghi Quyền sở hữu KH002 của Lê Văn C')
  assert.equal(case3.old_value, 'Nguyễn Văn A')
  assert.equal(case3.new_value, 'Trần Văn B')

  // 4. Nguyễn Văn A thay đổi Vai trò USER-005 từ USER -> MANAGER
  const case4 = INITIAL_AUDIT_LOGS.find(
    (l) => l.performer_name === 'Nguyễn Văn A' && l.entity_id === 'USER-005' && l.entity_type === 'USER_ROLE'
  )
  assert.ok(case4, 'Không tìm thấy bản ghi Vai trò USER-005 của Nguyễn Văn A')
  assert.equal(case4.old_value, 'USER')
  assert.equal(case4.new_value, 'MANAGER')
})

console.log('\n[2. KIỂM THỬ BỘ LỌC TÌM KIẾM & PHÂN TRANG (SERVICE)]')

await runTest('2.1. Lấy toàn bộ danh sách khi không có bộ lọc', async () => {
  const res = await getAuditLogs({ page: 1, pageSize: 20 })
  assert.equal(res.success, true)
  assert.equal(res.total, INITIAL_AUDIT_LOGS.length)
  assert.equal(res.data.length, INITIAL_AUDIT_LOGS.length)
})

await runTest('2.2. Lọc theo Người thực hiện (Performer)', async () => {
  const res = await getAuditLogs({ performer_name: 'Trần Văn B', pageSize: 20 })
  assert.equal(res.success, true)
  assert.ok(res.data.length > 0)
  res.data.forEach((item) => {
    assert.equal(item.performer_name, 'Trần Văn B')
  })
})

await runTest('2.3. Lọc theo Loại đối tượng: Chiết khấu (DISCOUNT)', async () => {
  const res = await getAuditLogs({ entity_type: 'DISCOUNT', pageSize: 20 })
  assert.equal(res.success, true)
  assert.ok(res.data.length > 0)
  res.data.forEach((item) => {
    assert.equal(item.entity_type, 'DISCOUNT')
  })
})

await runTest('2.4. Lọc theo Loại đối tượng: Chỉ tiêu (TARGET)', async () => {
  const res = await getAuditLogs({ entity_type: 'TARGET', pageSize: 20 })
  assert.equal(res.success, true)
  assert.ok(res.data.length > 0)
  res.data.forEach((item) => {
    assert.equal(item.entity_type, 'TARGET')
  })
})

await runTest('2.5. Lọc theo Khoảng thời gian (From / To date)', async () => {
  // Lọc chỉ trong ngày 02/10/2026
  const res = await getAuditLogs({ from_date: '2026-10-02', to_date: '2026-10-02', pageSize: 20 })
  assert.equal(res.success, true)
  assert.equal(res.data.length, 2)
  res.data.forEach((item) => {
    assert.ok(item.timestamp.startsWith('2026-10-02'))
  })
})

await runTest('2.6. Khoảng thời gian không có dữ liệu trả về mảng rỗng (Empty State)', async () => {
  const res = await getAuditLogs({ from_date: '2026-11-01', to_date: '2026-11-30' })
  assert.equal(res.success, true)
  assert.equal(res.total, 0)
  assert.equal(res.data.length, 0)
})

await runTest('2.7. Kết hợp nhiều bộ lọc (Người thực hiện + Loại đối tượng + Từ khóa)', async () => {
  const res = await getAuditLogs({
    performer_name: 'Nguyễn Văn A',
    entity_type: 'DISCOUNT',
    search_keyword: 'KH001',
    pageSize: 10,
  })
  assert.equal(res.success, true)
  assert.equal(res.total, 1)
  assert.equal(res.data[0].entity_id, 'KH001')
  assert.equal(res.data[0].performer_name, 'Nguyễn Văn A')
  assert.equal(res.data[0].entity_type, 'DISCOUNT')
})

await runTest('2.8. Phân trang (Pagination) tính đúng trang và tổng số trang', async () => {
  const resPage1 = await getAuditLogs({ page: 1, pageSize: 5 })
  assert.equal(resPage1.page, 1)
  assert.equal(resPage1.pageSize, 5)
  assert.equal(resPage1.data.length, 5)
  assert.equal(resPage1.totalPages, Math.ceil(INITIAL_AUDIT_LOGS.length / 5))

  const resPage2 = await getAuditLogs({ page: 2, pageSize: 5 })
  assert.equal(resPage2.page, 2)
  assert.equal(resPage2.data.length, 5)
  // Đảm bảo không trùng bản ghi giữa trang 1 và trang 2
  assert.notEqual(resPage1.data[0].id, resPage2.data[0].id)
})

console.log('\n[3. KIỂM THỬ TIỆN ÍCH ĐỊNH DẠNG & DANH SÁCH DROPDOWN]')

await runTest('3.1. getDistinctPerformers trả về danh sách người thực hiện không trùng lặp', () => {
  const list = getDistinctPerformers()
  assert.ok(list.length >= 3)
  assert.ok(list.includes('Nguyễn Văn A'))
  assert.ok(list.includes('Trần Văn B'))
  assert.ok(list.includes('Lê Văn C'))
  // Kiểm tra không trùng lặp
  const set = new Set(list)
  assert.equal(set.size, list.length)
})

await runTest('3.2. formatAuditDate định dạng ngày chuẩn DD/MM/YYYY HH:mm', () => {
  const formatted = formatAuditDate('2026-10-02T09:15:00+07:00')
  assert.equal(formatted, '02/10/2026 09:15')
})

console.log('\n[4. KIỂM THỬ KHÔNG PHÁ VỠ CÁC TÍNH NĂNG TRƯỚC (REGRESSION)]')

await runTest('4.1. Validate Họ và tên (S2-02) hoạt động chuẩn', () => {
  assert.equal(validateFullName('Nguyễn Văn An').isValid, true)
  assert.equal(validateFullName('').isValid, false)
})

await runTest('4.2. Validate Số điện thoại VN (S2-02) hoạt động chuẩn', () => {
  assert.equal(validateVietnamesePhone('0901234567', false).isValid, true)
  assert.equal(validateVietnamesePhone('+84901234567', false).isValid, true)
  assert.equal(validateVietnamesePhone('123456', false).isValid, false)
})

await runTest('4.3. Validate Avatar (S2-03) hoạt động chuẩn', () => {
  const validFile = { name: 'avatar.jpg', size: 1024 * 1024, type: 'image/jpeg' }
  assert.equal(validateAvatarFile(validFile).isValid, true)

  const heavyFile = { name: 'avatar.png', size: 3 * 1024 * 1024, type: 'image/png' }
  assert.equal(validateAvatarFile(heavyFile).isValid, false)

  const wrongType = { name: 'doc.pdf', size: 50 * 1024, type: 'application/pdf' }
  assert.equal(validateAvatarFile(wrongType).isValid, false)
})

console.log('\n─────────────────────────────────────────────────────────────')
console.log(`📊 TỔNG KẾT KIỂM THỬ S2-04: ${passedTests}/${totalTests} PASSED`)
console.log('─────────────────────────────────────────────────────────────\n')

if (passedTests !== totalTests) {
  process.exit(1)
}
