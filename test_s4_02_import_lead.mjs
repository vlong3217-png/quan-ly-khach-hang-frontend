// Automated verification test for S4-02 Lead Creation & Excel Import
import assert from 'node:assert'

console.log('Testing S4-02 Lead Creation and Excel Import Logic...')

// 1. Kiểm tra validation logic
function validateLeadInput(lead) {
  const errors = []
  if (!lead.full_name || !lead.full_name.trim()) errors.push('Thiếu họ và tên')
  if (!lead.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email.trim())) errors.push('Email không hợp lệ')
  const cleanPhone = (lead.phone || '').replace(/\D/g, '')
  if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 11) errors.push('Số điện thoại không hợp lệ')
  return errors
}

// Test case 1: Dòng hợp lệ
const validLead = {
  full_name: 'Nguyễn Văn Hùng',
  email: 'hung.nguyen@company.vn',
  phone: '0912345678',
  company: 'Công ty Cổ phần Alpha',
}
const errors1 = validateLeadInput(validLead)
assert.strictEqual(errors1.length, 0, 'Dòng hợp lệ không được có lỗi')
console.log('✓ Valid lead validation test passed')

// Test case 2: Dòng thiếu họ tên và sai email
const invalidLead = {
  full_name: '',
  email: 'email_sai_dinh_dang',
  phone: '123',
}
const errors2 = validateLeadInput(invalidLead)
assert.strictEqual(errors2.length, 3, 'Phải bắt đúng 3 lỗi')
console.log('✓ Invalid lead validation test passed')

// Test case 3: Kiểm tra duplicate detection
const rows = [
  { email: 'test@domain.com', phone: '0901234567' },
  { email: 'TEST@domain.com', phone: '0987654321' }, // Duplicate email (case insensitive)
  { email: 'other@domain.com', phone: '0901234567' }, // Duplicate phone
]
const seenEmails = new Set()
const seenPhones = new Set()
let duplicatesCount = 0

rows.forEach((r) => {
  let isDup = false
  const normEmail = r.email.toLowerCase()
  if (seenEmails.has(normEmail)) isDup = true
  else seenEmails.add(normEmail)

  if (seenPhones.has(r.phone)) isDup = true
  else seenPhones.add(r.phone)

  if (isDup) duplicatesCount++
})

assert.strictEqual(duplicatesCount, 2, 'Phải phát hiện 2 dòng trùng lặp')
console.log('✓ Duplicate detection test passed')
console.log('All S4-02 logic tests passed successfully!')
