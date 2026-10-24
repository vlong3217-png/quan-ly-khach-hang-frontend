import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { customerService } from '../../services/customerService.ts'
import { contractService } from '../../services/contractService.ts'
import { opportunityService } from '../../services/opportunityService.ts'
import './GlobalSearch.css'

interface SearchResultItem {
  id: string
  type: 'CUSTOMER' | 'CONTRACT' | 'OPPORTUNITY'
  title: string
  subText: string
  meta?: string
  link: string
}

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconCustomerBadge = () => (
  <span className="search-result-badge badge-customer">Khách hàng</span>
)

const IconContractBadge = () => (
  <span className="search-result-badge badge-contract">Hợp đồng</span>
)

const IconOpportunityBadge = () => (
  <span className="search-result-badge badge-opportunity">Cơ hội</span>
)

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Xử lý click ngoài để đóng popup tìm kiếm
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Phím tắt Ctrl+K hoặc / để focus vào ô tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        const input = document.getElementById('global-search-input')
        input?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Tìm kiếm khi query thay đổi
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || trimmed.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      const q = trimmed.toLowerCase()
      const searchHits: SearchResultItem[] = []

      try {
        // 1. Tìm Khách hàng (Tên, Mã KH, SĐT, Mã số thuế)
        const customers = customerService.getCustomers()
        for (const c of customers) {
          if (
            (c.name && c.name.toLowerCase().includes(q)) ||
            (c.code && c.code.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q)) ||
            (c.tax_code && c.tax_code.toLowerCase().includes(q))
          ) {
            searchHits.push({
              id: `cust-${c.id}`,
              type: 'CUSTOMER',
              title: c.name,
              subText: `Mã: ${c.code || c.id} • SĐT: ${c.phone || 'Chưa có'}`,
              meta: c.industry || 'Doanh nghiệp',
              link: `/dashboard/customers?highlight=${c.id}`,
            })
            if (searchHits.length >= 6) break
          }
        }

        // 2. Tìm Hợp đồng (Số HĐ, Tên khách hàng)
        const contracts = contractService.getContracts()
        for (const ct of contracts) {
          if (
            (ct.contract_number && ct.contract_number.toLowerCase().includes(q)) ||
            (ct.customer_name && ct.customer_name.toLowerCase().includes(q))
          ) {
            searchHits.push({
              id: `contract-${ct.id}`,
              type: 'CONTRACT',
              title: `HĐ: ${ct.contract_number}`,
              subText: `KH: ${ct.customer_name} • Giá trị: ${Number(ct.total_value).toLocaleString('vi-VN')} đ`,
              meta: ct.status,
              link: `/dashboard/contracts`,
            })
            if (searchHits.length >= 10) break
          }
        }

        // 3. Tìm Cơ hội (Tên cơ hội, Khách hàng)
        const opps = await opportunityService.getOpportunities()
        for (const op of opps) {
          if (
            (op.title && op.title.toLowerCase().includes(q)) ||
            (op.customer_name && op.customer_name.toLowerCase().includes(q)) ||
            (op.code && op.code.toLowerCase().includes(q))
          ) {
            searchHits.push({
              id: `opp-${op.id}`,
              type: 'OPPORTUNITY',
              title: op.title,
              subText: `KH: ${op.customer_name || 'N/A'} • Giai đoạn: ${op.stage_name || op.stage_id}`,
              meta: op.code,
              link: `/dashboard/opportunities`,
            })
            if (searchHits.length >= 14) break
          }
        }
      } catch (err) {
        console.error('Error executing global search:', err)
      } finally {
        setResults(searchHits)
        setIsLoading(false)
        setIsOpen(true)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  const handleSelectItem = (item: SearchResultItem) => {
    setIsOpen(false)
    setQuery('')
    navigate(item.link)
  }

  return (
    <div className="global-search-container" ref={wrapperRef}>
      <div className="global-search-box">
        <IconSearch />
        <input
          id="global-search-input"
          type="text"
          className="global-search-input"
          placeholder="Tìm khách hàng, SĐT, mã HĐ... (Ctrl + K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            className="global-search-clear"
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
          >
            ×
          </button>
        )}
      </div>

      {/* Kết quả tìm kiếm popup */}
      {isOpen && (
        <div className="global-search-dropdown" role="listbox">
          {isLoading ? (
            <div className="global-search-loading">Đang tìm kiếm dữ liệu...</div>
          ) : results.length === 0 ? (
            <div className="global-search-empty">
              Không tìm thấy kết quả phù hợp cho "{query}"
            </div>
          ) : (
            <div className="global-search-results-list">
              <div className="global-search-header-hint">
                Tìm thấy {results.length} kết quả phù hợp:
              </div>
              {results.map((item) => (
                <div
                  key={item.id}
                  className="global-search-result-item"
                  onClick={() => handleSelectItem(item)}
                  role="option"
                  aria-selected="false"
                >
                  <div className="search-result-main">
                    <div className="search-result-title-row">
                      {item.type === 'CUSTOMER' && <IconCustomerBadge />}
                      {item.type === 'CONTRACT' && <IconContractBadge />}
                      {item.type === 'OPPORTUNITY' && <IconOpportunityBadge />}
                      <span className="search-result-title">{item.title}</span>
                    </div>
                    <span className="search-result-subtext">{item.subText}</span>
                  </div>
                  {item.meta && <span className="search-result-meta">{item.meta}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
