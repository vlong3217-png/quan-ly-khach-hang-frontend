import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext.tsx'
import { productService } from '../../services/productService.ts'
import type { Product, ProductType, ProductStatus } from '../../types/product.ts'
import './ProductsPage.css'

export default function ProductsPage() {
  const { user } = useAuth()
  const isSalesDirectorOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<ProductType | ''>('')
  const [filterStatus, setFilterStatus] = useState<ProductStatus | ''>('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Modal Thêm / Sửa
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ONE_TIME' as ProductType,
    unit: 'Gói',
    list_price: 0,
    floor_price: 0,
    cost_price: 0,
    status: 'ACTIVE' as ProductStatus,
    description: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadProducts = () => {
    const list = productService.getProducts({
      search,
      type: filterType,
      status: filterStatus,
    })
    setProducts(list)
  }

  useEffect(() => {
    loadProducts()
    setCurrentPage(1)
  }, [search, filterType, filterStatus])

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize))
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return products.slice(start, start + pageSize)
  }, [products, currentPage, pageSize])

  const handleOpenCreate = () => {
    setEditingProduct(null)
    setFormData({
      code: `SP-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      type: 'ONE_TIME',
      unit: 'Gói',
      list_price: 1000000,
      floor_price: 800000,
      cost_price: 500000,
      status: 'ACTIVE',
      description: '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p)
    setFormData({
      code: p.code,
      name: p.name,
      type: p.type,
      unit: p.unit,
      list_price: p.list_price,
      floor_price: p.floor_price,
      cost_price: p.cost_price || 0,
      status: p.status,
      description: p.description || '',
    })
    setFormErrors({})
    setIsModalOpen(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    if (!formData.code.trim()) errors.code = 'Mã sản phẩm không được để trống'
    if (!formData.name.trim()) errors.name = 'Tên sản phẩm không được để trống'
    if (formData.list_price <= 0) errors.list_price = 'Giá niêm yết phải lớn hơn 0'
    if (formData.floor_price <= 0) errors.floor_price = 'Giá sàn phải lớn hơn 0'
    if (formData.floor_price > formData.list_price) {
      errors.floor_price = 'Giá sàn không được cao hơn Giá niêm yết'
    }
    if (isSalesDirectorOrAdmin && formData.cost_price < 0) {
      errors.cost_price = 'Giá vốn không thể là số âm'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      if (editingProduct) {
        productService.updateProduct(editingProduct.id, {
          ...formData,
          // Nếu không phải GĐKD/Admin thì giữ nguyên giá vốn cũ
          cost_price: isSalesDirectorOrAdmin ? formData.cost_price : editingProduct.cost_price,
        })
        showToast(`Đã cập nhật sản phẩm "${formData.name}" thành công!`, 'success')
      } else {
        productService.createProduct({
          ...formData,
          has_quotes: false,
        })
        showToast(`Đã thêm mới sản phẩm "${formData.name}" thành công!`, 'success')
      }
      setIsModalOpen(false)
      loadProducts()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error')
    }
  }

  const handleDelete = (p: Product) => {
    if (p.has_quotes) {
      showToast(
        'Sản phẩm đã xuất hiện trong báo giá của hệ thống! Không thể xóa, chỉ được chuyển sang "Ngừng kinh doanh".',
        'error'
      )
      return
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${p.name}"?`)) {
      try {
        productService.deleteProduct(p.id)
        showToast(`Đã xóa sản phẩm "${p.name}" thành công!`, 'success')
        loadProducts()
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error')
      }
    }
  }

  const handleToggleStatus = (p: Product) => {
    try {
      const updated = productService.toggleDiscontinue(p.id)
      showToast(
        `Đã chuyển trạng thái sản phẩm sang "${updated.status === 'ACTIVE' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}"!`,
        'success'
      )
      loadProducts()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Có lỗi xảy ra', 'error')
    }
  }

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '—'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)
  }

  return (
    <div className="products-page-container">
      {toast && (
        <div className={`products-toast toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <div className="products-header">
        <div>
          <h2>Quản lý Sản phẩm / Dịch vụ & Bảng giá niêm yết</h2>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleOpenCreate}>
          + Thêm sản phẩm / dịch vụ
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="products-filter-bar">
        <input
          type="text"
          className="filter-search"
          placeholder="Tìm theo mã, tên sản phẩm hoặc mô tả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as ProductType | '')}
        >
          <option value="">Tất cả loại sản phẩm</option>
          <option value="ONE_TIME">Sản phẩm một lần</option>
          <option value="SUBSCRIPTION">Dịch vụ thuê bao</option>
        </select>
        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ProductStatus | '')}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang kinh doanh</option>
          <option value="DISCONTINUED">Ngừng kinh doanh</option>
        </select>
      </div>

      {/* Bảng dữ liệu */}
      <div className="products-table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Tên sản phẩm / Dịch vụ</th>
              <th>Loại</th>
              <th>ĐVT</th>
              <th>Giá niêm yết</th>
              <th>Giá sàn (Ngưỡng duyệt CK)</th>
              {isSalesDirectorOrAdmin && <th>Giá vốn (Bảo mật GĐKD)</th>}
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {pagedProducts.length === 0 ? (
              <tr>
                <td colSpan={isSalesDirectorOrAdmin ? 9 : 8} className="empty-cell">
                  Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              pagedProducts.map((p) => (
                <tr key={p.id}>
                  <td className="code-badge">{p.code}</td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.has_quotes && (
                      <span className="quote-tag" title="Sản phẩm đã nằm trong báo giá (Không thể xóa)">
                        Đã có báo giá
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`type-tag type-${p.type.toLowerCase()}`}>
                      {p.type === 'ONE_TIME' ? 'Sản phẩm 1 lần' : 'Thuê bao kỳ hạn'}
                    </span>
                  </td>
                  <td>{p.unit}</td>
                  <td className="price-text">{formatCurrency(p.list_price)}</td>
                  <td className="floor-price-text">{formatCurrency(p.floor_price)}</td>
                  {isSalesDirectorOrAdmin && (
                    <td className="cost-price-text">{formatCurrency(p.cost_price)}</td>
                  )}
                  <td>
                    <span className={`status-pill status-${p.status.toLowerCase()}`}>
                      {p.status === 'ACTIVE' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      type="button"
                      className="action-btn edit-btn"
                      title="Chỉnh sửa"
                      onClick={() => handleOpenEdit(p)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="action-btn toggle-btn"
                      title={p.status === 'ACTIVE' ? 'Ngừng kinh doanh' : 'Mở lại kinh doanh'}
                      onClick={() => handleToggleStatus(p)}
                    >
                      {p.status === 'ACTIVE' ? 'Ngừng' : 'Mở lại'}
                    </button>
                    <button
                      type="button"
                      className="action-btn delete-btn"
                      disabled={p.has_quotes}
                      title={p.has_quotes ? 'Đã có trong báo giá - không thể xóa!' : 'Xóa sản phẩm'}
                      onClick={() => handleDelete(p)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Thanh phân trang Pagination */}
        {products.length > 0 && (
          <div className="customer-pagination">
            <div className="customer-pagination-info">
              <span>
                Hiển thị <strong>{Math.min((currentPage - 1) * pageSize + 1, products.length)}</strong> -{' '}
                <strong>{Math.min(currentPage * pageSize, products.length)}</strong> trên tổng số{' '}
                <strong>{products.length}</strong> sản phẩm
              </span>
              <div className="customer-pagination-size">
                <label htmlFor="prod-page-size-select">Hiển thị:</label>
                <select
                  id="prod-page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="customer-pagination-select"
                >
                  <option value={5}>5 sản phẩm / trang</option>
                  <option value={10}>10 sản phẩm / trang</option>
                  <option value={20}>20 sản phẩm / trang</option>
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    className={`customer-page-btn number-btn ${
                      pageNum === currentPage ? 'active' : ''
                    }`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                className="customer-page-btn nav-btn"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Thêm / Chỉnh sửa */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Chỉnh sửa sản phẩm / dịch vụ' : 'Thêm mới sản phẩm / dịch vụ'}</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="modal-row">
                  <div className="modal-form-group">
                    <label>Mã sản phẩm *</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="VD: SP-CRM-01"
                    />
                    {formErrors.code && <span className="field-error">{formErrors.code}</span>}
                  </div>
                  <div className="modal-form-group">
                    <label>Loại sản phẩm *</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as ProductType })
                      }
                    >
                      <option value="ONE_TIME">Sản phẩm một lần</option>
                      <option value="SUBSCRIPTION">Dịch vụ thuê bao</option>
                    </select>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label>Tên sản phẩm / Dịch vụ *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="VD: CRM Cloud Doanh Nghiệp"
                  />
                  {formErrors.name && <span className="field-error">{formErrors.name}</span>}
                </div>

                <div className="modal-row">
                  <div className="modal-form-group">
                    <label>Đơn vị tính *</label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="VD: Gói, User/Tháng, Buổi..."
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Trạng thái</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as ProductStatus })
                      }
                    >
                      <option value="ACTIVE">Đang kinh doanh</option>
                      <option value="DISCONTINUED">Ngừng kinh doanh</option>
                    </select>
                  </div>
                </div>

                <div className="modal-row">
                  <div className="modal-form-group">
                    <label>Giá niêm yết (VNĐ) *</label>
                    <input
                      type="number"
                      value={formData.list_price}
                      onChange={(e) => setFormData({ ...formData, list_price: Number(e.target.value) })}
                    />
                    {formErrors.list_price && (
                      <span className="field-error">{formErrors.list_price}</span>
                    )}
                  </div>
                  <div className="modal-form-group">
                    <label>Giá sàn (Ngưỡng duyệt chiết khấu) *</label>
                    <input
                      type="number"
                      value={formData.floor_price}
                      onChange={(e) => setFormData({ ...formData, floor_price: Number(e.target.value) })}
                    />
                    {formErrors.floor_price && (
                      <span className="field-error">{formErrors.floor_price}</span>
                    )}
                  </div>
                </div>

                {isSalesDirectorOrAdmin && (
                  <div className="modal-form-group privileged-field">
                    <label>Giá vốn (Chỉ Giám đốc kinh doanh xem và sửa)</label>
                    <input
                      type="number"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                    />
                    {formErrors.cost_price && (
                      <span className="field-error">{formErrors.cost_price}</span>
                    )}
                  </div>
                )}

                <div className="modal-form-group">
                  <label>Mô tả chi tiết</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả thông số hoặc phạm vi cung cấp dịch vụ..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
