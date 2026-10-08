import type {
  CustomerEnterprise,
  CustomerFilterParams,
  CustomerContact,
  ContactHistoryEntry,
  CustomerDeal,
  CustomerActivity,
  CustomerAttachment,
  DuplicateCustomerGroup,
  ParentChildRelation,
  SupportTicket,
  PeriodicCareCustomer,
} from '../types/customer.ts'

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

const STORAGE_CONTACTS_KEY = 'crm_enterprise_contacts_data'

const INITIAL_CONTACTS: CustomerContact[] = [
  {
    id: 'cont-001',
    customer_id: 'cust-001',
    customer_name: 'Công ty Cổ phần Công Nghệ Alpha',
    full_name: 'Trần Văn Hải',
    title: 'Giám đốc Công nghệ (CTO)',
    email: 'hai.tran@alphatech.vn',
    phone: '0912 345 678',
    buying_role: 'DECISION_MAKER',
    is_primary: true,
    notes: 'Quyết định trực tiếp về kiến trúc và phê duyệt hợp đồng kỹ thuật.',
    created_at: '2025-01-10T09:00:00Z',
    updated_at: '2025-01-10T09:00:00Z',
  },
  {
    id: 'cont-002',
    customer_id: 'cust-001',
    customer_name: 'Công ty Cổ phần Công Nghệ Alpha',
    full_name: 'Nguyễn Thị Hương',
    title: 'Trưởng phòng Vận hành Sales',
    email: 'huong.nguyen@alphatech.vn',
    phone: '0988 123 456',
    buying_role: 'END_USER',
    is_primary: false,
    notes: 'Người quản lý đội ngũ 30 nhân viên sử dụng hàng ngày.',
    created_at: '2025-01-11T10:00:00Z',
    updated_at: '2025-01-11T10:00:00Z',
  },
  {
    id: 'cont-003',
    customer_id: 'cust-002',
    customer_name: 'Tập đoàn Xây dựng & Bất động sản Hòa Bình',
    full_name: 'Đặng Quốc Huy',
    title: 'Phó Tổng Giám Đốc Đầu Tư',
    email: 'huy.dang@hoabinhgroup.vn',
    phone: '0903 888 999',
    buying_role: 'DECISION_MAKER',
    is_primary: true,
    notes: 'Người ký hợp đồng chính và phê duyệt hạn mức ngân sách.',
    created_at: '2025-01-16T11:00:00Z',
    updated_at: '2025-01-16T11:00:00Z',
  },
  {
    id: 'cont-004',
    customer_id: 'cust-002',
    customer_name: 'Tập đoàn Xây dựng & Bất động sản Hòa Bình',
    full_name: 'Vũ Đức Thịnh',
    title: 'Trưởng ban Kiểm soát Tài chính',
    email: 'thinh.vu@hoabinhgroup.vn',
    phone: '0937 222 333',
    buying_role: 'BLOCKER',
    is_primary: false,
    notes: 'Rất khắt khe về điều khoản thanh toán trả chậm và bảo hành.',
    created_at: '2025-01-17T14:00:00Z',
    updated_at: '2025-01-17T14:00:00Z',
  },
  {
    id: 'cont-005',
    customer_id: 'cust-003',
    customer_name: 'Hệ thống Bán lẻ Toàn Cầu Mekong Mart',
    full_name: 'Lê Thu Trang',
    title: 'Giám đốc Mua hàng & Cung ứng',
    email: 'trang.le@mekongretail.com',
    phone: '0945 666 777',
    buying_role: 'INFLUENCER',
    is_primary: true,
    notes: 'Ảnh hưởng lớn đến hội đồng đánh giá thầu nhà cung cấp.',
    created_at: '2025-02-06T15:00:00Z',
    updated_at: '2025-02-06T15:00:00Z',
  },
]

function getStoredContacts(): CustomerContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_CONTACTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(INITIAL_CONTACTS))
  return INITIAL_CONTACTS
}

