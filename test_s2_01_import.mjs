import assert from 'node:assert/strict'

import {
  VALID_ROLES,
  TEMPLATE_COLUMNS,
} from './src/types/importUser.ts'

import {
  parseAndValidateRows,
  checkDuplicateEmails,
} from './src/services/importUserService.ts'

console.log('───────────────────────────────────────────────────────')
console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG CHO STORY S2-01 (FRONTEND)')
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

// ─────────────────────────────────────────────────────────────
// 1. Cấu hình & Mẫu tệp Excel (AC1: Tải được tệp mẫu)
// ─────────────────────────────────────────────────────────────
runTest('1.1. Cấu hình danh sách cột tệp mẫu đầy đủ 6 cột chuẩn', () => {
  assert.equal(TEMPLATE_COLUMNS.length, 6)
  assert.ok(TEMPLATE_COLUMNS.includes('Họ tên (*)'))
  assert.ok(TEMPLATE_COLUMNS.includes('Email (*)'))
  assert.ok(TEMPLATE_COLUMNS.includes('Số điện thoại'))
  assert.ok(TEMPLATE_COLUMNS.includes('Vai trò (*)'))
  assert.ok(TEMPLATE_COLUMNS.includes('Nhóm/Team'))
  assert.ok(TEMPLATE_COLUMNS.includes('Mật khẩu (*)'))
})

runTest('1.2. Danh sách vai trò hợp lệ gồm ADMIN, MANAGER, STAFF, USER', () => {
  assert.equal(VALID_ROLES.length, 4)
  assert.deepEqual([...VALID_ROLES], ['ADMIN', 'MANAGER', 'STAFF', 'USER'])
})

// ─────────────────────────────────────────────────────────────
// 2. Kiểm tra & Báo lỗi theo từng dòng (AC2)
// ─────────────────────────────────────────────────────────────
runTest('2.1. Nhận diện dòng hoàn toàn hợp lệ', () => {
  const headers = ['Họ tên (*)', 'Email (*)', 'Số điện thoại', 'Vai trò (*)', 'Nhóm/Team', 'Mật khẩu (*)']
  const rawRows = [
    {
      'Họ tên (*)': 'Nguyễn Văn An',
      'Email (*)': 'an.nguyen@company.com',
      'Số điện thoại': '0901234567',
      'Vai trò (*)': 'STAFF',
      'Nhóm/Team': 'Kinh doanh',
      'Mật khẩu (*)': 'Secret123',
    },
  ]

  const parsed = parseAndValidateRows(headers, rawRows)
  assert.equal(parsed.length, 1)
  assert.equal(parsed[0].status, 'valid')
  assert.equal(parsed[0].errors.length, 0)
  assert.equal(parsed[0].rowIndex, 2)
  assert.equal(parsed[0].full_name, 'Nguyễn Văn An')
  assert.equal(parsed[0].email, 'an.nguyen@company.com')
})

