import type { CustomerEnterprise, CustomerFilterParams } from '../types/customer.ts'

const STORAGE_KEY = 'crm_enterprise_customers_data'

const INITIAL_CUSTOMERS: CustomerEnterprise[] = [
  {
    id: 'cust-001',
    code: 'KH-001',
    name: 'Công ty Cổ phần Công Nghệ Alpha',
    tax_code: '0102345678',
    industry: 'Công nghệ thông tin & Viễn thông',
    company_size: '50 - 200 nhân sự (Quy mô vừa)',
    website: 'https://alphatech.vn',
    address: 'Tầng 12, Tòa nhà Keangnam Landmark 72, Nam Từ Liêm, Hà Nội',
    phone: '024 3768 9999',
    email: 'contact@alphatech.vn',
    owner_id: 1,
    owner_name: 'Nguyễn Văn An',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    status: 'ACTIVE_CUSTOMER',
    description: 'Khách hàng chiến lược đang triển khai phần mềm CRM gói Pro.',
    created_at: '2025-01-10T08:30:00Z',
    updated_at: '2025-02-15T09:00:00Z',
  },
  {
    id: 'cust-002',
    code: 'KH-002',
    name: 'Tập đoàn Xây dựng & Bất động sản Hòa Bình',
    tax_code: '0301122334',
    industry: 'Bất động sản & Xây dựng',
    company_size: 'Trên 200 nhân sự (Tập đoàn lớn)',
    website: 'https://hoabinhgroup.vn',
    address: 'Số 123 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh',
    phone: '028 3822 4567',
    email: 'info@hoabinhgroup.vn',
    owner_id: 2,
    owner_name: 'Trần Thị Bình',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    status: 'IN_TRANSACTION',
    description: 'Đang đàm phán hợp đồng chuyển đổi số quản lý công trình đợt 2.',
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-03-01T14:20:00Z',
  },
  {
    id: 'cust-003',
    code: 'KH-003',
    name: 'Hệ thống Bán lẻ Toàn Cầu Mekong Mart',
    tax_code: '0309988776',
    industry: 'Hàng tiêu dùng nhanh & Bán lẻ',
    company_size: 'Trên 200 nhân sự (Tập đoàn lớn)',
    website: 'https://mekongretail.com',
    address: 'Lô C2, Khu công nghiệp Tân Bình, Tây Thạnh, Tân Phú, TP. HCM',
    phone: '028 3948 1122',
    email: 'corporate@mekongretail.com',
    owner_id: 3,
    owner_name: 'Lê Hoàng Cường',
    team_id: 2,
    team_name: 'Đội Kinh Doanh 2',
    status: 'POTENTIAL',
    description: 'Mới nhận được yêu cầu demo giải pháp tích hợp điểm bán lẻ.',
    created_at: '2025-02-05T09:15:00Z',
    updated_at: '2025-02-05T09:15:00Z',
  },
  {
    id: 'cust-004',
    code: 'KH-004',
    name: 'Tổng Công ty Logistics Sao Vàng Toàn Cầu',
    tax_code: '0200456789',
    industry: 'Sản xuất & Chế tạo công nghiệp',
    company_size: '50 - 200 nhân sự (Quy mô vừa)',
    website: 'https://goldenstarlogistics.com',
    address: 'Khu công nghiệp Đình Vũ, Đông Hải 2, Hải An, Hải Phòng',
    phone: '0225 3855 666',
    email: 'booking@goldenstarlogistics.com',
    owner_id: 4,
    owner_name: 'Phạm Minh Duy',
    team_id: 2,
    team_name: 'Đội Kinh Doanh 2',
    status: 'STOPPED',
    description: 'Tạm dừng do khách chuyển hướng tái cơ cấu nguồn vốn.',
    created_at: '2025-01-20T11:00:00Z',
    updated_at: '2025-03-10T16:00:00Z',
  },
  {
    id: 'cust-005',
    code: 'KH-005',
    name: 'Công ty Cổ phần Nông nghiệp Xanh Việt',
    tax_code: '0400876543',
    industry: 'Hàng tiêu dùng nhanh & Bán lẻ',
    company_size: '10 - 50 nhân sự (Doanh nghiệp nhỏ)',
    website: 'https://greenvietagri.vn',
    address: 'Km 15, Quốc lộ 1A, Hòa Châu, Hòa Vang, TP. Đà Nẵng',
    phone: '0236 3678 123',
    email: 'agri@greenviet.vn',
    owner_id: 1,
    owner_name: 'Nguyễn Văn An',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    status: 'IN_TRANSACTION',
    description: 'Đã báo giá gói CRM Cloud và chuẩn bị ký kết hợp đồng.',
    created_at: '2025-02-18T14:45:00Z',
    updated_at: '2025-03-12T10:30:00Z',
  },
  {
    id: 'cust-006',
    code: 'KH-006',
    name: 'Công ty Dược phẩm Quốc tế Hải Đăng',
    tax_code: '0109876543',
    industry: 'Tài chính - Ngân hàng - Bảo hiểm',
    company_size: '50 - 200 nhân sự (Quy mô vừa)',
    website: 'https://haidangpharma.vn',
    address: 'Số 45 Hoàng Cầu, Đống Đa, Hà Nội',
    phone: '024 3856 2244',
    email: 'support@haidangpharma.vn',
    owner_id: 2,
    owner_name: 'Trần Thị Bình',
    team_id: 1,
    team_name: 'Đội Kinh Doanh 1',
    status: 'ACTIVE_CUSTOMER',
    description: 'Khách hàng thân thiết sử dụng dịch vụ SMS Brandname hàng tháng.',
    created_at: '2025-01-25T08:00:00Z',
    updated_at: '2025-03-15T11:00:00Z',
  },
]

