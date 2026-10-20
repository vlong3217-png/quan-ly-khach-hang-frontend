import type {
  CustomerEnterprise,
  CustomerFilterParams,
  CustomerStatus,
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
import { API_BASE_URL } from './authService.ts'
import type { PaginatedResponse, PaginationParams } from '../types/pagination.ts'

export const toBackendCustomerStatus = (status?: string): string => {
  if (!status) return 'PROSPECT'
  switch (status.toUpperCase()) {
    case 'POTENTIAL':
    case 'PROSPECT':
      return 'PROSPECT'
    case 'ACTIVE_CUSTOMER':
    case 'CUSTOMER':
      return 'CUSTOMER'
    case 'STOPPED':
    case 'DISCONTINUED':
      return 'DISCONTINUED'
    case 'IN_TRANSACTION':
      return 'IN_TRANSACTION'
    default:
      return status
  }
}

export const toFrontendCustomerStatus = (status?: string): CustomerStatus => {
  if (!status) return 'POTENTIAL'
  switch (status.toUpperCase()) {
    case 'PROSPECT':
    case 'POTENTIAL':
      return 'POTENTIAL'
    case 'CUSTOMER':
    case 'ACTIVE_CUSTOMER':
      return 'ACTIVE_CUSTOMER'
    case 'DISCONTINUED':
    case 'STOPPED':
      return 'STOPPED'
    case 'IN_TRANSACTION':
      return 'IN_TRANSACTION'
    default:
      return 'POTENTIAL'
  }
}

function extractErrorMessage(errData: any, status: number): string {
  if (errData?.detail) {
    if (typeof errData.detail === 'string') return errData.detail
    if (Array.isArray(errData.detail)) {
      return errData.detail.map((d: any) => `${d.loc ? d.loc.join('.') + ': ' : ''}${d.msg || d}`).join('; ')
    }
    return JSON.stringify(errData.detail)
  }
  return `Lỗi máy chủ (${status})`
}


const STORAGE_KEY = 'crm_enterprise_customers_data'

const INITIAL_CUSTOMERS: CustomerEnterprise[] = []

function getAuthToken(): string | null {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    localStorage.getItem('auth_token') ||
    sessionStorage.getItem('auth_token')
  )
}