function saveStoredContacts(contacts: CustomerContact[]): void {
  localStorage.setItem(STORAGE_CONTACTS_KEY, JSON.stringify(contacts))
}

const STORAGE_DEALS_KEY = 'crm_enterprise_deals_data'
const INITIAL_DEALS: CustomerDeal[] = [
  {
    id: 'deal-001',
    customer_id: 'cust-001',
    title: 'Hợp đồng Bản quyền CRM Enterprise 150 User',
    value: 120000000,
    stage: 'WON',
    status: 'CLOSED_WON',
    expected_close_date: '2025-01-20',
    created_at: '2025-01-10T10:00:00Z',
  },
  {
    id: 'deal-002',
    customer_id: 'cust-001',
    title: 'Gói Dịch vụ Tùy biến Báo cáo BI theo yêu cầu',
    value: 45000000,
    stage: 'NEGOTIATION',
    status: 'OPEN',
    expected_close_date: '2025-04-15',
    created_at: '2025-02-01T14:30:00Z',
  },
  {
    id: 'deal-003',
    customer_id: 'cust-002',
    title: 'Gói Chuyển đổi số quản lý công trình đợt 2',
    value: 280000000,
    stage: 'PROPOSAL',
    status: 'OPEN',
    expected_close_date: '2025-05-10',
    created_at: '2025-01-18T09:00:00Z',
  },
  {
    id: 'deal-004',
    customer_id: 'cust-002',
    title: 'Hợp đồng bảo trì hạ tầng hệ thống năm 2024',
    value: 60000000,
    stage: 'WON',
    status: 'CLOSED_WON',
    expected_close_date: '2024-12-15',
    created_at: '2024-11-20T08:00:00Z',
  },
]

function getStoredDeals(): CustomerDeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_DEALS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_DEALS_KEY, JSON.stringify(INITIAL_DEALS))
  return INITIAL_DEALS
}

function saveStoredDeals(deals: CustomerDeal[]): void {
  localStorage.setItem(STORAGE_DEALS_KEY, JSON.stringify(deals))
}

const STORAGE_ACTIVITIES_KEY = 'crm_enterprise_activities_data'
const INITIAL_ACTIVITIES: CustomerActivity[] = [
  {
    id: 'act-001',
    customer_id: 'cust-001',
    type: 'CALL',
    title: 'Gọi điện xác nhận lịch triển khai đợt 2',
    description: 'Trao đổi với CTO Trần Văn Hải về tiến độ tích hợp cơ sở dữ liệu.',
    performed_by_name: 'Nguyễn Văn An',
    performed_at: '2025-02-15T09:30:00Z',
  },
  {
    id: 'act-002',
    customer_id: 'cust-001',
    type: 'MEETING',
    title: 'Họp nghiệm thu giai đoạn 1 tại trụ sở khách hàng',
    description: 'Ký biên bản bàn giao tính năng phân quyền dữ liệu và tài khoản.',
    performed_by_name: 'Nguyễn Văn An',
    performed_at: '2025-01-28T14:00:00Z',
  },
  {
    id: 'act-003',
    customer_id: 'cust-002',
    type: 'DEMO',
    title: 'Demo giải pháp Mobile App cho kỹ sư công trường',
    description: 'Trình bày tính năng chấm công và nhập nhật ký thi công offline.',
    performed_by_name: 'Trần Thị Bình',
    performed_at: '2025-02-20T10:00:00Z',
  },
]

function getStoredActivities(): CustomerActivity[] {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVITIES_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(INITIAL_ACTIVITIES))
  return INITIAL_ACTIVITIES
}

function saveStoredActivities(activities: CustomerActivity[]): void {
  localStorage.setItem(STORAGE_ACTIVITIES_KEY, JSON.stringify(activities))
}

