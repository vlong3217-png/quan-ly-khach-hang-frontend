/**
 * Tiện ích định dạng tiền tệ chuẩn vi-VN theo hướng dẫn của Mentor (VD: 90.000.000 ₫)
 */
export function formatCurrencyVND(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0 ₫'
  const num = typeof val === 'number' ? val : Number(val)
  if (isNaN(num)) return '0 ₫'
  // Thống nhất định dạng tiền tệ vi-VN: 90.000.000 ₫
  return `${new Intl.NumberFormat('vi-VN').format(num)} ₫`
}

/**
 * Định dạng chuỗi số nhập liệu tự động chèn dấu phẩy phân cách (VD: 50000000 -> 50,000,000)
 */
export function formatNumberWithCommas(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return ''
  const clean = String(val).replace(/\D/g, '')
  if (!clean) return ''
  return Number(clean).toLocaleString('en-US')
}

/**
 * Chuyển đổi chuỗi có dấu phẩy ngược lại thành số nguyên (VD: "50,000,000" -> 50000000)
 */
export function parseNumberFromCommas(val: string | number | undefined | null): number {
  if (!val) return 0
  const clean = String(val).replace(/,/g, '').trim()
  const num = Number(clean)
  return isNaN(num) ? 0 : num
}
