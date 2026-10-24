import React from 'react'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  label?: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  style?: React.CSSProperties
  className?: string
}

export default function StandardPagination({
  page,
  pageSize,
  total,
  label = 'mục',
  onPageChange,
  onPageSizeChange,
  style,
  className = '',
}: PaginationProps) {
  if (!total || total <= 0) return null

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pages: Array<number | '...'> = []

  if (totalPages <= 7) {
    for (let current = 1; current <= totalPages; current++) pages.push(current)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (
      let current = Math.max(2, page - 1);
      current <= Math.min(totalPages - 1, page + 1);
      current++
    ) {
      pages.push(current)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  const startRecord = Math.min((page - 1) * pageSize + 1, total)
  const endRecord = Math.min(page * pageSize, total)

  return (
    <div
      className={`customer-pagination ${className}`.trim()}
      style={{
        margin: '16px 20px 20px',
        borderTop: '1px solid #e2e8f0',
        paddingTop: '16px',
        ...style,
      }}
    >
      <div className="customer-pagination-info">
        <span>
          Hiển thị <strong>{startRecord}</strong> - <strong>{endRecord}</strong> trên tổng số{' '}
          <strong>{total}</strong> {label}
        </span>
        <div className="customer-pagination-size">
          <label>Số dòng:</label>
          <select
            className="customer-pagination-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} / trang
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="customer-pagination-controls">
        <button
          type="button"
          className="customer-page-btn nav-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Trước
        </button>
        <div className="customer-page-numbers">
          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="lead-pagination-ellipsis" style={{ padding: '0 6px', color: '#94a3b8' }}>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`customer-page-btn page-num ${p === page ? 'active' : ''}`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          type="button"
          className="customer-page-btn nav-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  )
}
