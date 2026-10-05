import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.tsx'
import {
  downloadTemplateFile,
  readExcelFile,
  parseAndValidateRows,
  checkDuplicateEmails,
  importUsers,
} from '../../services/importUserService.ts'
import type {
  ImportUserRow,
  ImportFlowState,
  ImportResult,
  PreviewFilter,
} from '../../types/importUser.ts'
import './ImportUsersPage.css'

/* ──────────── Inline SVG Icons ──────────── */
const IconUpload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const IconDownload = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
)

const IconFileSpreadsheet = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M8 13h2" />
    <path d="M14 13h2" />
    <path d="M8 17h2" />
    <path d="M14 17h2" />
  </svg>
)

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

const IconAlertCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
)

const IconAlertTriangle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const IconCheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

const IconUsers = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const IconImport = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" />
    <path d="m8 11 4 4 4-4" />
    <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
  </svg>
)

const IconShield = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
  </svg>
)

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconLogout = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" x2="9" y1="12" y2="12" />
  </svg>
)

const IconRefresh = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
)

/* ──────────── Helpers ──────────── */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls']

function isValidExcelFile(file: File): boolean {
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

/* ──────────── Step Info ──────────── */
const STEPS = [
  { id: 1, label: 'Chọn file' },
  { id: 2, label: 'Xem trước' },
  { id: 3, label: 'Nhập dữ liệu' },
  { id: 4, label: 'Báo cáo' },
]

function getActiveStep(state: ImportFlowState): number {
  switch (state) {
    case 'idle':
    case 'reading':
    case 'invalid_file':
    case 'empty_file':
      return 1
    case 'previewing':
      return 2
    case 'importing':
      return 3
    case 'completed':
    case 'api_error':
      return 4
    default:
      return 1
  }
}

/* ──────────── Field Label ──────────── */
const FIELD_LABELS: Record<string, string> = {
  full_name: 'Họ tên',
  email: 'Email',
  phone: 'SĐT',
  role: 'Vai trò',
  team: 'Nhóm',
  password: 'Mật khẩu',
  api: 'Server',
}

/* ──────────── Component ──────────── */
function ImportUsersPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Core state
  const [flowState, setFlowState] = useState<ImportFlowState>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [rows, setRows] = useState<ImportUserRow[]>([])
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>('all')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [toastFading, setToastFading] = useState(false)

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setToastFading(false)
    setTimeout(() => {
      setToastFading(true)
      setTimeout(() => setToast(null), 300)
    }, 3500)
  }, [])

  /* ── Computed ── */
  const validRows = rows.filter((r) => r.status === 'valid')
  const errorRows = rows.filter((r) => r.status === 'error')
  const activeStep = getActiveStep(flowState)

  const filteredRows =
    previewFilter === 'valid'
      ? validRows
      : previewFilter === 'error'
        ? errorRows
        : rows

  const allError = rows.length > 0 && validRows.length === 0

  /* ── File selection ── */
  const handleFileSelect = async (file: File) => {
    setFileError(null)
    setApiError(null)

    // Validate extension
    if (!isValidExcelFile(file)) {
      setFileError('Chỉ chấp nhận file Excel (.xlsx hoặc .xls). Vui lòng chọn file đúng định dạng.')
      setFlowState('invalid_file')
      setSelectedFile(null)
      return
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File quá lớn (tối đa 10MB). Vui lòng chọn file nhỏ hơn.')
      setFlowState('invalid_file')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setFlowState('reading')

    try {
      const { headers, rawRows } = await readExcelFile(file)

      let parsedRows = parseAndValidateRows(headers, rawRows)
      parsedRows = checkDuplicateEmails(parsedRows)

      setRows(parsedRows)
      setFlowState('previewing')
      setPreviewFilter('all')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể đọc file Excel.'
      setFileError(msg)
      if (msg.includes('rỗng') || msg.includes('không có dữ liệu') || msg.includes('chỉ có tiêu đề')) {
        setFlowState('empty_file')
      } else {
        setFlowState('invalid_file')
      }
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    // Reset input value để có thể chọn lại cùng file
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setRows([])
    setFileError(null)
    setApiError(null)
    setImportResult(null)
    setFlowState('idle')
    setPreviewFilter('all')
  }

  /* ── Download template ── */
  const handleDownloadTemplate = () => {
    try {
      downloadTemplateFile()
      showToast('Đã tải file mẫu thành công!', 'success')
    } catch {
      showToast('Không thể tạo file mẫu. Vui lòng thử lại.', 'error')
    }
  }

  /* ── Import ── */
  const handleImport = async () => {
    if (validRows.length === 0) return

    setFlowState('importing')
    setApiError(null)

    try {
      const result = await importUsers(validRows)

      // Merge kết quả: thêm các dòng đã bị lỗi ở client vào báo cáo
      const totalOriginal = rows.length
      const clientErrors = errorRows.map((r) => ({
        rowIndex: r.rowIndex,
        full_name: r.full_name,
        email: r.email,
        errors: r.errors,
      }))

      const finalResult: ImportResult = {
        totalRows: totalOriginal,
        validRows: validRows.length,
        importedRows: result.importedRows,
        errorRows: errorRows.length + result.errorRows,
        errors: [...clientErrors, ...result.errors],
      }

      setImportResult(finalResult)
      setFlowState('completed')

      if (result.errorRows === 0) {
        showToast(`Đã nhập thành công ${result.importedRows} tài khoản!`, 'success')
      } else {
        showToast(
          `Đã nhập ${result.importedRows} tài khoản, ${result.errorRows} dòng lỗi từ server.`,
          'error'
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi nhập dữ liệu.'
      setApiError(msg)
      setFlowState('api_error')
      showToast(msg, 'error')
    }
  }

  /* ── Reset to start over ── */
  const handleStartOver = () => {
    setSelectedFile(null)
    setRows([])
    setFileError(null)
    setApiError(null)
    setImportResult(null)
    setFlowState('idle')
    setPreviewFilter('all')
  }

  /* ── Logout ── */
  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  /* ──────────── Render ──────────── */
  return (
    <div className="import-users-page">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="dashboard-brand">
            <div className="dashboard-brand-icon" aria-hidden="true">
              <IconShield />
            </div>
            <span className="dashboard-brand-text">Quản lý khách hàng</span>
          </div>

          <div className="dashboard-user-area">
            <div className="dashboard-user-info">
              <div className="dashboard-user-avatar">
                <IconUser />
              </div>
              <div className="dashboard-user-details">
                <span className="dashboard-user-name">{user?.full_name ?? 'Người dùng'}</span>
                <span className="dashboard-user-role">{user?.role ?? ''}</span>
              </div>
            </div>
            <button
              type="button"
              className="dashboard-logout-btn"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <IconLogout />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="import-users-main">
        {/* Back link */}
        <button
          className="import-users-back-link"
          onClick={() => navigate('/dashboard')}
          type="button"
          id="import-back-link"
        >
          <IconArrowLeft />
          Quay lại Dashboard
        </button>

        {/* Title bar */}
        <div className="import-users-title-bar">
          <h1>
            <IconUsers />
            Nhập danh sách người dùng
          </h1>
          <button
            type="button"
            className="import-users-template-btn"
            onClick={handleDownloadTemplate}
            id="import-download-template-btn"
          >
            <IconDownload />
            Tải tệp mẫu
          </button>
        </div>

        {/* Stepper */}
        <div className="import-stepper">
          {STEPS.map((step, idx) => (
            <div key={step.id} style={{ display: 'contents' }}>
              <div
                className={`stepper-step ${
                  activeStep === step.id ? 'active' : activeStep > step.id ? 'done' : ''
                }`}
              >
                <div className="stepper-step-number">
                  {activeStep > step.id ? (
                    <IconCheck />
                  ) : (
                    step.id
                  )}
                </div>
                <span className="stepper-step-label">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`stepper-divider ${activeStep > step.id ? 'done' : ''}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Step 1: Upload ── */}
        {(flowState === 'idle' || flowState === 'invalid_file' || flowState === 'empty_file') && (
          <div className="import-upload-card">
            <div
              className={`import-upload-zone ${
                dragOver ? 'drag-over' : ''
              } ${selectedFile && !fileError ? 'has-file' : ''} ${fileError ? 'has-error' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              id="import-upload-zone"
            >
              <div className="upload-icon">
                {fileError ? <IconAlertCircle /> : <IconUpload />}
              </div>
              <p className="upload-title">
                {fileError
                  ? 'File không hợp lệ'
                  : 'Kéo thả file Excel vào đây'}
              </p>
              <p className="upload-desc">
                {fileError
                  ? 'Vui lòng chọn file Excel (.xlsx, .xls) hợp lệ'
                  : (
                      <>
                        hoặc <strong>nhấn để chọn file</strong> từ máy tính
                        <br />
                        Hỗ trợ .xlsx, .xls — Tối đa 10MB
                      </>
                    )}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                className="upload-file-input"
                accept=".xlsx,.xls"
                onChange={handleFileInputChange}
                id="import-file-input"
              />
            </div>

            {fileError && (
              <div className="upload-error-msg">
                <IconAlertCircle />
                <span>{fileError}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Reading state ── */}
        {flowState === 'reading' && (
          <div className="import-reading-card">
            <div className="import-spinner" />
            <span className="import-reading-text">Đang đọc file Excel...</span>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {flowState === 'previewing' && (
          <div className="import-preview-card">
            {/* File info */}
            {selectedFile && (
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                <div className="upload-file-info" style={{ margin: 0, border: 'none', padding: 0 }}>
                  <div className="upload-file-icon">
                    <IconFileSpreadsheet />
                  </div>
                  <div className="upload-file-details">
                    <span className="upload-file-name">{selectedFile.name}</span>
                    <span className="upload-file-size">{formatFileSize(selectedFile.size)}</span>
                  </div>
                  <button
                    type="button"
                    className="upload-file-remove"
                    onClick={handleRemoveFile}
                    title="Xóa file và chọn lại"
                    id="import-remove-file-btn"
                  >
                    <IconX />
                  </button>
                </div>
              </div>
            )}

            {/* Stats bar */}
            <div className="preview-stats-bar">
              <div className="preview-stat-item">
                <span>Tổng dòng:</span>
                <span className="preview-stat-value">{rows.length}</span>
              </div>
              <div className="preview-stat-divider" />
              <div className="preview-stat-item stat-valid">
                <span>Hợp lệ:</span>
                <span className="preview-stat-value">{validRows.length}</span>
              </div>
              <div className="preview-stat-divider" />
              <div className="preview-stat-item stat-error">
                <span>Có lỗi:</span>
                <span className="preview-stat-value">{errorRows.length}</span>
              </div>
            </div>

            {/* All-error warning */}
            {allError && (
              <div className="preview-all-error-banner">
                <IconAlertTriangle />
                <span>
                  Tất cả các dòng đều có lỗi. Không có dữ liệu hợp lệ để nhập.
                  Vui lòng kiểm tra lại file Excel.
                </span>
              </div>
            )}

            {/* Filter bar & import button */}
            <div className="preview-filter-bar">
              <div className="preview-filter-tabs">
                <button
                  type="button"
                  className={`preview-filter-tab ${previewFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setPreviewFilter('all')}
                  id="import-filter-all"
                >
                  Tất cả
                  <span className="tab-count">{rows.length}</span>
                </button>
                <button
                  type="button"
                  className={`preview-filter-tab ${previewFilter === 'valid' ? 'active' : ''}`}
                  onClick={() => setPreviewFilter('valid')}
                  id="import-filter-valid"
                >
                  Hợp lệ
                  <span className="tab-count">{validRows.length}</span>
                </button>
                <button
                  type="button"
                  className={`preview-filter-tab ${previewFilter === 'error' ? 'active' : ''}`}
                  onClick={() => setPreviewFilter('error')}
                  id="import-filter-error"
                >
                  Có lỗi
                  <span className="tab-count">{errorRows.length}</span>
                </button>
              </div>

              <button
                type="button"
                className={`preview-import-btn ${allError ? '' : validRows.length < rows.length ? 'btn-warning' : ''}`}
                onClick={handleImport}
                disabled={validRows.length === 0}
                id="import-submit-btn"
              >
                <IconImport />
                {validRows.length === 0
                  ? 'Không có dòng hợp lệ'
                  : validRows.length < rows.length
                    ? `Nhập ${validRows.length}/${rows.length} dòng hợp lệ`
                    : `Nhập tất cả ${validRows.length} dòng`}
              </button>
            </div>

            {/* Data Table */}
            <div className="preview-table-wrap">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Dòng</th>
                    <th>Trạng thái</th>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>SĐT</th>
                    <th>Vai trò</th>
                    <th>Nhóm</th>
                    <th>Mật khẩu</th>
                    <th>Chi tiết lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                        {previewFilter === 'valid'
                          ? 'Không có dòng hợp lệ nào.'
                          : previewFilter === 'error'
                            ? 'Không có dòng lỗi nào — Tất cả dữ liệu hợp lệ!'
                            : 'Không có dữ liệu.'}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr
                        key={row.rowIndex}
                        className={row.status === 'error' ? 'row-error' : ''}
                      >
                        <td>
                          <span className="row-number">{row.rowIndex}</span>
                        </td>
                        <td>
                          <span
                            className={`row-status-badge status-${row.status}`}
                          >
                            <span className="row-status-dot" />
                            {row.status === 'valid' ? 'Hợp lệ' : 'Lỗi'}
                          </span>
                        </td>
                        <td>
                          <span className="cell-truncate">{row.full_name || '—'}</span>
                        </td>
                        <td>
                          <span className="cell-truncate">{row.email || '—'}</span>
                        </td>
                        <td>{row.phone || '—'}</td>
                        <td>{row.role || '—'}</td>
                        <td>{row.team || '—'}</td>
                        <td>
                          {row.password ? (
                            <span className="cell-password">••••••</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {row.errors.length > 0 ? (
                            <ul className="row-errors-list">
                              {row.errors.map((err, ei) => (
                                <li key={ei} className="row-error-item">
                                  <span className="error-field-name">
                                    {FIELD_LABELS[err.field] || err.field}:
                                  </span>{' '}
                                  {err.message}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span style={{ color: '#22c55e', fontSize: '12px' }}>✓ OK</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Step 3: Importing ── */}
        {flowState === 'importing' && (
          <div className="import-progress-card">
            <div className="import-progress-spinner" />
            <h3 className="import-progress-title">Đang nhập dữ liệu...</h3>
            <p className="import-progress-desc">
              Đang xử lý {validRows.length} tài khoản hợp lệ. Vui lòng không đóng trang.
            </p>
          </div>
        )}

        {/* ── Step 4: Report ── */}
        {flowState === 'completed' && importResult && (
          <div className="import-report-card">
            {/* Header */}
            <div className="report-header">
              <div
                className={`report-header-icon ${
                  importResult.errorRows === 0
                    ? 'success'
                    : importResult.importedRows > 0
                      ? 'partial'
                      : 'error'
                }`}
              >
                {importResult.errorRows === 0 ? (
                  <IconCheckCircle />
                ) : importResult.importedRows > 0 ? (
                  <IconAlertTriangle />
                ) : (
                  <IconAlertCircle />
                )}
              </div>
              <div className="report-header-content">
                <h2 className="report-header-title">
                  {importResult.errorRows === 0
                    ? 'Nhập dữ liệu thành công!'
                    : importResult.importedRows > 0
                      ? 'Nhập dữ liệu hoàn tất (có dòng lỗi)'
                      : 'Nhập dữ liệu thất bại'}
                </h2>
                <p className="report-header-desc">
                  {importResult.errorRows === 0
                    ? `Tất cả ${importResult.importedRows} tài khoản đã được tạo thành công.`
                    : importResult.importedRows > 0
                      ? `${importResult.importedRows} tài khoản đã nhập, ${importResult.errorRows} dòng bị bỏ qua do lỗi.`
                      : `Không có tài khoản nào được nhập. Tất cả ${importResult.errorRows} dòng đều có lỗi.`}
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="report-stats-grid">
              <div className="report-stat-card stat-total">
                <span className="report-stat-value">{importResult.totalRows}</span>
                <span className="report-stat-label">Tổng số dòng</span>
              </div>
              <div className="report-stat-card stat-imported">
                <span className="report-stat-value">{importResult.validRows}</span>
                <span className="report-stat-label">Dòng hợp lệ</span>
              </div>
              <div className="report-stat-card stat-imported">
                <span className="report-stat-value">{importResult.importedRows}</span>
                <span className="report-stat-label">Đã nhập thành công</span>
              </div>
              <div className="report-stat-card stat-error">
                <span className="report-stat-value">{importResult.errorRows}</span>
                <span className="report-stat-label">Bị bỏ qua / Lỗi</span>
              </div>
            </div>

            {/* Error details */}
            {importResult.errors.length > 0 && (
              <div className="report-errors-section">
                <h3 className="report-errors-title">
                  <IconAlertCircle />
                  Danh sách dòng lỗi ({importResult.errors.length})
                </h3>
                {importResult.errors.map((err, idx) => (
                  <div key={idx} className="report-error-row">
                    <span className="report-error-row-index">Dòng {err.rowIndex}</span>
                    <div className="report-error-row-details">
                      <span className="report-error-row-name">{err.full_name || '(trống)'}</span>
                      {' — '}
                      <span className="report-error-row-email">{err.email || '(trống)'}</span>
                      <div className="report-error-row-msgs">
                        {err.errors.map((e, ei) => (
                          <span key={ei}>
                            {FIELD_LABELS[e.field] || e.field}: {e.message}
                            {ei < err.errors.length - 1 ? ' | ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="report-actions">
              <button
                type="button"
                className="report-btn report-btn-primary"
                onClick={handleStartOver}
                id="import-new-btn"
              >
                <IconRefresh />
                Nhập thêm
              </button>
              <button
                type="button"
                className="report-btn report-btn-secondary"
                onClick={() => navigate('/dashboard')}
                id="import-goto-users-btn"
              >
                <IconUsers />
                Quản lý tài khoản
              </button>
            </div>
          </div>
        )}

        {/* ── API Error state ── */}
        {flowState === 'api_error' && (
          <div className="import-api-error-card">
            <div className="api-error-icon">
              <IconAlertCircle />
            </div>
            <h3 className="api-error-title">Lỗi khi nhập dữ liệu</h3>
            <p className="api-error-desc">{apiError || 'Có lỗi xảy ra. Vui lòng thử lại.'}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="report-btn report-btn-primary"
                onClick={() => {
                  setFlowState('previewing')
                  setApiError(null)
                }}
                id="import-retry-btn"
              >
                <IconRefresh />
                Thử lại
              </button>
              <button
                type="button"
                className="report-btn report-btn-secondary"
                onClick={handleStartOver}
                id="import-start-over-btn"
              >
                Chọn file khác
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`import-toast toast-${toast.type} ${toastFading ? 'toast-out' : ''}`}
        >
          {toast.type === 'success' ? <IconCheck /> : <IconAlertCircle />}
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default ImportUsersPage
