/**
 * test_s2_03_avatar.mjs
 * Test suite tự động cho User Story S2-03: Tải lên và cắt ảnh đại diện (Frontend)
 */

import assert from 'node:assert/strict'
import {
  validateAvatarFile,
  MAX_AVATAR_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  saveAvatarToStorage,
  getAvatarFromStorage,
  getThumbnailFromStorage,
  removeAvatarFromStorage,
  getAvatarStorageKey,
} from './src/services/avatarService.ts'
import { validateFullName, validateVietnamesePhone } from './src/utils/phoneValidation.ts'

// Mock File class cho môi trường Node.js nếu cần
class MockFile {
  constructor(name, size, type) {
    this.name = name
    this.size = size
    this.type = type
  }
}

// Mock localStorage cho Node.js test
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

function runTest(name, fn) {
  totalTests++
  try {
    fn()
    console.log(`  ✅ [PASS] ${name}`)
    passedTests++
  } catch (error) {
    console.error(`  ❌ [FAIL] ${name}`)
    console.error(`     Chi tiết: ${error.message}`)
    process.exitCode = 1
  }
}

console.log('───────────────────────────────────────────────────────')
console.log('🧪 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG USER STORY S2-03 (AVATAR)')
console.log('───────────────────────────────────────────────────────')

console.log('\n[1. KIỂM THỬ ĐỊNH DẠNG FILE & CẤU HÌNH HỆ THỐNG]')

runTest('1.1. Cấu hình dung lượng tối đa là 2MB', () => {
  assert.equal(MAX_AVATAR_FILE_SIZE, 2 * 1024 * 1024, 'MAX_AVATAR_FILE_SIZE phải bằng 2097152 bytes')
})

runTest('1.2. MIME type chỉ chấp nhận image/jpeg và image/png', () => {
  assert.deepEqual(ALLOWED_MIME_TYPES, ['image/jpeg', 'image/png'])
  assert.deepEqual(ALLOWED_EXTENSIONS, ['.jpg', '.jpeg', '.png'])
})

console.log('\n[2. KIỂM THỬ VALIDATION FILE ẢNH ĐẠI DIỆN]')

runTest('2.1. File JPG hợp lệ (< 2MB) được chấp nhận', () => {
  const file = new MockFile('avatar.jpg', 500 * 1024, 'image/jpeg')
  const result = validateAvatarFile(file)
  assert.equal(result.isValid, true)
  assert.equal(result.error, undefined)
})

runTest('2.2. File JPEG hợp lệ (< 2MB) được chấp nhận', () => {
  const file = new MockFile('profile_pic.jpeg', 1024 * 1024, 'image/jpeg')
  const result = validateAvatarFile(file)
  assert.equal(result.isValid, true)
})

runTest('2.3. File PNG hợp lệ (< 2MB) được chấp nhận', () => {
  const file = new MockFile('photo.png', 1.8 * 1024 * 1024, 'image/png')
  const result = validateAvatarFile(file)
  assert.equal(result.isValid, true)
})

runTest('2.4. File đúng ngưỡng biên 2MB chính xác được chấp nhận', () => {
  const file = new MockFile('exact_limit.png', 2 * 1024 * 1024, 'image/png')
  const result = validateAvatarFile(file)
  assert.equal(result.isValid, true)
})

runTest('2.5. File vượt quá 2MB bị từ chối với thông báo rõ ràng', () => {
  const file = new MockFile('heavy_image.jpg', 2 * 1024 * 1024 + 1, 'image/jpeg')
  const result = validateAvatarFile(file)
  assert.equal(result.isValid, false)
  assert.match(result.error, /2MB/i, 'Thông báo phải nêu rõ giới hạn 2MB')
})

runTest('2.6. File ảnh GIF bị từ chối', () => {
  const file = new MockFile('animation.gif', 300 * 1024, 'image/gif')
  const result = validateAvatarFile(file)
  assert.equal(result.isValid, false)
  assert.match(result.error, /JPG hoặc PNG/i)
})

runTest('2.7. File ảnh WEBP bị từ chối', () => {
  const file = new MockFile('modern.webp', 200 * 1024, 'image/webp')
  const result = validateAvatarFile(file)
  assert.equal(result.isValid, false)
  assert.match(result.error, /JPG hoặc PNG/i)
})