const STORAGE_ATTACHMENTS_KEY = 'crm_enterprise_attachments_data'
const INITIAL_ATTACHMENTS: CustomerAttachment[] = [
  {
    id: 'att-001',
    customer_id: 'cust-001',
    file_name: 'Hop_dong_kinh_te_CRM_Alpha_2025.pdf',
    file_size: '2.4 MB',
    file_type: 'PDF',
    uploaded_by: 'Nguyễn Văn An',
    uploaded_at: '2025-01-20T11:00:00Z',
  },
  {
    id: 'att-002',
    customer_id: 'cust-001',
    file_name: 'Ban_dac_ta_yeu_cau_ky_thuat_v2.docx',
    file_size: '850 KB',
    file_type: 'DOCX',
    uploaded_by: 'Trần Văn Hải (Khách)',
    uploaded_at: '2025-01-15T09:00:00Z',
  },
]

function getStoredAttachments(): CustomerAttachment[] {
  try {
    const raw = localStorage.getItem(STORAGE_ATTACHMENTS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_ATTACHMENTS_KEY, JSON.stringify(INITIAL_ATTACHMENTS))
  return INITIAL_ATTACHMENTS
}

function saveStoredAttachments(attachments: CustomerAttachment[]): void {
  localStorage.setItem(STORAGE_ATTACHMENTS_KEY, JSON.stringify(attachments))
}

const STORAGE_TICKETS_KEY = 'crm_enterprise_support_tickets_data'
const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'tick-001',
    customer_id: 'cust-001',
    customer_name: 'Công ty Cổ phần Công Nghệ Alpha',
    title: 'Lỗi đồng bộ danh bạ từ máy chấm công vân tay',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignee_name: 'Lê Hoàng Cường',
    assignee_id: 3,
    description: 'Dữ liệu ca đêm bị trễ 2 tiếng sau khi mất kết nối mạng cục bộ.',
    created_at: '2025-03-01T08:30:00Z',
    updated_at: '2025-03-01T10:00:00Z',
  },
  {
    id: 'tick-002',
    customer_id: 'cust-004',
    customer_name: 'Tổng Công ty Logistics Sao Vàng Toàn Cầu',
    title: 'Yêu cầu hỗ trợ xuất hóa đơn điện tử điều chỉnh',
    priority: 'URGENT',
    status: 'NEW',
    assignee_name: 'Hoàng Thị Em',
    assignee_id: 5,
    description: 'Hóa đơn tháng 1 bị sai thông tin địa chỉ chi nhánh Hải Phòng.',
    created_at: '2025-03-05T09:00:00Z',
    updated_at: '2025-03-05T09:00:00Z',
  },
  {
    id: 'tick-003',
    customer_id: 'cust-004',
    customer_name: 'Tổng Công ty Logistics Sao Vàng Toàn Cầu',
    title: 'Tài khoản nhân viên kho không đăng nhập được mobile app',
    priority: 'HIGH',
    status: 'NEW',
    assignee_name: 'Lê Hoàng Cường',
    assignee_id: 3,
    description: 'Báo lỗi phiên hết hạn liên tục khi quét mã barcode.',
    created_at: '2025-03-06T14:00:00Z',
    updated_at: '2025-03-06T14:00:00Z',
  },
]

function getStoredTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_TICKETS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(INITIAL_TICKETS))
  return INITIAL_TICKETS
}

function saveStoredTickets(tickets: SupportTicket[]): void {
  localStorage.setItem(STORAGE_TICKETS_KEY, JSON.stringify(tickets))
}

const STORAGE_RELATIONS_KEY = 'crm_enterprise_parent_child_relations'
const INITIAL_RELATIONS: ParentChildRelation[] = [
  {
    parent_id: 'cust-002',
    child_id: 'cust-001',
    parent_name: 'Tập đoàn Xây dựng & Bất động sản Hòa Bình',
    child_name: 'Công ty Cổ phần Công Nghệ Alpha',
    established_at: '2025-01-01T00:00:00Z',
  },
]