function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token.trim()}`
  }
  return headers
}

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

const INITIAL_CONTACTS: CustomerContact[] = []

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
const INITIAL_DEALS: CustomerDeal[] = []

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
const INITIAL_ACTIVITIES: CustomerActivity[] = []

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
const INITIAL_ATTACHMENTS: CustomerAttachment[] = []

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
const INITIAL_TICKETS: SupportTicket[] = []

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
const INITIAL_RELATIONS: ParentChildRelation[] = []

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
   * Lấy danh sách khách hàng có hỗ trợ lọc, tìm kiếm và phân trang
   */
  getCustomers(params?: CustomerFilterParams & PaginationParams): CustomerEnterprise[] {
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

    if (params?.page && params?.limit) {
      const page = params.page
      const limit = params.limit
      const start = (page - 1) * limit
      return list.slice(start, start + limit)
    }

    return list
  },

  /**
   * Tải danh sách khách hàng từ Backend API và đồng bộ vào cache
   */
  async fetchCustomers(params?: CustomerFilterParams): Promise<CustomerEnterprise[]> {
    try {
      const query = new URLSearchParams()
      if (params?.search) query.set('search', params.search)
      if (params?.status) query.set('status', toBackendCustomerStatus(params.status))
      if (params?.industry) query.set('industry', params.industry)
      if (params?.company_size) query.set('company_size', params.company_size)
      if (params?.owner_id) query.set('owner_id', String(params.owner_id))
      query.set('limit', '100')

      const response = await fetch(`${API_BASE_URL}/customers?${query.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const raw = await response.json()
        const items = raw.customers || raw.items || (Array.isArray(raw) ? raw : [])
        if (Array.isArray(items)) {
          const mapped: CustomerEnterprise[] = items.map((item: any) => ({
            id: String(item.id),
            code: item.code || `KH-${String(item.id).padStart(3, '0')}`,
            name: item.name,
            tax_code: item.tax_code || undefined,
            industry: item.industry || '',
            company_size: item.company_size || '',
            website: item.website || undefined,
            address: item.address || undefined,
            phone: item.phone || undefined,
            email: item.email || undefined,
            owner_id: item.owner_id || 1,
            owner_name: item.owner_name || 'Admin',
            team_id: item.team_id || 1,
            team_name: item.team_name || 'Đội Kinh Doanh 1',
            status: toFrontendCustomerStatus(item.status),
            description: item.description || undefined,
            parent_id: item.parent_company_id ? String(item.parent_company_id) : undefined,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || item.created_at || new Date().toISOString(),
          }))
          saveStoredCustomers(mapped)
          return mapped
        }
      }
    } catch (err) {
      console.warn('Lỗi tải khách hàng từ API:', err)
    }
    return this.getCustomers(params)
  },

  /**
   * Lấy danh sách khách hàng dạng phân trang đồng bộ Backend API
   */
  async getPaginatedCustomers(params?: CustomerFilterParams & PaginationParams): Promise<PaginatedResponse<CustomerEnterprise>> {
    const page = params?.page || 1
    const limit = params?.limit || 10

    try {
      const query = new URLSearchParams()
      query.set('page', String(page))
      query.set('limit', String(limit))
      if (params?.search) query.set('search', params.search)
      if (params?.status) query.set('status', toBackendCustomerStatus(params.status))
      if (params?.industry) query.set('industry', params.industry)
      if (params?.company_size) query.set('company_size', params.company_size)
      if (params?.owner_id) query.set('owner_id', String(params.owner_id))

      const response = await fetch(`${API_BASE_URL}/customers?${query.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const raw = await response.json()
        const rawItems = raw.customers || raw.items || (Array.isArray(raw) ? raw : [])
        const mappedItems: CustomerEnterprise[] = rawItems.map((item: any) => ({
          id: String(item.id),
          code: item.code || `KH-${String(item.id).padStart(3, '0')}`,
          name: item.name,
          tax_code: item.tax_code || undefined,
          industry: item.industry || '',
          company_size: item.company_size || '',
          website: item.website || undefined,
          address: item.address || undefined,
          phone: item.phone || undefined,
          email: item.email || undefined,
          owner_id: item.owner_id || 1,
          owner_name: item.owner_name || 'Admin',
          team_id: item.team_id || 1,
          team_name: item.team_name || 'Đội Kinh Doanh 1',
          status: toFrontendCustomerStatus(item.status),
          description: item.description || undefined,
          parent_id: item.parent_company_id ? String(item.parent_company_id) : undefined,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || item.created_at || new Date().toISOString(),
        }))
        const total = raw.total !== undefined ? raw.total : mappedItems.length
        return {
          items: mappedItems,
          total,
          page,
          limit,
          total_pages: Math.max(1, Math.ceil(total / limit)),
        }
      }
    } catch {}

    const all = this.getCustomers({ ...params, page: undefined, limit: undefined })
    const start = (page - 1) * limit
    const items = all.slice(start, start + limit)
    return {
      items,
      total: all.length,
      page,
      limit,
      total_pages: Math.max(1, Math.ceil(all.length / limit)),
    }
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
   * Thêm mới khách hàng doanh nghiệp (Đồng bộ Backend API & MySQL)
   */
  async createCustomer(data: Omit<CustomerEnterprise, 'id' | 'code' | 'created_at' | 'updated_at'>): Promise<CustomerEnterprise> {
    const list = getStoredCustomers()

    // Kiểm tra tính duy nhất của mã số thuế nếu có
    if (data.tax_code && this.isTaxCodeDuplicate(data.tax_code)) {
      throw new Error(`Mã số thuế "${data.tax_code}" đã tồn tại trên hệ thống!`)
    }

    const payload = {
      name: data.name,
      tax_code: data.tax_code || null,
      industry: data.industry || null,
      company_size: data.company_size || null,
      website: data.website || null,
      address: data.address || null,
      status: toBackendCustomerStatus(data.status),
      parent_company_id: data.parent_id ? Number(data.parent_id) : null,
      email: data.email || null,
      phone: data.phone || null,
      owner_id: data.owner_id ? Number(data.owner_id) : null,
      team_id: data.team_id ? Number(data.team_id) : null,
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const item = await response.json()
        const newCustomer: CustomerEnterprise = {
          ...data,
          id: String(item.id),
          code: item.code || `KH-${String(item.id).padStart(3, '0')}`,
          status: toFrontendCustomerStatus(item.status || data.status),
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
        }
        const updated = [newCustomer, ...list]
        saveStoredCustomers(updated)
        return newCustomer
      } else {
        const errData = await response.json().catch(() => ({}))
        const errorMsg = extractErrorMessage(errData, response.status)
        throw new Error(errorMsg)
      }
    } catch (err: any) {
      if (err.message && !err.message.includes('fetch')) {
        throw err
      }
    }

    // Fallback nếu không gọi được API
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
   * Cập nhật thông tin khách hàng (Đồng bộ Backend API & MySQL)
   */
  async updateCustomer(id: string, data: Partial<Omit<CustomerEnterprise, 'id' | 'code' | 'created_at'>>): Promise<CustomerEnterprise> {
    const list = getStoredCustomers()
    const index = list.findIndex((c) => c.id === id)
    if (index === -1) {
      throw new Error('Không tìm thấy khách hàng cần cập nhật!')
    }

    if (data.tax_code && this.isTaxCodeDuplicate(data.tax_code, id)) {
      throw new Error(`Mã số thuế "${data.tax_code}" đã tồn tại trên một khách hàng khác!`)
    }

    const payload: Record<string, any> = {}
    if (data.name !== undefined) payload.name = data.name
    if (data.tax_code !== undefined) payload.tax_code = data.tax_code || null
    if (data.industry !== undefined) payload.industry = data.industry || null
    if (data.company_size !== undefined) payload.company_size = data.company_size || null
    if (data.website !== undefined) payload.website = data.website || null
    if (data.address !== undefined) payload.address = data.address || null
    if (data.status !== undefined) payload.status = toBackendCustomerStatus(data.status)
    if (data.parent_id !== undefined) payload.parent_company_id = data.parent_id ? Number(data.parent_id) : null
    if (data.email !== undefined) payload.email = data.email || null
    if (data.phone !== undefined) payload.phone = data.phone || null
    if (data.owner_id !== undefined) payload.owner_id = Number(data.owner_id)
    if (data.team_id !== undefined) payload.team_id = Number(data.team_id)

    const numId = Number(id)
    if (!isNaN(numId)) {
      try {
        const response = await fetch(`${API_BASE_URL}/customers/${numId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}))
          const errorMsg = extractErrorMessage(errData, response.status)
          throw new Error(errorMsg)
        }
      } catch (err: any) {
        if (err.message && !err.message.includes('fetch')) throw err
      }
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
   * Xóa khách hàng (Đồng bộ Backend API & MySQL)
   */
  async deleteCustomer(id: string): Promise<boolean> {
    const numId = Number(id)
    if (!isNaN(numId)) {
      try {
        await fetch(`${API_BASE_URL}/customers/${numId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
      } catch {}
    }

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
   * Tải danh sách người liên hệ từ API và đồng bộ cache
   */
  async fetchContacts(customerId?: string, search?: string): Promise<CustomerContact[]> {
    try {
      const query = new URLSearchParams()
      if (customerId && !isNaN(Number(customerId))) {
        query.set('customer_id', customerId)
      }
      query.set('limit', '100')

      const response = await fetch(`${API_BASE_URL}/contacts?${query.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const raw = await response.json()
        const items = Array.isArray(raw) ? raw : []
        if (items.length > 0) {
          const mapped: CustomerContact[] = items.map((c: any) => ({
            id: String(c.id),
            customer_id: String(c.customer_id),
            customer_name: c.customer_name || '',
            full_name: c.name,
            title: c.position || '',
            email: c.email || '',
            phone: c.phone || '',
            buying_role: c.decision_role || 'DECISION_MAKER',
            is_primary: Boolean(c.is_primary),
            notes: c.notes || '',
            created_at: c.created_at || new Date().toISOString(),
            updated_at: c.updated_at || new Date().toISOString(),
            history: (c.history || []).map((h: any) => ({
              from_customer_id: h.from_customer_id ? String(h.from_customer_id) : '',
              from_customer_name: '',
              to_customer_id: h.to_customer_id ? String(h.to_customer_id) : '',
              to_customer_name: '',
              transferred_at: h.timestamp || new Date().toISOString(),
              reason: h.note || '',
            })),
          }))
          saveStoredContacts(mapped)
          return this.getContacts(customerId, search)
        }
      }
    } catch {}
    return this.getContacts(customerId, search)
  },

  /**
   * Thêm người liên hệ mới (Đồng bộ Backend API & MySQL)
   */
  async createContact(data: Omit<CustomerContact, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerContact> {
    const list = getStoredContacts()
    const now = new Date().toISOString()

    if (data.is_primary) {
      list.forEach((c) => {
        if (c.customer_id === data.customer_id) {
          c.is_primary = false
        }
      })
    }

    const numCustomerId = Number(data.customer_id)
    if (!isNaN(numCustomerId)) {
      try {
        const payload = {
          customer_id: numCustomerId,
          name: data.full_name,
          phone: data.phone,
          email: data.email || null,
          position: data.title || null,
          decision_role: data.buying_role || 'DECISION_MAKER',
          is_primary: Boolean(data.is_primary),
          notes: data.notes || null,
        }
        const response = await fetch(`${API_BASE_URL}/contacts`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })
        if (response.ok) {
          const item = await response.json()
          const newContact: CustomerContact = {
            ...data,
            id: String(item.id),
            created_at: item.created_at || now,
            updated_at: item.updated_at || now,
          }
          const updated = [newContact, ...list]
          saveStoredContacts(updated)
          return newContact
        }
      } catch {}
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
   * Cập nhật người liên hệ (Đồng bộ Backend API & MySQL)
   */
  async updateContact(id: string, data: Partial<Omit<CustomerContact, 'id' | 'created_at'>>): Promise<CustomerContact> {
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

    const numId = Number(id)
    if (!isNaN(numId)) {
      try {
        const payload: Record<string, any> = {}
        if (data.full_name) payload.name = data.full_name
        if (data.phone) payload.phone = data.phone
        if (data.email !== undefined) payload.email = data.email
        if (data.title !== undefined) payload.position = data.title
        if (data.buying_role) payload.decision_role = data.buying_role
        if (data.is_primary !== undefined) payload.is_primary = Boolean(data.is_primary)
        if (data.notes !== undefined) payload.notes = data.notes

        await fetch(`${API_BASE_URL}/contacts/${numId}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        })
      } catch {}
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
   * Xóa người liên hệ (Đồng bộ Backend API & MySQL)
   */
  async deleteContact(id: string): Promise<boolean> {
    const numId = Number(id)
    if (!isNaN(numId)) {
      try {
        await fetch(`${API_BASE_URL}/contacts/${numId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
      } catch {}
    }

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

