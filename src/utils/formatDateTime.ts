/**
 * formatDateTime.ts
 * Tiện ích định dạng ngày tháng thống nhất chuẩn dd/MM/yyyy và dd/MM/yyyy HH:mm theo yêu cầu của Mentor.
 */

/**
 * Định dạng ngày sang dd/MM/yyyy (VD: 2026-02-01 -> 01/02/2026)
 */
export function formatDateVN(val: string | Date | undefined | null): string {
  if (!val) return '—'
  const date = typeof val === 'string' ? new Date(val) : val
  if (isNaN(date.getTime())) {
    // Nếu là chuỗi dạng yyyy-mm-dd
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      const parts = val.split('T')[0].split('-')
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
    }
    return String(val)
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Định dạng ngày giờ sang dd/MM/yyyy HH:mm (VD: 2026-02-01T14:30:00 -> 01/02/2026 14:30)
 */
export function formatDateTimeVN(val: string | Date | undefined | null): string {
  if (!val) return '—'
  const date = typeof val === 'string' ? new Date(val) : val
  if (isNaN(date.getTime())) return String(val)

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}