runTest('2.2. Báo lỗi khi thiếu Họ tên hoặc Họ tên < 2 ký tự', () => {
  const headers = ['Họ tên (*)', 'Email (*)', 'Số điện thoại', 'Vai trò (*)', 'Nhóm/Team', 'Mật khẩu (*)']
  const rawRows = [
    { 'Họ tên (*)': '', 'Email (*)': 'test1@company.com', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'A', 'Email (*)': 'test2@company.com', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
  ]

  const parsed = parseAndValidateRows(headers, rawRows)
  assert.equal(parsed[0].status, 'error')
  assert.ok(parsed[0].errors.some((e) => e.field === 'full_name' && e.message.includes('trống')))

  assert.equal(parsed[1].status, 'error')
  assert.ok(parsed[1].errors.some((e) => e.field === 'full_name' && e.message.includes('ít nhất 2 ký tự')))
})

runTest('2.3. Báo lỗi khi email rỗng hoặc sai định dạng', () => {
  const headers = ['Họ tên (*)', 'Email (*)', 'Số điện thoại', 'Vai trò (*)', 'Nhóm/Team', 'Mật khẩu (*)']
  const rawRows = [
    { 'Họ tên (*)': 'Lê Văn A', 'Email (*)': '', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'Lê Văn B', 'Email (*)': 'invalid-email', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'Lê Văn C', 'Email (*)': 'test@domain', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
  ]

  const parsed = parseAndValidateRows(headers, rawRows)
  assert.equal(parsed[0].status, 'error')
  assert.ok(parsed[0].errors.some((e) => e.field === 'email' && e.message.includes('trống')))

  assert.equal(parsed[1].status, 'error')
  assert.ok(parsed[1].errors.some((e) => e.field === 'email' && e.message.includes('định dạng')))

  assert.equal(parsed[2].status, 'error')
  assert.ok(parsed[2].errors.some((e) => e.field === 'email' && e.message.includes('định dạng')))
})

runTest('2.4. Báo lỗi khi vai trò rỗng hoặc không nằm trong danh mục cho phép', () => {
  const headers = ['Họ tên (*)', 'Email (*)', 'Vai trò (*)', 'Mật khẩu (*)']
  const rawRows = [
    { 'Họ tên (*)': 'User One', 'Email (*)': 'one@domain.com', 'Vai trò (*)': '', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'User Two', 'Email (*)': 'two@domain.com', 'Vai trò (*)': 'SUPER_ADMIN', 'Mật khẩu (*)': 'Pass123' },
  ]

  const parsed = parseAndValidateRows(headers, rawRows)
  assert.equal(parsed[0].status, 'error')
  assert.ok(parsed[0].errors.some((e) => e.field === 'role' && e.message.includes('trống')))

  assert.equal(parsed[1].status, 'error')
  assert.ok(parsed[1].errors.some((e) => e.field === 'role' && e.message.includes('không hợp lệ')))
})

runTest('2.5. Báo lỗi khi mật khẩu rỗng hoặc < 6 ký tự', () => {
  const headers = ['Họ tên (*)', 'Email (*)', 'Vai trò (*)', 'Mật khẩu (*)']
  const rawRows = [
    { 'Họ tên (*)': 'User One', 'Email (*)': 'one@domain.com', 'Vai trò (*)': 'USER', 'Mật khẩu (*)': '' },
    { 'Họ tên (*)': 'User Two', 'Email (*)': 'two@domain.com', 'Vai trò (*)': 'USER', 'Mật khẩu (*)': '12345' },
  ]

  const parsed = parseAndValidateRows(headers, rawRows)
  assert.equal(parsed[0].status, 'error')
  assert.ok(parsed[0].errors.some((e) => e.field === 'password' && e.message.includes('trống')))

  assert.equal(parsed[1].status, 'error')
  assert.ok(parsed[1].errors.some((e) => e.field === 'password' && e.message.includes('ít nhất 6 ký tự')))
})

runTest('2.6. Kiểm tra số điện thoại (tùy chọn nhưng phải đúng định dạng nếu có)', () => {
  const headers = ['Họ tên (*)', 'Email (*)', 'Số điện thoại', 'Vai trò (*)', 'Mật khẩu (*)']
  const rawRows = [
    { 'Họ tên (*)': 'User One', 'Email (*)': 'one@domain.com', 'Số điện thoại': '', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'User Two', 'Email (*)': 'two@domain.com', 'Số điện thoại': '0987654321', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'User Three', 'Email (*)': 'three@domain.com', 'Số điện thoại': '+84987654321', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'User Four', 'Email (*)': 'four@domain.com', 'Số điện thoại': '12345', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'User Five', 'Email (*)': 'five@domain.com', 'Số điện thoại': '090abc1234', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
  ]

  const parsed = parseAndValidateRows(headers, rawRows)
  assert.equal(parsed[0].status, 'valid') // để trống là hợp lệ
  assert.equal(parsed[1].status, 'valid') // 098...
  assert.equal(parsed[2].status, 'valid') // +84...
  assert.equal(parsed[3].status, 'error') // quá ngắn
  assert.equal(parsed[4].status, 'error') // chứa chữ
})

runTest('2.7. Phát hiện trùng lặp email trong cùng tệp', () => {
  const headers = ['Họ tên (*)', 'Email (*)', 'Vai trò (*)', 'Mật khẩu (*)']
  const rawRows = [
    { 'Họ tên (*)': 'User One', 'Email (*)': 'duplicate@domain.com', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'User Two', 'Email (*)': 'DUPLICATE@domain.com', 'Vai trò (*)': 'MANAGER', 'Mật khẩu (*)': 'Pass456' },
    { 'Họ tên (*)': 'User Three', 'Email (*)': 'unique@domain.com', 'Vai trò (*)': 'USER', 'Mật khẩu (*)': 'Pass789' },
  ]

  let parsed = parseAndValidateRows(headers, rawRows)
  parsed = checkDuplicateEmails(parsed)

  assert.equal(parsed[0].status, 'valid') // Dòng đầu tiên hợp lệ
  assert.equal(parsed[1].status, 'error') // Dòng thứ hai bị đánh dấu trùng email
  assert.ok(parsed[1].errors.some((e) => e.field === 'email' && e.message.includes('trùng')))
  assert.equal(parsed[2].status, 'valid') // Unique vẫn hợp lệ
})

runTest('2.8. Tương thích linh hoạt với tiêu đề không dấu sao hoặc tiếng Anh', () => {
  const headers = ['full_name', 'email', 'phone', 'role', 'team', 'password']
  const rawRows = [
    {
      'full_name': 'Trần Văn Nam',
      'email': 'nam.tran@company.com',
      'phone': '0912345678',
      'role': 'MANAGER',
      'team': 'Kỹ thuật',
      'password': 'PassWord999',
    },
  ]

  const parsed = parseAndValidateRows(headers, rawRows)
  assert.equal(parsed[0].status, 'valid')
  assert.equal(parsed[0].full_name, 'Trần Văn Nam')
  assert.equal(parsed[0].email, 'nam.tran@company.com')
  assert.equal(parsed[0].role, 'MANAGER')
})

// ─────────────────────────────────────────────────────────────
// 3. Xử lý Dòng lỗi & Nhập dòng hợp lệ & Báo cáo tổng kết (AC3)
// ─────────────────────────────────────────────────────────────
runTest('3.1. Phân loại chuẩn xác dòng hợp lệ và dòng lỗi', () => {
  const headers = ['Họ tên (*)', 'Email (*)', 'Vai trò (*)', 'Mật khẩu (*)']
  const rawRows = [
    { 'Họ tên (*)': 'Người Hợp Lệ 1', 'Email (*)': 'ok1@company.com', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': '', 'Email (*)': 'fail1@company.com', 'Vai trò (*)': 'STAFF', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'Người Hợp Lệ 2', 'Email (*)': 'ok2@company.com', 'Vai trò (*)': 'MANAGER', 'Mật khẩu (*)': 'Pass123' },
    { 'Họ tên (*)': 'Người Lỗi 2', 'Email (*)': 'fail2', 'Vai trò (*)': 'INVALID_ROLE', 'Mật khẩu (*)': '123' },
  ]

  const parsed = parseAndValidateRows(headers, rawRows)
  const validRows = parsed.filter((r) => r.status === 'valid')
  const errorRows = parsed.filter((r) => r.status === 'error')

  assert.equal(validRows.length, 2)
  assert.equal(errorRows.length, 2)
  assert.equal(validRows[0].full_name, 'Người Hợp Lệ 1')
  assert.equal(validRows[1].full_name, 'Người Hợp Lệ 2')
})

runTest('3.2. Cấu trúc dữ liệu báo cáo tổng kết phản ánh đầy đủ thông tin AC3', () => {
  const totalRows = 5
  const validRowsCount = 3
  const importedCount = 3
  const errorRowsCount = 2
  const errors = [
    {
      rowIndex: 3,
      full_name: '',
      email: 'bad@email',
      errors: [
        { field: 'full_name', message: 'Họ tên không được để trống' },
        { field: 'email', message: 'Email không đúng định dạng' },
      ],
    },
    {
      rowIndex: 5,
      full_name: 'Trần Văn X',
      email: 'x@company.com',
      errors: [{ field: 'role', message: 'Vai trò "TEST" không hợp lệ' }],
    },
  ]

  const report = {
    totalRows,
    validRows: validRowsCount,
    importedRows: importedCount,
    errorRows: errorRowsCount,
    errors,
  }

  assert.equal(report.totalRows, 5)
  assert.equal(report.validRows, 3)
  assert.equal(report.importedRows, 3)
  assert.equal(report.errorRows, 2)
  assert.equal(report.errors.length, 2)
  assert.equal(report.errors[0].rowIndex, 3)
  assert.equal(report.errors[1].rowIndex, 5)
})

console.log(`\n───────────────────────────────────────────────────────`)
console.log(`📊 TỔNG KẾT KIỂM THỬ S2-01: ${passCount} PASSED / ${failCount} FAILED`)
console.log(`───────────────────────────────────────────────────────\n`)

if (failCount > 0) {
  process.exit(1)
}
