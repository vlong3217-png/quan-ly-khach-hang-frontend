import { useState, useEffect, useRef } from 'react'
import type { Opportunity } from '../../types/opportunity.ts'
import type {
  OpportunityAttachment,
  AttachmentCategory,
} from '../../types/opportunityAttachment.ts'
import { opportunityAttachmentService } from '../../services/opportunityAttachmentService.ts'
import { useAuth } from '../../contexts/AuthContext.tsx'
import './OpportunityAttachments.css'

interface OpportunityAttachmentsProps {
  opportunity: Opportunity
}

export default function OpportunityAttachments({
  opportunity,
}: OpportunityAttachmentsProps) {
  const { user } = useAuth()
  const [attachments, setAttachments] = useState<OpportunityAttachment[]>([])
  const [loading, setLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<AttachmentCategory>('Hồ sơ thầu')
  const [notesInput, setNotesInput] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const downloadCheck = opportunityAttachmentService.canDownload(opportunity, user)

  const loadAttachments = async () => {
    setLoading(true)
    try {
      const data = await opportunityAttachmentService.getAttachments(opportunity.id)
      setAttachments(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttachments()
  }, [opportunity.id])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const getFileBadge = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE'
    return ext
  }

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setUploadError(null)
    setUploadSuccess(null)
    setIsUploading(true)

    const MAX_SIZE = 20 * 1024 * 1024 // 20MB
    const rejectedFiles: string[] = []
    let uploadedCount = 0

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (file.size > MAX_SIZE) {
          rejectedFiles.push(`${file.name} (${formatFileSize(file.size)})`)
          continue
        }

        await opportunityAttachmentService.uploadAttachment({
          opportunity_id: opportunity.id,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type || 'application/octet-stream',
          category: selectedCategory,
          notes: notesInput.trim() || undefined,
          uploaded_by_id: user?.id ? Number(user.id) : 1,
          uploaded_by_name: user?.full_name || 'Nhân viên kinh doanh',
        })
        uploadedCount++
      }

      if (rejectedFiles.length > 0) {
        setUploadError(
          `Các tệp sau vượt quá giới hạn tối đa 20MB nên không thể tải lên: ${rejectedFiles.join(', ')}`
        )
      }

      if (uploadedCount > 0) {
        setUploadSuccess(`Đã tải lên thành công ${uploadedCount} tệp tài liệu!`)
        setTimeout(() => setUploadSuccess(null), 4000)
        setNotesInput('')
        await loadAttachments()
      }
    } catch (err: any) {
      setUploadError(err.message || 'Lỗi khi tải lên tài liệu.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDownload = (att: OpportunityAttachment) => {
    if (!downloadCheck.allowed) {
      alert(downloadCheck.reason || 'Bạn không có quyền tải xuống tài liệu này.')
      return
    }

    // Tạo blob giả lập tải xuống tài liệu an toàn
    const content = `Tài liệu: ${att.file_name}\nCơ hội: ${opportunity.title} (${opportunity.code})\nDanh mục: ${att.category}\nNgười tải lên: ${att.uploaded_by_name}\nThời điểm: ${att.uploaded_at}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = att.file_name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (att: OpportunityAttachment) => {
    const isUploader = user?.id && att.uploaded_by_id === Number(user.id)
    const isOwner = user?.id && opportunity.owner_id === Number(user.id)
    const isManager = user?.role === 'ADMIN' || user?.role === 'MANAGER'

    if (!isUploader && !isOwner && !isManager) {
      alert('Chỉ người tải lên, chủ sở hữu cơ hội hoặc quản lý mới có quyền xóa tài liệu này.')
      return
    }

    if (!confirm(`Bạn có chắc muốn xóa tài liệu "${att.file_name}"?`)) return

    await opportunityAttachmentService.deleteAttachment(att.id)
    await loadAttachments()
  }

  return (
    <div className="opportunity-attachments-container" id="s6-04-attachments">
      {/* Upload Box */}
      <div className="attachments-upload-card">
        <div className="upload-header">
          <h4 className="upload-title">Đính kèm tài liệu vào thương vụ (S6-04)</h4>
          <span className="upload-limit-badge">Tối đa 20MB / tệp · Hỗ trợ nhiều tệp</span>
        </div>

        {uploadError && <div className="alert-error-bar">{uploadError}</div>}
        {uploadSuccess && <div className="alert-success-bar">{uploadSuccess}</div>}

        <div className="upload-form-row">
          <div className="upload-input-group">
            <label>Phân loại tài liệu</label>
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as AttachmentCategory)}
            >
              <option value="Hồ sơ thầu">Hồ sơ thầu (Bidding / Tender)</option>
              <option value="Biên bản họp">Biên bản họp (MoM / Meeting Notes)</option>
              <option value="Báo giá & Hợp đồng">Báo giá & Hợp đồng</option>
              <option value="Yêu cầu kỹ thuật (RFP)">Yêu cầu kỹ thuật (RFP / Spec)</option>
              <option value="Tài liệu khác">Tài liệu khác</option>
            </select>
          </div>

          <div className="upload-input-group flex-2">
            <label>Ghi chú tài liệu (tùy chọn)</label>
            <input
              type="text"
              className="form-control"
              placeholder="VD: Bản sửa đổi điều khoản thanh toán lần 2"
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
            />
          </div>
        </div>

        {/* Dropzone */}
        <div
          className="attachment-dropzone"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            multiple
            style={{ display: 'none' }}
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
          <div className="dropzone-content">
            
            <span className="dropzone-text">
              {isUploading
                ? 'Đang tải lên các tệp tài liệu...'
                : 'Nhấn vào đây hoặc kéo thả nhiều tệp để tải lên cơ hội'}
            </span>
            <span className="dropzone-hint">
              Hỗ trợ PDF, DOCX, XLSX, PPTX, Ảnh, ZIP (Mỗi tệp không quá 20MB)
            </span>
          </div>
        </div>
      </div>

      {/* Permissions banner */}
      <div className={`download-permission-banner ${downloadCheck.allowed ? 'allowed' : 'restricted'}`}>
        
        <div className="perm-info">
          <strong>Chính sách bảo mật tài liệu thương vụ (S6-04 AC2):</strong>
          <span>
            {downloadCheck.allowed
              ? 'Bạn là Chủ sở hữu hoặc Thành viên được chia sẻ thương vụ này nên có toàn quyền tải xuống tài liệu.'
              : downloadCheck.reason}
          </span>
        </div>
      </div>

      {/* List of attachments */}
      <div className="attachments-list-card">
        <div className="list-header">
          <h4 className="list-title">Danh sách tài liệu đã đính kèm ({attachments.length})</h4>
          <button
            type="button"
            className="btn-refresh"
            onClick={loadAttachments}
            title="Làm mới"
          >
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="attachments-loading">Đang tải danh sách tài liệu...</div>
        ) : attachments.length === 0 ? (
          <div className="attachments-empty">
            
            <p>Chưa có tài liệu nào được đính kèm vào cơ hội này.</p>
            <span className="empty-hint">
              Đính kèm hồ sơ thầu, biên bản họp và đề xuất kỹ thuật để lưu trữ tập trung cùng thương vụ.
            </span>
          </div>
        ) : (
          <div className="attachment-items">
            {attachments.map((att) => (
              <div key={att.id} className="attachment-item-row">
                <div className="att-file-icon">{getFileBadge(att.file_name)}</div>

                <div className="att-file-info">
                  <div className="att-name-line">
                    <span className="att-file-name" title={att.file_name}>
                      {att.file_name}
                    </span>
                    <span className="att-category-badge">{att.category}</span>
                    <span className="att-file-size">({formatFileSize(att.file_size)})</span>
                  </div>

                  {att.notes && <p className="att-notes">"{att.notes}"</p>}

                  <div className="att-meta-line">
                    <span className="att-uploader">
                      Tải lên bởi: <strong>{att.uploaded_by_name}</strong>
                    </span>
                    <span className="meta-sep">·</span>
                    <span className="att-time">
                      {new Date(att.uploaded_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                <div className="att-actions">
                  {downloadCheck.allowed ? (
                    <button
                      type="button"
                      className="btn-download"
                      onClick={() => handleDownload(att)}
                      title="Tải xuống tài liệu"
                    >
                      Tải xuống
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-download disabled"
                      disabled
                      title="Chỉ Người sở hữu hoặc Thành viên được chia sẻ mới được tải"
                    >
                      Bị khóa
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => handleDelete(att)}
                    title="Xóa tệp"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
