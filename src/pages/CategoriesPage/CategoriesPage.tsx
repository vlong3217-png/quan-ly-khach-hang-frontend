import { useState, useEffect } from 'react'
import { categoryService } from '../../services/categoryService.ts'
import type { SalesCategoryItem, SalesCategoryType } from '../../types/category.ts'
import './CategoriesPage.css'

const CATEGORY_TABS: Array<{ type: SalesCategoryType; label: string }> = [
  { type: 'INDUSTRY', label: 'Ngành nghề khách hàng' },
  { type: 'COMPANY_SIZE', label: 'Quy mô doanh nghiệp' },
  { type: 'LEAD_SOURCE', label: 'Nguồn Lead tiếp cận' },
  { type: 'ACTIVITY_TYPE', label: 'Loại hoạt động bán hàng' },
]

export default function CategoriesPage() {
  const [activeTab, setActiveTab] = useState<SalesCategoryType>('INDUSTRY')
  const [categories, setCategories] = useState<SalesCategoryItem[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<SalesCategoryItem | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
  })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadData = () => {
    setCategories(categoryService.getCategories(activeTab))
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData({
      code: `${activeTab.substring(0, 3)}-${Math.floor(10 + Math.random() * 90)}`,
      name: '',
      description: '',
    })
    setIsModalOpen(true)
  }

  const handleOpenEdit = (item: SalesCategoryItem) => {
    setEditingItem(item)
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || '',
    })
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast('Vui lòng nhập đầy đủ tên và mã danh mục!', 'error')
      return
    }

    try {
      if (editingItem) {
        categoryService.updateCategory(editingItem.id, {
          code: formData.code,
          name: formData.name,
          description: formData.description,
        })
        showToast(`Đã cập nhật danh mục "${formData.name}" thành công!`, 'success')
      } else {
        categoryService.addCategory({
          type: activeTab,
          code: formData.code,
          name: formData.name,
          sort_order: categories.length + 1,
          description: formData.description,
        })
        showToast(`Đã thêm mới danh mục "${formData.name}" thành công!`, 'success')
      }
      setIsModalOpen(false)
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error')
    }
  }

  const handleDelete = (item: SalesCategoryItem) => {
    try {
      categoryService.deleteCategory(item.id)
      showToast(`Đã xóa danh mục "${item.name}" thành công!`, 'success')
      loadData()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error')
    }
  }

  const handleMoveUp = (idx: number) => {
    if (idx <= 0) return
    const updated = categoryService.reorder(activeTab, idx, idx - 1)
    setCategories(updated)
    showToast('Đã thay đổi thứ tự hiển thị!', 'success')
  }

  const handleMoveDown = (idx: number) => {
    if (idx >= categories.length - 1) return
    const updated = categoryService.reorder(activeTab, idx, idx + 1)
    setCategories(updated)
    showToast('Đã thay đổi thứ tự hiển thị!', 'success')
  }

  return (
    <div className="categories-page-container">
      {toast && (
        <div className={`cat-toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="cat-header">
        <div>
          <h2>Khai báo Danh mục Bán hàng dùng chung</h2>
          <p className="cat-subtitle">
            Chuẩn hóa danh mục toàn khối để số liệu đồng nhất: ngành nghề, quy mô, nguồn lead, hoạt động.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
          + Thêm mục mới
        </button>
      </div>

      {/* Tabs chuyển đổi 4 loại danh mục */}
      <div className="cat-tabs-nav">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.type}
            type="button"
            className={`cat-tab-btn ${activeTab === tab.type ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.type)}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Bảng danh sách mục */}
      <div className="cat-table-wrapper">
        <table className="cat-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>Thứ tự</th>
              <th>Mã danh mục</th>
              <th>Tên hiển thị</th>
              <th>Tham chiếu dữ liệu</th>
              <th>Mô tả</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">Chưa có danh mục nào trong nhóm này.</td>
              </tr>
            ) : (
              categories.map((item, idx) => (
                <tr key={item.id}>
                  <td>
                    <div className="reorder-controls">
                      <button
                        type="button"
                        className="order-btn"
                        disabled={idx === 0}
                        onClick={() => handleMoveUp(idx)}
                        title="Di chuyển lên trên"
                      >
                        ▲
                      </button>
                      <span className="order-num">{item.sort_order}</span>
                      <button
                        type="button"
                        className="order-btn"
                        disabled={idx === categories.length - 1}
                        onClick={() => handleMoveDown(idx)}
                        title="Di chuyển xuống dưới"
                      >
                        ▼
                      </button>
                    </div>
                  </td>
                  <td className="cat-code">{item.code}</td>
                  <td><strong>{item.name}</strong></td>
                  <td>
                    {item.is_referenced ? (
                      <span className="ref-tag referenced" title="Đang được liên kết với dữ liệu thật, không thể xóa">
                        🔒 Đang dùng ({item.reference_count} bản ghi)
                      </span>
                    ) : (
                      <span className="ref-tag unreferenced">Chưa dùng (Có thể xóa)</span>
                    )}
                  </td>
                  <td className="cat-desc">{item.description || '—'}</td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="cat-action-btn edit-btn"
                      onClick={() => handleOpenEdit(item)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="cat-action-btn delete-btn"
                      disabled={item.is_referenced}
                      title={item.is_referenced ? 'Đang được tham chiếu - không thể xóa!' : 'Xóa danh mục'}
                      onClick={() => handleDelete(item)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm / Chỉnh sửa */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content cat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Chỉnh sửa danh mục' : 'Thêm mới danh mục'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-form-group">
                  <label>Mã danh mục *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Tên hiển thị chuẩn *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: Ngành Bán lẻ..."
                  />
                </div>
                <div className="modal-form-group">
                  <label>Mô tả áp dụng</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Lưu thay đổi' : 'Thêm danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