function getStoredCustomers(): CustomerEnterprise[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CUSTOMERS))
  return INITIAL_CUSTOMERS
}

function saveStoredCustomers(customers: CustomerEnterprise[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
}

export const customerService = {
  /**
   * Lấy danh sách khách hàng có hỗ trợ lọc và tìm kiếm
   */
  getCustomers(params?: CustomerFilterParams): CustomerEnterprise[] {
    let list = getStoredCustomers()

    if (!params) return list

    const { search, status, industry, company_size, owner_id } = params

    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.tax_code && c.tax_code.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q)) ||
          (c.website && c.website.toLowerCase().includes(q))
      )
    }

    if (status) {
      list = list.filter((c) => c.status === status)
    }

    if (industry) {
      list = list.filter((c) => c.industry === industry)
    }

    if (company_size) {
      list = list.filter((c) => c.company_size === company_size)
    }

    if (owner_id !== undefined && owner_id !== '') {
      list = list.filter((c) => c.owner_id === Number(owner_id))
    }

    return list
  },

  /**
   * Lấy chi tiết 1 khách hàng theo ID
   */
  getCustomerById(id: string): CustomerEnterprise | undefined {
    const list = getStoredCustomers()
    return list.find((c) => c.id === id)
  },

  /**
   * Kiểm tra trùng mã số thuế (AC: Mã số thuế nếu có thì phải là duy nhất)
   * Trả về true nếu mã số thuế đã bị trùng bởi khách hàng khác
   */
  isTaxCodeDuplicate(taxCode: string, excludeId?: string): boolean {
    if (!taxCode || !taxCode.trim()) return false
    const trimmed = taxCode.trim()
    const list = getStoredCustomers()
    return list.some((c) => c.tax_code && c.tax_code.trim() === trimmed && c.id !== excludeId)
  },

  /**
   * Thêm mới khách hàng doanh nghiệp
   */
  createCustomer(data: Omit<CustomerEnterprise, 'id' | 'code' | 'created_at' | 'updated_at'>): CustomerEnterprise {
    const list = getStoredCustomers()

    // Kiểm tra tính duy nhất của mã số thuế nếu có
    if (data.tax_code && this.isTaxCodeDuplicate(data.tax_code)) {
      throw new Error(`Mã số thuế "${data.tax_code}" đã tồn tại trên hệ thống!`)
    }

    // Tự sinh mã KH tiếp theo: KH-001, KH-002, ...
    const maxNum = list.reduce((max, item) => {
      const match = item.code.match(/^KH-(\d+)$/)
      if (match) {
        const num = parseInt(match[1], 10)
        return num > max ? num : max
      }
      return max
    }, 0)
    const nextCode = `KH-${String(maxNum + 1).padStart(3, '0')}`

    const now = new Date().toISOString()
    const newCustomer: CustomerEnterprise = {
      ...data,
      id: `cust-${Date.now()}`,
      code: nextCode,
      created_at: now,
      updated_at: now,
    }

    const updated = [newCustomer, ...list]
    saveStoredCustomers(updated)
    return newCustomer
  },

  /**
   * Cập nhật thông tin khách hàng
   */
  updateCustomer(id: string, data: Partial<Omit<CustomerEnterprise, 'id' | 'code' | 'created_at'>>): CustomerEnterprise {
    const list = getStoredCustomers()
    const index = list.findIndex((c) => c.id === id)
    if (index === -1) {
      throw new Error('Không tìm thấy khách hàng cần cập nhật!')
    }

    // Kiểm tra tính duy nhất của mã số thuế nếu có
    if (data.tax_code && this.isTaxCodeDuplicate(data.tax_code, id)) {
      throw new Error(`Mã số thuế "${data.tax_code}" đã tồn tại trên một khách hàng khác!`)
    }

    const updatedCustomer: CustomerEnterprise = {
      ...list[index],
      ...data,
      updated_at: new Date().toISOString(),
    }

    list[index] = updatedCustomer
    saveStoredCustomers(list)
    return updatedCustomer
  },

  /**
   * Xóa khách hàng
   */
  deleteCustomer(id: string): boolean {
    const list = getStoredCustomers()
    const filtered = list.filter((c) => c.id !== id)
    if (filtered.length === list.length) {
      return false
    }
    saveStoredCustomers(filtered)
    return true
  },

  /**
   * Khôi phục danh sách mẫu ban đầu
   */
  resetToSampleData(): CustomerEnterprise[] {
    saveStoredCustomers(INITIAL_CUSTOMERS)
    return INITIAL_CUSTOMERS
  },
}
