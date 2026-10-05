/* ──────────── S2-01: Import Users Types ──────────── */

import type { UserRole } from './user.ts'

/** Trạng thái validation của một dòng dữ liệu */
export type RowValidationStatus = 'valid' | 'error'

/** Một lỗi validation cụ thể cho một field */
export interface FieldError {
  field: string
  message: string
}

/** Một dòng dữ liệu được đọc từ Excel */
export interface ImportUserRow {
  /** Số thứ tự dòng trong file Excel (1-indexed, tính cả header) */
  rowIndex: number
  /** Dữ liệu gốc */
  full_name: string
  email: string
  phone: string
  role: string
  team: string
  password: string
  /** Trạng thái validation */
  status: RowValidationStatus
  /** Danh sách lỗi nếu có */
  errors: FieldError[]
}

/** Bộ lọc hiển thị preview */
export type PreviewFilter = 'all' | 'valid' | 'error'

/** Trạng thái tổng thể của luồng import */
export type ImportFlowState =
  | 'idle'           // Chưa chọn file
  | 'reading'        // Đang đọc file
  | 'invalid_file'   // File không hợp lệ (sai format)
  | 'empty_file'     // File rỗng/không có dữ liệu
  | 'previewing'     // Đang hiển thị preview & kiểm tra lỗi
  | 'importing'      // Đang gửi API import
  | 'completed'      // Import hoàn tất
  | 'api_error'      // Lỗi từ API/network

/** Kết quả import sau khi hoàn tất */
export interface ImportResult {
  totalRows: number
  validRows: number
  importedRows: number
  errorRows: number
  errors: Array<{
    rowIndex: number
    full_name: string
    email: string
    errors: FieldError[]
  }>
}

/** Payload gửi lên API để import batch */
export interface BatchImportRequest {
  users: Array<{
    full_name: string
    email: string
    phone?: string
    role: UserRole
    team?: string
    password: string
  }>
}

/** Response từ API import batch */
export interface BatchImportResponse {
  success: boolean
  message: string
  total: number
  imported: number
  failed: number
  errors?: Array<{
    index: number
    email: string
    message: string
  }>
}

/** Cấu trúc cột file mẫu Excel */
export const TEMPLATE_COLUMNS = [
  'Họ tên (*)',
  'Email (*)',
  'Số điện thoại',
  'Vai trò (*)',
  'Nhóm/Team',
  'Mật khẩu (*)',
] as const

/** Map cột Excel sang field key */
export const COLUMN_FIELD_MAP: Record<string, keyof Pick<ImportUserRow, 'full_name' | 'email' | 'phone' | 'role' | 'team' | 'password'>> = {
  'Họ tên (*)': 'full_name',
  'Email (*)': 'email',
  'Số điện thoại': 'phone',
  'Vai trò (*)': 'role',
  'Nhóm/Team': 'team',
  'Mật khẩu (*)': 'password',
  // Hỗ trợ thêm tên cột không có dấu * 
  'Họ tên': 'full_name',
  'Email': 'email',
  'Vai trò': 'role',
  'Mật khẩu': 'password',
}

/** Vai trò hợp lệ (dùng cho validation) */
export const VALID_ROLES = ['ADMIN', 'MANAGER', 'STAFF', 'USER'] as const
