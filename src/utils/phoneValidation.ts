/* ──────────── Phone & Name Validation Utils (S2-02) ──────────── */

/**
 * Biểu thức chính quy kiểm tra số điện thoại Việt Nam:
 * - Đầu số di động 10 số: 03x, 05x, 07x, 08x, 09x (Viettel, Vinaphone, Mobifone, Vietnamobile, Wintel, Gmobile...)
 * - Đầu số cố định 11 số: 02x (Hà Nội 024, TP.HCM 028, các tỉnh thành 02xx...)
 * - Định dạng quốc tế: +84 theo sau bởi 9 số di động (+843x, +845x, +847x, +848x, +849x) hoặc 10 số cố định (+842x)
 */
export const VN_PHONE_REGEX = /^(?:0|\+84)(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9\d|2\d{2})\d{7}$/

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Kiểm tra định dạng số điện thoại Việt Nam.
 *
 * Các trường hợp xử lý:
 * 1. Bỏ trống / undefined / chuỗi rỗng:
 *    - Nếu isRequired = false (mặc định): Hợp lệ (trường không bắt buộc).
 *    - Nếu isRequired = true: Không hợp lệ, yêu cầu nhập số điện thoại.
 * 2. Ký tự không hợp lệ:
 *    - Chứa chữ cái hoặc ký tự đặc biệt ngoài khoảng trắng, dấu gạch nối, dấu chấm, dấu ngoặc đơn, dấu + ở đầu.
 * 3. Sai định dạng:
 *    - Không bắt đầu bằng 0 hoặc +84.
 *    - Thiếu hoặc thừa chữ số so với quy chuẩn mạng viễn thông Việt Nam.
 *    - Đầu số mạng không tồn tại ở Việt Nam.
 * 4. Số điện thoại hợp lệ:
 *    - Đúng định dạng chuẩn di động hoặc cố định Việt Nam (ví dụ: 0901234567, +84901234567, 0381234567, 0912 345 678...).
 */
export function validateVietnamesePhone(
  phone?: string | null,
  isRequired: boolean = false
): ValidationResult {
  if (!phone || !phone.trim()) {
    if (isRequired) {
      return {
        isValid: false,
        error: 'Số điện thoại không được để trống.',
      }
    }
    return { isValid: true }
  }

  const raw = phone.trim()

  // Kiểm tra ký tự bất hợp pháp (chỉ cho phép số, khoảng trắng, dấu gạch nối, chấm, ngoặc đơn, và dấu + ở vị trí đầu)
  if (/[^\d\s.()+-]/.test(raw) || (raw.includes('+') && !raw.startsWith('+'))) {
    return {
      isValid: false,
      error: 'Số điện thoại chứa ký tự không hợp lệ. Chỉ chấp nhận chữ số và dấu + ở đầu.',
    }
  }

  // Chuẩn hóa: loại bỏ khoảng trắng, dấu chấm, dấu ngoặc, dấu gạch nối
  const cleaned = raw.replace(/[\s.()-]/g, '')

  // Kiểm tra tiền tố quốc gia hoặc mã vùng Việt Nam
  if (!cleaned.startsWith('0') && !cleaned.startsWith('+84')) {
    return {
      isValid: false,
      error: 'Số điện thoại Việt Nam phải bắt đầu bằng 0 hoặc +84.',
    }
  }

  // Kiểm tra độ dài chữ số
  const digitsOnly = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned
  if (digitsOnly.length < 10) {
    return {
      isValid: false,
      error: 'Số điện thoại quá ngắn. Số điện thoại Việt Nam phải có 10 chữ số (hoặc 11 số đối với máy bàn).',
    }
  }
  if (digitsOnly.length > 12) {
    return {
      isValid: false,
      error: 'Số điện thoại quá dài. Vui lòng kiểm tra lại.',
    }
  }

  // Khớp với biểu thức chính quy số điện thoại Việt Nam
  if (!VN_PHONE_REGEX.test(cleaned)) {
    return {
      isValid: false,
      error: 'Số điện thoại không đúng định dạng Việt Nam (ví dụ: 0901234567 hoặc +84901234567).',
    }
  }

  return { isValid: true }
}

/**
 * Kiểm tra hợp lệ của Họ và tên:
 * - Bắt buộc nhập (không được để trống).
 * - Tối thiểu 2 ký tự.
 * - Tối đa 100 ký tự.
 */
export function validateFullName(name?: string | null): ValidationResult {
  if (!name || !name.trim()) {
    return {
      isValid: false,
      error: 'Họ tên không được để trống.',
    }
  }

  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: 'Họ tên phải có ít nhất 2 ký tự.',
    }
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: 'Họ tên không được vượt quá 100 ký tự.',
    }
  }

  return { isValid: true }
}

/**
 * Định dạng hiển thị số điện thoại Việt Nam đẹp mắt (ví dụ: 0901 234 567 hoặc +84 901 234 567)
 */
export function formatVietnamesePhone(phone: string): string {
  const cleaned = phone.replace(/[\s.()-]/g, '')
  if (cleaned.startsWith('+84') && cleaned.length === 12) {
    return `+84 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return phone
}
