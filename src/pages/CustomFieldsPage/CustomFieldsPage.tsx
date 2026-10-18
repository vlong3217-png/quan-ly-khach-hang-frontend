import { useState, useEffect } from 'react'
import { customFieldService } from '../../services/customFieldService.ts'
import type { CustomFieldDefinition, CustomFieldTarget, CustomFieldType } from '../../types/customField.ts'
import './CustomFieldsPage.css'
import PageHeader from '../../components/ui/PageHeader.tsx'
import Button from '../../components/ui/Button.tsx'

export default function CustomFieldsPage() {
  const [activeTarget, setActiveTarget] = useState<CustomFieldTarget>('CUSTOMER')
  const [fields, setFields] = useState<CustomFieldDefinition[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Phân trang
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(5)

  // Modal Thêm / Chỉnh sửa
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomFieldDefinition | null>(null)
  const [formData, setFormData] = useState({
    key: '',
    label: '',
    type: 'TEXT' as CustomFieldType,
    is_required: false,
    optionsText: '',
    show_in_filter: true,
    show_in_export: true,
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadData = () => {
    setFields(customFieldService.getFields(activeTarget))
  }

  useEffect(() => {
    loadData()
    setCurrentPage(1)
  }, [activeTarget])

  const handleOpenCreate = () => {
    setEditingField(null)
    setFormData({
      key: '',
      label: '',
      type: 'TEXT',
      is_required: false,
      optionsText: '',
      show_in_filter: true,
      show_in_export: true,
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (f: CustomFieldDefinition) => {
    setEditingField(f)
    setFormData({
      key: f.key,
      label: f.label,
      type: f.type,
      is_required: f.is_required,
      optionsText: f.options ? f.options.join(', ') : '',
      show_in_filter: f.show_in_filter,
      show_in_export: f.show_in_export,
    })
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.key.trim() || !formData.label.trim()) {
      showToast('Vui lòng điền mã trường và tên nhãn hiển thị!', 'error')
      return
    }

    const options =
      formData.type === 'SELECT'
        ? formData.optionsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined

    if (formData.type === 'SELECT' && (!options || options.length === 0)) {
      showToast('Trường danh sách chọn phải có ít nhất 1 tùy chọn giá trị!', 'error')
      return
    }

    try {
      if (editingField) {
        customFieldService.updateField(editingField.id, {
          label: formData.label,
          type: formData.type,
          is_required: formData.is_required,
          options,
          show_in_filter: formData.show_in_filter,
          show_in_export: formData.show_in_export,
        })
        showToast(`Đã cập nhật trường "${formData.label}" thành công!`, 'success')
      } else {
        customFieldService.createField({
          target: activeTarget,
          key: formData.key.trim(),
          label: formData.label.trim(),
          type: formData.type,
          is_required: formData.is_required,
          options,
          show_in_filter: formData.show_in_filter,
          show_in_export: formData.show_in_export,
        })
        showToast(`Đã tạo trường tuỳ chỉnh "${formData.label}" thành công!`, 'success')
      }
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error')
    }
  }

  const handleDelete = (f: CustomFieldDefinition) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa trường "${f.label}"?`)) {
      customFieldService.deleteField(f.id)
      showToast(`Đã xóa trường "${f.label}" thành công!`, 'success')
      loadData()
    }
  }

  const renderTypeBadge = (t: CustomFieldType) => {
    switch (t) {
      case 'TEXT':
        return <span className="type-badge text-badge">Văn bản (Text)</span>
      case 'NUMBER':
        return <span className="type-badge number-badge">Số (Number)</span>
      case 'DATE':
        return <span className="type-badge date-badge">Ngày tháng (Date)</span>
      case 'SELECT':
        return <span className="type-badge select-badge">Danh sách chọn (Dropdown)</span>
    }
  }

  return (
    <div className="custom-fields-container">
      {toast && (
        <div className={`cf-toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <PageHeader
        title="Trường tuỳ chỉnh"
        className="cf-header"
        actions={
          <Button type="button" variant="primary" className="btn btn-primary" onClick={handleOpenCreate}>
            Thêm trường tuỳ chỉnh
          </Button>
        }
      />

      {/* Target Tabs: Khách hàng vs Cơ hội */}
      <div className="cf-target-tabs">
        <button
          type="button"
          className={`cf-tab ${activeTarget === 'CUSTOMER' ? 'active' : ''}`}
          onClick={() => setActiveTarget('CUSTOMER')}
        >
          Hồ sơ Khách hàng
        </button>
        <button
          type="button"
          className={`cf-tab ${activeTarget === 'OPPORTUNITY' ? 'active' : ''}`}
          onClick={() => setActiveTarget('OPPORTUNITY')}
        >
          Cơ hội bán hàng - Deals
        </button>
      </div>

      {/* Bảng danh sách trường tuỳ chỉnh */}
      <div className="cf-table-wrapper">
        <table className="cf-table">
          <thead>
            <tr>
              <th style={{ width: '90px', textAlign: 'center' }}>Số thứ tự</th>
              <th>Tên nhãn hiển thị</th>
              <th>Kiểu dữ liệu</th>
              <th>Bắt buộc (Required)</th>
              <th>Tùy chọn danh sách</th>
              <th>Hiển thị bộ lọc</th>
              <th>Xuất Excel</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {fields.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">
                  Chưa có trường tuỳ chỉnh nào được khai báo cho đối tượng này.
                </td>
              </tr>
            ) : (
              fields
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((f, index) => {
                  const actualIndex = (currentPage - 1) * pageSize + index
                  return (
                    <tr key={f.id}>
                      <td style={{ textAlign: 'center' }}>
                        <span className="cf-stt-badge">{actualIndex + 1}</span>
                      </td>
                      <td><strong>{f.label}</strong></td>
                      <td>{renderTypeBadge(f.type)}</td>
                      <td>
                        {f.is_required ? (
                          <span className="req-pill req-yes">Bắt buộc (*)</span>
                        ) : (
                          <span className="req-pill req-no">Tùy chọn</span>
                        )}
                      </td>
                      <td>
                        {f.options && f.options.length > 0 ? (
                          <span className="options-chip-list">
                            {f.options.slice(0, 3).join(', ')}
                            {f.options.length > 3 && ` (+${f.options.length - 3})`}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>—</span>
                        )}
                      </td>
                      <td>{f.show_in_filter ? 'Có' : 'Không'}</td>
                      <td>{f.show_in_export ? 'Có' : 'Không'}</td>
                      <td className="actions-cell">
                        <button
                          type="button"
                          className="cf-action-btn edit-btn"
                          onClick={() => handleOpenEdit(f)}
                        >
                          Sửa
                        </button>
                        <details className="crm-more-actions">
                          <summary className="crm-more-trigger" title="Thao tác khác" aria-label="Thao tác khác">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </summary>
                          <div className="crm-more-menu">
                            <button
                              type="button"
                              className="crm-more-item danger"
                              onClick={(event) => {
                                event.currentTarget.closest('details')?.removeAttribute('open')
                                handleDelete(f)
                              }}
                            >
                              Xóa trường tùy chỉnh
                            </button>
                          </div>
                        </details>
                      </td>
                    </tr>
                  )
                })
            )}
          </tbody>
        </table>

        {/* Thanh phân trang Pagination */}
        {fields.length > 0 && (
          <div className="customer-pagination" style={{ margin: '16px 20px 20px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div className="customer-pagination-info">
              <span>
                Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, fields.length)}</strong> -{' '}
                <strong>{Math.min(currentPage * pageSize, fields.length)}</strong> trên tổng số{' '}
                <strong>{fields.length}</strong> trường tuỳ chỉnh
              </span>
              <div className="customer-pagination-size">
                <label htmlFor="cf-page-size-select">Hiển thị:</label>
                <select
                  id="cf-page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="customer-pagination-select"
                >
                  <option value={3}>3 trường / trang</option>
                  <option value={5}>5 trường / trang</option>
                  <option value={10}>10 trường / trang</option>
                </select>
              </div>
            </div>

            <div className="customer-pagination-controls">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="customer-page-btn nav-btn"
              >
                Trước
              </button>

              <div className="customer-page-numbers">
                {Array.from({ length: Math.max(1, Math.ceil(fields.length / pageSize)) }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCurrentPage(p)}
                    className={`customer-page-btn page-num ${currentPage === p ? 'active' : ''}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentPage === Math.max(1, Math.ceil(fields.length / pageSize))}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, Math.max(1, Math.ceil(fields.length / pageSize))))}
                className="customer-page-btn nav-btn"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm / Chỉnh sửa Trường */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content cf-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingField ? 'Chỉnh sửa trường tuỳ chỉnh' : 'Thêm trường tuỳ chỉnh mới'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Mã định danh (Key) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingField}
                    value={formData.key}
                    onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="VD: tax_code, zalo_number..."
                  />
                  <small style={{ color: '#64748b' }}>Chữ thường, không dấu, dùng dấu gạch dưới thay dấu cách.</small>
                </div>

                <div className="modal-form-group">
                  <label>Tên nhãn hiển thị trong biểu mẫu *</label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="VD: Mã số thuế công ty"
                  />
                </div>

                <div className="modal-form-group">
                  <label>Kiểu dữ liệu *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as CustomFieldType })}
                  >
                    <option value="TEXT">Văn bản ngắn (Text)</option>
                    <option value="NUMBER">Số / Tiền tệ (Number)</option>
                    <option value="DATE">Ngày tháng (Date)</option>
                    <option value="SELECT">Danh sách chọn (Dropdown)</option>
                  </select>
                </div>

                {formData.type === 'SELECT' && (
                  <div className="modal-form-group">
                    <label>Danh sách tùy chọn (cách nhau bởi dấu phẩy) *</label>
                    <input
                      type="text"
                      required
                      value={formData.optionsText}
                      onChange={(e) => setFormData({ ...formData, optionsText: e.target.value })}
                      placeholder="VD: VIP, Thường, Tiềm năng"
                    />
                  </div>
                )}

                <div className="modal-checkbox-group">
                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.is_required}
                      onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    />
                    <span>Đặt trường này là Bắt buộc nhập (*)</span>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.show_in_filter}
                      onChange={(e) => setFormData({ ...formData, show_in_filter: e.target.checked })}
                    />
                    <span>Xuất hiện trong bộ lọc tìm kiếm</span>
                  </label>

                  <label className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.show_in_export}
                      onChange={(e) => setFormData({ ...formData, show_in_export: e.target.checked })}
                    />
                    <span>Xuất ra cột trong file Excel báo cáo</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingField ? 'Lưu thay đổi' : 'Tạo trường'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
