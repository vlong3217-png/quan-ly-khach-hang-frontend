/**
 * Tiện ích định dạng tiền tệ VNĐ chuẩn có dấu phẩy phân cách hàng nghìn (VD: 50,000,000 VNĐ)
 */
export function formatCurrencyVND(val: number | string | undefined | null): string {
  if (val === undefined || val === null || val === '') return '0 VNĐ'
  const num = typeof val === 'number' ? val : Number(val)
  if (isNaN(num)) return '0 VNĐ'
  return num.toLocaleString('en-US') + ' VNĐ'
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