function getStoredRelations(): ParentChildRelation[] {
  try {
    const raw = localStorage.getItem(STORAGE_RELATIONS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_RELATIONS_KEY, JSON.stringify(INITIAL_RELATIONS))
  return INITIAL_RELATIONS
}

function saveStoredRelations(relations: ParentChildRelation[]): void {
  localStorage.setItem(STORAGE_RELATIONS_KEY, JSON.stringify(relations))
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

    if (params.corporate_structure && params.corporate_structure !== 'ALL') {
      const relations = getStoredRelations()
      const parentIds = new Set(relations.map((r) => r.parent_id))
      const childIds = new Set(relations.map((r) => r.child_id))

      if (params.corporate_structure === 'PARENT') {
        list = list.filter((c) => parentIds.has(c.id))
      } else if (params.corporate_structure === 'CHILD') {
        list = list.filter((c) => childIds.has(c.id))
      } else if (params.corporate_structure === 'INDEPENDENT') {
        list = list.filter((c) => !parentIds.has(c.id) && !childIds.has(c.id))
      }
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

    if (data.parent_id) {
      try {
        this.setParentCompany(newCustomer.id, data.parent_id)
      } catch (err) {
        console.warn('Lỗi gán công ty mẹ khi tạo mới:', err)
      }
    }

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

    if (data.parent_id !== undefined) {
      if (data.parent_id) {
        try {
          this.setParentCompany(id, data.parent_id)
        } catch (err) {
          console.warn('Lỗi gán công ty mẹ khi cập nhật:', err)
        }
      } else {
        this.removeParentCompany(id)
      }
    }

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

  /* ──────────── User Story S3-02: Quản lý người liên hệ ──────────── */
  /**
   * Lấy danh sách người liên hệ (hỗ trợ lọc theo customer_id hoặc tìm kiếm)
   */
  getContacts(customerId?: string, search?: string): CustomerContact[] {
    let list = getStoredContacts()
    if (customerId) {
      list = list.filter((c) => c.customer_id === customerId)
    }
    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
    }
    return list
  },

  /**
   * Thêm người liên hệ mới
   * AC: Mỗi khách hàng có thể có một người là đầu mối chính
   */
  createContact(data: Omit<CustomerContact, 'id' | 'created_at' | 'updated_at'>): CustomerContact {
    const list = getStoredContacts()
    const now = new Date().toISOString()

    // Nếu đánh dấu là primary thì bỏ primary của người khác thuộc cùng khách hàng
    if (data.is_primary) {
      list.forEach((c) => {
        if (c.customer_id === data.customer_id) {
          c.is_primary = false
        }
      })
    }

    const newContact: CustomerContact = {
      ...data,
      id: `cont-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: now,
      updated_at: now,
    }

    const updated = [newContact, ...list]
    saveStoredContacts(updated)
    return newContact
  },

  /**
   * Cập nhật người liên hệ
   */
  updateContact(id: string, data: Partial<Omit<CustomerContact, 'id' | 'created_at'>>): CustomerContact {
    const list = getStoredContacts()
    const idx = list.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Không tìm thấy người liên hệ!')

    if (data.is_primary && data.customer_id) {
      list.forEach((c) => {
        if (c.customer_id === data.customer_id && c.id !== id) {
          c.is_primary = false
        }
      })
    }

    const updated: CustomerContact = {
      ...list[idx],
      ...data,
      updated_at: new Date().toISOString(),
    }
    list[idx] = updated
    saveStoredContacts(list)
    return updated
  },

  /**
   * Xóa người liên hệ
   */
  deleteContact(id: string): boolean {
    const list = getStoredContacts()
    const filtered = list.filter((c) => c.id !== id)
    if (filtered.length === list.length) return false
    saveStoredContacts(filtered)
    return true
  },

  /**
   * AC S3-02: Một người liên hệ chuyển sang công ty khác thì gắn lại được sang khách hàng mới, giữ nguyên lịch sử
   */
  transferContactToNewCompany(
    contactId: string,
    newCustomerId: string,
    newCustomerName: string,
    reason?: string
  ): CustomerContact {
    const list = getStoredContacts()
    const idx = list.findIndex((c) => c.id === contactId)
    if (idx === -1) throw new Error('Không tìm thấy người liên hệ để chuyển đổi công ty!')

    const current = list[idx]
    const historyEntry: ContactHistoryEntry = {
      from_customer_id: current.customer_id,
      from_customer_name: current.customer_name,
      to_customer_id: newCustomerId,
      to_customer_name: newCustomerName,
      transferred_at: new Date().toISOString(),
      reason: reason || 'Chuyển đổi công tác sang pháp nhân mới',
    }

    const updated: CustomerContact = {
      ...current,
      customer_id: newCustomerId,
      customer_name: newCustomerName,
      is_primary: false, // Reset primary khi sang cty mới
      history: [historyEntry, ...(current.history || [])],
      updated_at: new Date().toISOString(),
    }

    list[idx] = updated
    saveStoredContacts(list)
    return updated
  },

  /* ──────────── User Story S3-03: Trang 360 độ khách hàng ──────────── */
  getDeals(customerId: string): CustomerDeal[] {
    return getStoredDeals().filter((d) => d.customer_id === customerId)
  },

  addDeal(deal: Omit<CustomerDeal, 'id' | 'created_at'>): CustomerDeal {
    const deals = getStoredDeals()
    const newDeal: CustomerDeal = {
      ...deal,
      id: `deal-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    saveStoredDeals([newDeal, ...deals])
    return newDeal
  },

  getActivities(customerId: string): CustomerActivity[] {
    return getStoredActivities()
      .filter((a) => a.customer_id === customerId)
      .sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime())
  },

  addActivity(activity: Omit<CustomerActivity, 'id' | 'performed_at'>): CustomerActivity {
    const list = getStoredActivities()
    const newAct: CustomerActivity = {
      ...activity,
      id: `act-${Date.now()}`,
      performed_at: new Date().toISOString(),
    }
    saveStoredActivities([newAct, ...list])
    return newAct
  },

  getAttachments(customerId: string): CustomerAttachment[] {
    return getStoredAttachments().filter((att) => att.customer_id === customerId)
  },

  addAttachment(att: Omit<CustomerAttachment, 'id' | 'uploaded_at'>): CustomerAttachment {
    const list = getStoredAttachments()
    const newAtt: CustomerAttachment = {
      ...att,
      id: `att-${Date.now()}`,
      uploaded_at: new Date().toISOString(),
    }
    saveStoredAttachments([newAtt, ...list])
    return newAtt
  },

  /**
   * Tính toán tóm tắt trang 360:
   * - Tổng giá trị đã ký (Closed Won)
   * - Giá trị cơ hội đang mở (Open)
   */
  getCustomer360Summary(customerId: string) {
    const deals = this.getDeals(customerId)
    const wonValue = deals
      .filter((d) => d.status === 'CLOSED_WON')
      .reduce((sum, d) => sum + d.value, 0)
    const openValue = deals
      .filter((d) => d.status === 'OPEN')
      .reduce((sum, d) => sum + d.value, 0)

    const contacts = this.getContacts(customerId)
    const activities = this.getActivities(customerId)
    const attachments = this.getAttachments(customerId)
    const tickets = this.getTickets(customerId)
    const isAtRisk = this.isCustomerAtRisk(customerId)

    return {
      wonValue,
      openValue,
      totalDeals: deals.length,
      contactsCount: contacts.length,
      activitiesCount: activities.length,
      attachmentsCount: attachments.length,
      unresolvedTicketsCount: tickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length,
      isAtRisk,
    }
  },

  /* ──────────── User Story S3-04: Cảnh báo & Gộp khách hàng trùng ──────────── */
  /**
   * Phát hiện các nhóm khách hàng trùng theo MST, tên công ty gần giống hoặc website
   */
  detectDuplicates(): DuplicateCustomerGroup[] {
    const customers = getStoredCustomers()
    const groups: DuplicateCustomerGroup[] = []

    // 1. Trùng theo Mã số thuế
    const taxMap = new Map<string, CustomerEnterprise[]>()
    customers.forEach((c) => {
      if (c.tax_code && c.tax_code.trim()) {
        const t = c.tax_code.trim()
        const existing = taxMap.get(t) || []
        existing.push(c)
        taxMap.set(t, existing)
      }
    })
    taxMap.forEach((custs, tax) => {
      if (custs.length > 1) {
        groups.push({
          id: `dup-tax-${tax}`,
          match_reason: 'TAX_CODE',
          match_field_value: `MST: ${tax}`,
          customers: custs,
        })
      }
    })

    // 2. Trùng theo website
    const webMap = new Map<string, CustomerEnterprise[]>()
    customers.forEach((c) => {
      if (c.website && c.website.trim()) {
        const w = c.website.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
        const existing = webMap.get(w) || []
        existing.push(c)
        webMap.set(w, existing)
      }
    })
    webMap.forEach((custs, web) => {
      if (custs.length > 1) {
        // Chỉ thêm nếu chưa trùng trong nhóm tax
        const existingId = `dup-tax-${custs[0].tax_code}`
        if (!groups.some((g) => g.id === existingId)) {
          groups.push({
            id: `dup-web-${web}`,
            match_reason: 'WEBSITE',
            match_field_value: `Website: ${web}`,
            customers: custs,
          })
        }
      }
    })

    return groups
  },

  /**
   * AC S3-04: Gộp 2 khách hàng trùng. Giữ lại toàn bộ người liên hệ, cơ hội và hoạt động.
   * Chỉ Trưởng nhóm trở lên (MANAGER, ADMIN) được thực hiện gộp.
   */
  mergeCustomers(primaryId: string, duplicateId: string, role?: string): CustomerEnterprise {
    if (role !== 'ADMIN' && role !== 'MANAGER') {
      throw new Error('Chỉ Trưởng nhóm kinh doanh hoặc Quản trị viên mới có quyền gộp khách hàng!')
    }

    const customers = getStoredCustomers()
    const primary = customers.find((c) => c.id === primaryId)
    const duplicate = customers.find((c) => c.id === duplicateId)
    if (!primary || !duplicate) {
      throw new Error('Không tìm thấy bản ghi khách hàng cần gộp!')
    }

    // 1. Chuyển toàn bộ contacts của duplicate sang primary
    const contacts = getStoredContacts()
    contacts.forEach((ct) => {
      if (ct.customer_id === duplicateId) {
        ct.customer_id = primaryId
        ct.customer_name = primary.name
      }
    })
    saveStoredContacts(contacts)

    // 2. Chuyển toàn bộ deals của duplicate sang primary
    const deals = getStoredDeals()
    deals.forEach((d) => {
      if (d.customer_id === duplicateId) {
        d.customer_id = primaryId
      }
    })
    saveStoredDeals(deals)

    // 3. Chuyển toàn bộ activities sang primary
    const activities = getStoredActivities()
    activities.forEach((a) => {
      if (a.customer_id === duplicateId) {
        a.customer_id = primaryId
      }
    })
    // Thêm activity ghi nhận việc gộp bản ghi
    activities.push({
      id: `act-merge-${Date.now()}`,
      customer_id: primaryId,
      type: 'NOTE',
      title: `Gộp dữ liệu khách hàng từ "${duplicate.name}" (${duplicate.code})`,
      description: `Đã hoàn tất gom toàn bộ liên hệ, cơ hội và lịch sử hoạt động vào hồ sơ chính.`,
      performed_by_name: 'Hệ thống CRM',
      performed_at: new Date().toISOString(),
    })
    saveStoredActivities(activities)

    // 4. Xóa bản ghi duplicate
    const updatedCustomers = customers.filter((c) => c.id !== duplicateId)
    saveStoredCustomers(updatedCustomers)

    return primary
  },

  /* ──────────── User Story S3-05: Quan hệ công ty mẹ - con ──────────── */
  getParentChildRelations(): ParentChildRelation[] {
    return getStoredRelations()
  },

  /**
   * Lấy quan hệ công ty mẹ của một công ty con (nếu có)
   */
  getParentRelation(childId: string): ParentChildRelation | undefined {
    return getStoredRelations().find((r) => r.child_id === childId)
  },

  /**
   * Kiểm tra xem potentialAncestorId có nằm trong nhánh tổ tiên của targetId hay không (tránh lặp vòng)
   */
  isDescendant(targetId: string, potentialAncestorId: string): boolean {
    const relations = getStoredRelations()
    const queue = relations.filter((r) => r.parent_id === potentialAncestorId).map((r) => r.child_id)
    const visited = new Set<string>()
    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === targetId) return true
      if (!visited.has(current)) {
        visited.add(current)
        const nextChildren = relations.filter((r) => r.parent_id === current).map((r) => r.child_id)
        queue.push(...nextChildren)
      }
    }
    return false
  },

  /**
   * Danh sách công ty có thể làm mẹ cho customerId (loại trừ chính nó và các cty con thuộc nhánh)
   */
  getAvailableParentCompanies(currentCustomerId?: string): CustomerEnterprise[] {
    const all = getStoredCustomers()
    if (!currentCustomerId) return all
    return all.filter((c) => c.id !== currentCustomerId && !this.isDescendant(c.id, currentCustomerId))
  },

  setParentCompany(childId: string, parentId: string): ParentChildRelation {
    if (childId === parentId) throw new Error('Một công ty không thể tự làm công ty mẹ của chính nó!')
    const customers = getStoredCustomers()
    const parent = customers.find((c) => c.id === parentId)
    const child = customers.find((c) => c.id === childId)
    if (!parent || !child) throw new Error('Không tìm thấy thông tin công ty mẹ hoặc con!')

    // Chống lặp vòng phân cấp cha con
    if (this.isDescendant(parentId, childId)) {
      throw new Error(`Không thể chọn "${parent.name}" làm công ty mẹ vì công ty này đang trực thuộc nhánh của "${child.name}"!`)
    }

    const relations = getStoredRelations().filter((r) => r.child_id !== childId)
    const newRel: ParentChildRelation = {
      parent_id: parentId,
      child_id: childId,
      parent_name: parent.name,
      child_name: child.name,
      established_at: new Date().toISOString(),
    }
    relations.push(newRel)
    saveStoredRelations(relations)

    // Cập nhật trường parent_id trong customer
    const cIndex = customers.findIndex((c) => c.id === childId)
    if (cIndex !== -1) {
      customers[cIndex].parent_id = parentId
      saveStoredCustomers(customers)
    }

    return newRel
  },

  removeParentCompany(childId: string): void {
    const relations = getStoredRelations().filter((r) => r.child_id !== childId)
    saveStoredRelations(relations)

    const customers = getStoredCustomers()
    const cIndex = customers.findIndex((c) => c.id === childId)
    if (cIndex !== -1) {
      delete customers[cIndex].parent_id
      saveStoredCustomers(customers)
    }
  },

  /**
   * AC S3-05: Trang công ty mẹ hiển thị tổng giá trị hợp đồng của cả nhóm công ty (mẹ + các cty con)
   */
  getGroupContractTotal(parentId: string): {
    totalValue: number
    parentWonValue: number
    childrenCount: number
    children: CustomerEnterprise[]
    childrenBreakdown: Array<{
      customer: CustomerEnterprise
      wonValue: number
      dealsCount: number
    }>
  } {
    const relations = getStoredRelations()
    const childIds = relations.filter((r) => r.parent_id === parentId).map((r) => r.child_id)
    const customers = getStoredCustomers()
    const children = customers.filter((c) => childIds.includes(c.id))
    const deals = getStoredDeals()

    const parentDeals = deals.filter((d) => d.customer_id === parentId && d.status === 'CLOSED_WON')
    const parentWonValue = parentDeals.reduce((sum, d) => sum + d.value, 0)

    const childrenBreakdown = children.map((c) => {
      const cDeals = deals.filter((d) => d.customer_id === c.id && d.status === 'CLOSED_WON')
      return {
        customer: c,
        wonValue: cDeals.reduce((sum, d) => sum + d.value, 0),
        dealsCount: cDeals.length,
      }
    })

    const childrenTotalWon = childrenBreakdown.reduce((sum, item) => sum + item.wonValue, 0)
    const totalValue = parentWonValue + childrenTotalWon

    return {
      totalValue,
      parentWonValue,
      childrenCount: children.length,
      children,
      childrenBreakdown,
    }
  },

  /* ──────────── User Story S3-08: Yêu cầu hỗ trợ sau bán & Cờ rủi ro rời bỏ ──────────── */
  getTickets(customerId?: string): SupportTicket[] {
    const list = getStoredTickets()
    if (customerId) return list.filter((t) => t.customer_id === customerId)
    return list
  },

  createTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>): SupportTicket {
    const list = getStoredTickets()
    const now = new Date().toISOString()
    const newT: SupportTicket = {
      ...ticket,
      id: `tick-${Date.now()}`,
      created_at: now,
      updated_at: now,
    }
    saveStoredTickets([newT, ...list])
    return newT
  },

  updateTicketStatus(ticketId: string, status: SupportTicket['status']): SupportTicket {
    const list = getStoredTickets()
    const idx = list.findIndex((t) => t.id === ticketId)
    if (idx === -1) throw new Error('Không tìm thấy yêu cầu hỗ trợ!')
    list[idx] = {
      ...list[idx],
      status,
      updated_at: new Date().toISOString(),
    }
    saveStoredTickets(list)
    return list[idx]
  },

  /**
   * AC S3-08: Khách có nhiều yêu cầu chưa xử lý (>= 2 yêu cầu NEW hoặc IN_PROGRESS) được gắn cờ rủi ro tự động
   */
  isCustomerAtRisk(customerId: string): boolean {
    const tickets = this.getTickets(customerId)
    const unresolved = tickets.filter((t) => t.status === 'NEW' || t.status === 'IN_PROGRESS')
    return unresolved.length >= 2
  },

  /* ──────────── User Story S3-09: Khách hàng cần chăm sóc định kỳ ──────────── */
  /**
   * AC S3-09: Danh sách khách chưa có tương tác nào trong N ngày (N cấu hình được).
   * Sắp xếp theo giá trị hợp đồng giảm dần. Đánh dấu đã liên hệ ngay trên danh sách.
   */
  getPeriodicCareCustomers(daysThreshold: number = 30): PeriodicCareCustomer[] {
    const customers = getStoredCustomers()
    const activities = getStoredActivities()
    const deals = getStoredDeals()
    const now = new Date().getTime()

    const results: PeriodicCareCustomer[] = []

    customers.forEach((c) => {
      // Tìm tương tác gần nhất
      const custActs = activities.filter((a) => a.customer_id === c.id)
      let lastDate = c.created_at
      if (custActs.length > 0) {
        lastDate = custActs[0].performed_at
      }

      const diffDays = Math.max(0, Math.floor((now - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)))
      if (diffDays >= daysThreshold) {
        // Tính tổng giá trị hợp đồng đã ký
        const contractVal = deals
          .filter((d) => d.customer_id === c.id && d.status === 'CLOSED_WON')
          .reduce((sum, d) => sum + d.value, 0)

        results.push({
          customer: c,
          last_interaction_date: lastDate,
          days_without_interaction: diffDays,
          contract_value: contractVal,
          is_contacted_today: false,
        })
      }
    })

    // Sắp xếp theo giá trị hợp đồng giảm dần
    return results.sort((a, b) => b.contract_value - a.contract_value)
  },
}