runTest('2.8. File PDF hoặc văn bản bị từ chối', () => {
  const file = new MockFile('document.pdf', 100 * 1024, 'application/pdf')
  const result = validateAvatarFile(file)
  assert.equal(result.isValid, false)
  assert.match(result.error, /JPG hoặc PNG/i)
})

runTest('2.9. File rỗng (0 bytes) bị từ chối', () => {
  const file = new MockFile('empty.png', 0, 'image/png')
  const result = validateAvatarFile(file)
  assert.equal(result.isValid, false)
})

runTest('2.10. File null hoặc undefined xử lý an toàn không gây crash', () => {
  const resNull = validateAvatarFile(null)
  assert.equal(resNull.isValid, false)
  const resUndef = validateAvatarFile(undefined)
  assert.equal(resUndef.isValid, false)
})

console.log('\n[3. KIỂM THỬ LƯU TRỮ VÀ TÁI SỬ DỤNG AVATAR (STORAGE)]')

runTest('3.1. Lưu avatar và thumbnail vào storage thành công theo user id', () => {
  localStorage.clear()
  const userId = 42
  const mockAvatarData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...'
  const mockThumbnailData = 'data:image/jpeg;base64,/9j/thumbnail...'

  saveAvatarToStorage(userId, mockAvatarData, mockThumbnailData)

  const savedAvatar = getAvatarFromStorage(userId)
  const savedThumb = getThumbnailFromStorage(userId)

  assert.equal(savedAvatar, mockAvatarData)
  assert.equal(savedThumb, mockThumbnailData)
})

runTest('3.2. Reload / Đọc lại avatar từ storage bảo toàn dữ liệu', () => {
  const userId = 42
  // Giả lập dữ liệu đã có sẵn trong localStorage
  const savedAvatar = getAvatarFromStorage(userId)
  assert.ok(savedAvatar && savedAvatar.startsWith('data:image/jpeg;base64'))
})

runTest('3.3. Hủy / Xóa avatar khôi phục trạng thái mặc định', () => {
  const userId = 42
  removeAvatarFromStorage(userId)

  const deletedAvatar = getAvatarFromStorage(userId)
  const deletedThumb = getThumbnailFromStorage(userId)

  assert.equal(deletedAvatar, null)
  assert.equal(deletedThumb, null)
})

runTest('3.4. Khóa storage phân tách độc lập giữa các user khác nhau', () => {
  const user1 = 101
  const user2 = 102
  saveAvatarToStorage(user1, 'data:user1')
  saveAvatarToStorage(user2, 'data:user2')

  assert.equal(getAvatarFromStorage(user1), 'data:user1')
  assert.equal(getAvatarFromStorage(user2), 'data:user2')
  assert.equal(getAvatarStorageKey(user1), 'user_avatar_101')
  assert.equal(getAvatarStorageKey(user2), 'user_avatar_102')
})

console.log('\n[4. KIỂM THỬ TƯƠNG THÍCH VÀ KHÔNG PHÁ VỠ S2-02]')

runTest('4.1. Validate Họ và tên (S2-02) vẫn hoạt động chuẩn xác', () => {
  assert.equal(validateFullName('Nguyễn Văn An').isValid, true)
  assert.equal(validateFullName('').isValid, false)
  assert.equal(validateFullName('   ').isValid, false)
  assert.equal(validateFullName('A'.repeat(101)).isValid, false)
})

runTest('4.2. Validate Số điện thoại Việt Nam (S2-02) vẫn hoạt động chuẩn xác', () => {
  assert.equal(validateVietnamesePhone('0901234567', false).isValid, true)
  assert.equal(validateVietnamesePhone('+84901234567', false).isValid, true)
  assert.equal(validateVietnamesePhone('0381234567', false).isValid, true)
  assert.equal(validateVietnamesePhone('', false).isValid, true) // Không bắt buộc
  assert.equal(validateVietnamesePhone('123456', false).isValid, false)
  assert.equal(validateVietnamesePhone('0123456789', false).isValid, false)
})

console.log('\n───────────────────────────────────────────────────────')
console.log(`📊 TỔNG KẾT KIỂM THỬ S2-03: ${passedTests}/${totalTests} PASSED`)
console.log('───────────────────────────────────────────────────────\n')

if (passedTests !== totalTests) {
  process.exit(1)
}
