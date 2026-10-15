/**
 * Tiện ích chuyển đổi số tiền (VNĐ) thành chữ tiếng Việt chuẩn xác.
 * Phục vụ in hóa đơn, báo giá, hợp đồng theo tiêu chuẩn kế toán Việt Nam.
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']

function readThreeDigits(n: number, readZeroHundreds: boolean): string {
  const hundreds = Math.floor(n / 100)
  const remainder = n % 100
  const tens = Math.floor(remainder / 10)
  const units = remainder % 10

  let result = ''

  if (hundreds > 0 || readZeroHundreds) {
    result += `${DIGITS[hundreds]} trăm `
  }

  if (tens === 0 && units > 0) {
    if (hundreds > 0 || readZeroHundreds) {
      result += 'linh '
    }
    result += DIGITS[units]
  } else if (tens === 1) {
    result += 'mười '
    if (units === 5) {
      result += 'lăm'
    } else if (units > 0) {
      result += DIGITS[units]
    }
  } else if (tens > 1) {
    result += `${DIGITS[tens]} mươi `
    if (units === 1) {
      result += 'mốt'
    } else if (units === 5) {
      result += 'lăm'
    } else if (units > 0) {
      result += DIGITS[units]
    }
  }

  return result.trim()
}

/**
 * Chuyển đổi số tiền thành chữ tiếng Việt (Kèm đơn vị "đồng" hoặc "đồng chẵn")
 * Ví dụ: 15,500,000 -> "Mười lăm triệu năm trăm nghìn đồng chẵn."
 */
export function numberToVietnameseWords(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || amount === '') return 'Không đồng'
  const num = typeof amount === 'number' ? Math.round(amount) : Math.round(Number(amount))
  if (isNaN(num) || num === 0) return 'Không đồng'
  if (num < 0) return 'Âm ' + numberToVietnameseWords(Math.abs(num)).toLowerCase()

  let n = num
  const groups: number[] = []

  while (n > 0) {
    groups.push(n % 1000)
    n = Math.floor(n / 1000)
  }

  const scales = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ']
  const resultParts: string[] = []

  for (let i = groups.length - 1; i >= 0; i--) {
    const val = groups[i]
    if (val > 0) {
      // Đọc 'không trăm' nếu đây không phải là nhóm cao nhất
      const readZeroHundreds = i < groups.length - 1
      const words = readThreeDigits(val, readZeroHundreds)
      const scale = scales[i]
      resultParts.push(`${words} ${scale}`.trim())
    }
  }

  let finalStr = resultParts.join(' ').trim()
  // Viết hoa chữ cái đầu tiên
  finalStr = finalStr.charAt(0).toUpperCase() + finalStr.slice(1)
  return `${finalStr} đồng chẵn.`
}
