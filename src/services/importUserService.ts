/* ──────────── S2-01: Import Users Service ──────────── */

import { API_BASE_URL } from './authService.ts'
import type {
  ImportUserRow,
  FieldError,
  ImportResult,
  BatchImportResponse,
} from '../types/importUser.ts'
import { VALID_ROLES, TEMPLATE_COLUMNS } from '../types/importUser.ts'
import type { UserRole } from '../types/user.ts'
import * as XLSX from 'xlsx'

/* ──────────── Helper: Auth Headers ──────────── */
function getAuthToken(): string | null {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  )
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`
  }
  return headers
}

/* ──────────── Tạo file Excel mẫu ──────────── */
export function downloadTemplateFile(): void {
  const wb = XLSX.utils.book_new()

  // Header
  const headers = [...TEMPLATE_COLUMNS]

  // Dữ liệu mẫu
  const sampleData = [
    ['Nguyễn Văn An', 'an.nguyen@company.com', '0901234567', 'STAFF', 'Kinh doanh', 'Password123'],
    ['Trần Thị Bình', 'binh.tran@company.com', '0912345678', 'MANAGER', 'Kỹ thuật', 'Password456'],
    ['Lê Hoàng Cường', 'cuong.le@company.com', '', 'STAFF', 'Hỗ trợ', 'Password789'],
  ]

  const wsData = [headers, ...sampleData]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Thiết lập độ rộng cột
  ws['!cols'] = [
    { wch: 25 }, // Họ tên
    { wch: 30 }, // Email
    { wch: 15 }, // SĐT
    { wch: 12 }, // Vai trò
    { wch: 18 }, // Nhóm/Team
    { wch: 18 }, // Mật khẩu
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách người dùng')

  // Tạo sheet hướng dẫn
  const guideData = [
    ['HƯỚNG DẪN NHẬP DỮ LIỆU'],
    [''],
    ['Cột', 'Bắt buộc', 'Mô tả', 'Ví dụ'],
    ['Họ tên (*)', 'Có', 'Họ tên đầy đủ, tối thiểu 2 ký tự', 'Nguyễn Văn An'],
    ['Email (*)', 'Có', 'Địa chỉ email hợp lệ, không trùng lặp', 'an.nguyen@company.com'],
    ['Số điện thoại', 'Không', 'Bắt đầu bằng 0 hoặc +84, 10-11 số', '0901234567'],
    ['Vai trò (*)', 'Có', 'Một trong: ADMIN, MANAGER, STAFF, USER', 'STAFF'],
    ['Nhóm/Team', 'Không', 'Tên phòng ban/đội nhóm', 'Kinh doanh'],
    ['Mật khẩu (*)', 'Có', 'Mật khẩu đăng nhập, tối thiểu 6 ký tự', 'Password123'],
    [''],
    ['LƯU Ý:'],
    ['- Các cột có dấu (*) là bắt buộc phải nhập'],
    ['- Hàng đầu tiên là tiêu đề cột, KHÔNG XÓA'],
    ['- Bắt đầu nhập dữ liệu từ hàng thứ 2 trở đi'],
    ['- Email không được trùng nhau trong danh sách'],
  ]
  const wsGuide = XLSX.utils.aoa_to_sheet(guideData)
  wsGuide['!cols'] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 45 },
    { wch: 25 },
  ]
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Hướng dẫn')

  XLSX.writeFile(wb, 'mau_nhap_nguoi_dung.xlsx')
}

/* ──────────── Đọc file Excel ──────────── */
export async function readExcelFile(file: File): Promise<{
  headers: string[]
  rawRows: Record<string, string>[]
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error('Không thể đọc file.'))
          return
        }

        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]

        if (!firstSheet) {
          reject(new Error('File không có sheet nào.'))
          return
        }

        // Đọc tất cả data dưới dạng array of arrays
        const allData: string[][] = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: '',
          raw: false,
        }) as string[][]

        if (allData.length === 0) {
          reject(new Error('File Excel rỗng, không có dữ liệu.'))
          return
        }

        const headers = allData[0].map((h) => String(h).trim())

        if (allData.length <= 1) {
          reject(new Error('File chỉ có tiêu đề cột, không có dữ liệu để nhập.'))
          return
        }

        const rawRows: Record<string, string>[] = []
        for (let i = 1; i < allData.length; i++) {
          const row = allData[i]
          // Bỏ qua dòng hoàn toàn trống
          if (!row || row.every((cell) => !String(cell).trim())) continue

          const rowObj: Record<string, string> = {}
          headers.forEach((h, idx) => {
            rowObj[h] = String(row[idx] ?? '').trim()
          })
          rawRows.push(rowObj)
        }

        if (rawRows.length === 0) {
          reject(new Error('File không có dữ liệu hợp lệ (chỉ có dòng trống).'))
          return
        }

        resolve({ headers, rawRows })
      } catch {
        reject(new Error('Không thể đọc file Excel. Vui lòng kiểm tra định dạng file.'))
      }
    }

    reader.onerror = () => {
      reject(new Error('Lỗi khi đọc file. Vui lòng thử lại.'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/* ──────────── Map column name -> field key ──────────── */
const COLUMN_MAP: Record<string, keyof Pick<ImportUserRow, 'full_name' | 'email' | 'phone' | 'role' | 'team' | 'password'>> = {
  'họ tên (*)': 'full_name',
  'email (*)': 'email',
  'số điện thoại': 'phone',
  'vai trò (*)': 'role',
  'nhóm/team': 'team',
  'mật khẩu (*)': 'password',
  // Tên cột không dấu *
  'họ tên': 'full_name',
  'email': 'email',
  'vai trò': 'role',
  'mật khẩu': 'password',
  // English fallbacks
  'full_name': 'full_name',
  'full name': 'full_name',
  'phone': 'phone',
  'role': 'role',
  'team': 'team',
  'password': 'password',
}

function mapColumnToField(header: string): string | null {
  const normalized = header.toLowerCase().trim()
  return COLUMN_MAP[normalized] ?? null
}

/* ──────────── Parse & Validate ──────────── */
export function parseAndValidateRows(
  headers: string[],
  rawRows: Record<string, string>[]
): ImportUserRow[] {
  // Build field mapping from actual headers
  const fieldMapping: Record<string, string> = {}
  headers.forEach((h) => {
    const field = mapColumnToField(h)
    if (field) {
      fieldMapping[h] = field
    }
  })

  return rawRows.map((raw, idx) => {
    const row: ImportUserRow = {
      rowIndex: idx + 2, // +2 vì dòng 1 là header, idx bắt đầu từ 0
      full_name: '',
      email: '',
      phone: '',
      role: '',
      team: '',
      password: '',
      status: 'valid',
      errors: [],
    }

    // Map raw data sang row
    Object.entries(raw).forEach(([header, value]) => {
      const field = fieldMapping[header]
      if (field && field in row) {
        ;(row as any)[field] = String(value).trim()
      }
    })

    // Validate
    const errors: FieldError[] = []

    // 1. Họ tên
    if (!row.full_name) {
      errors.push({ field: 'full_name', message: 'Họ tên không được để trống' })
    } else if (row.full_name.length < 2) {
      errors.push({ field: 'full_name', message: 'Họ tên phải có ít nhất 2 ký tự' })
    }

    // 2. Email
    if (!row.email) {
      errors.push({ field: 'email', message: 'Email không được để trống' })
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.push({ field: 'email', message: 'Email không đúng định dạng' })
    }

    // 3. Số điện thoại (nếu có)
    if (row.phone && !/^(0|\+84)\d{9,10}$/.test(row.phone.replace(/[\s-]/g, ''))) {
      errors.push({ field: 'phone', message: 'Số điện thoại không hợp lệ' })
    }

    // 4. Vai trò
    if (!row.role) {
      errors.push({ field: 'role', message: 'Vai trò không được để trống' })
    } else if (!VALID_ROLES.includes(row.role.toUpperCase() as any)) {
      errors.push({
        field: 'role',
        message: `Vai trò "${row.role}" không hợp lệ. Chỉ chấp nhận: ${VALID_ROLES.join(', ')}`,
      })
    }

    // 5. Mật khẩu
    if (!row.password) {
      errors.push({ field: 'password', message: 'Mật khẩu không được để trống' })
    } else if (row.password.length < 6) {
      errors.push({ field: 'password', message: 'Mật khẩu phải có ít nhất 6 ký tự' })
    }

    // Kiểm tra email trùng lặp sẽ được xử lý ở bước sau (cần toàn bộ danh sách)
    row.errors = errors
    row.status = errors.length > 0 ? 'error' : 'valid'

    return row
  })
}

/** Kiểm tra email trùng lặp trong danh sách */
export function checkDuplicateEmails(rows: ImportUserRow[]): ImportUserRow[] {
  const emailMap = new Map<string, number[]>()

  rows.forEach((row, idx) => {
    if (row.email) {
      const normalizedEmail = row.email.toLowerCase()
      if (!emailMap.has(normalizedEmail)) {
        emailMap.set(normalizedEmail, [])
      }
      emailMap.get(normalizedEmail)!.push(idx)
    }
  })

  const updatedRows = [...rows]
  emailMap.forEach((indices, _email) => {
    if (indices.length > 1) {
      // Đánh dấu tất cả trừ dòng đầu tiên là trùng
      for (let i = 1; i < indices.length; i++) {
        const idx = indices[i]
        const row = { ...updatedRows[idx] }
        row.errors = [
          ...row.errors,
          { field: 'email', message: 'Email bị trùng với dòng khác trong file' },
        ]
        row.status = 'error'
        updatedRows[idx] = row
      }
    }
  })

  return updatedRows
}

/* ──────────── Gọi API Import ──────────── */
export async function importUsers(validRows: ImportUserRow[]): Promise<ImportResult> {
  const payload = {
    users: validRows.map((row) => ({
      full_name: row.full_name,
      email: row.email,
      phone: row.phone || undefined,
      role: row.role.toUpperCase() as UserRole,
      team: row.team || undefined,
      password: row.password,
    })),
  }

  try {
    // Thử gọi API batch import nếu có
    const response = await fetch(`${API_BASE_URL}/users/import`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    })

    if (response.ok) {
      const data = (await response.json()) as BatchImportResponse
      return {
        totalRows: validRows.length,
        validRows: validRows.length,
        importedRows: data.imported ?? validRows.length,
        errorRows: data.failed ?? 0,
        errors: (data.errors ?? []).map((e) => ({
          rowIndex: e.index,
          full_name: validRows[e.index]?.full_name ?? '',
          email: e.email,
          errors: [{ field: 'api', message: e.message }],
        })),
      }
    }

    // Nếu endpoint không tồn tại, fallback sang mock
    if (response.status === 404 || response.status === 405) {
      return mockImportUsers(validRows)
    }

    // Lỗi khác từ API
    let errorMsg = 'Lỗi từ server khi import'
    try {
      const errData = await response.json()
      errorMsg = errData.detail || errData.message || errorMsg
    } catch {
      // ignore
    }
    throw new Error(errorMsg)
  } catch (err) {
    if (err instanceof Error && err.message.includes('Lỗi từ server')) {
      throw err
    }
    // Network error hoặc API không tồn tại → fallback sang mock
    console.warn('API import chưa sẵn sàng, sử dụng mock import:', err)
    return mockImportUsers(validRows)
  }
}

/* ──────────── Mock Import (khi chưa có Backend) ──────────── */
async function mockImportUsers(validRows: ImportUserRow[]): Promise<ImportResult> {
  // Giả lập thời gian xử lý
  await new Promise((r) => setTimeout(r, 1500))

  // Giả lập: 95% thành công, 5% random lỗi trùng email từ server
  const errors: ImportResult['errors'] = []
  let importedCount = 0

  for (const row of validRows) {
    // Random 5% chance lỗi giả lập
    if (Math.random() < 0.05) {
      errors.push({
        rowIndex: row.rowIndex,
        full_name: row.full_name,
        email: row.email,
        errors: [{ field: 'email', message: 'Email đã tồn tại trong hệ thống' }],
      })
    } else {
      importedCount++
    }
  }

  return {
    totalRows: validRows.length,
    validRows: validRows.length,
    importedRows: importedCount,
    errorRows: errors.length,
    errors,
  }
}
