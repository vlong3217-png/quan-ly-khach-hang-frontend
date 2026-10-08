import type { CustomFieldDefinition, CustomFieldTarget } from '../types/customField.ts'

const STORAGE_KEY = 'crm_custom_fields_data'

const INITIAL_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'cf-cust-1',
    target: 'CUSTOMER',
    key: 'tax_code',
    label: 'Mã số thuế doanh nghiệp',
    type: 'TEXT',
    is_required: true,
    show_in_filter: true,
    show_in_export: true,
    created_at: '2025-01-10T08:00:00Z',
  },
  {
    id: 'cf-cust-2',
    target: 'CUSTOMER',
    key: 'zalo_phone',
    label: 'Số Zalo liên hệ trực tiếp',
    type: 'TEXT',
    is_required: false,
    show_in_filter: false,
    show_in_export: true,
    created_at: '2025-01-15T09:00:00Z',
  },
  {
    id: 'cf-cust-3',
    target: 'CUSTOMER',
    key: 'annual_revenue',
    label: 'Doanh thu năm trước (Tỷ VNĐ)',
    type: 'NUMBER',
    is_required: false,
    show_in_filter: true,
    show_in_export: true,
    created_at: '2025-02-01T10:00:00Z',
  },
  {
    id: 'cf-cust-4',
    target: 'CUSTOMER',
    key: 'customer_tier',
    label: 'Phân hạng khách hàng ưu tiên',
    type: 'SELECT',
    options: ['VIP Diamond', 'Gold', 'Silver', 'Tiềm năng'],
    is_required: false,
    show_in_filter: true,
    show_in_export: true,
    created_at: '2025-02-10T11:00:00Z',
  },
  {
    id: 'cf-opp-1',
    target: 'OPPORTUNITY',
    key: 'budget_amount',
    label: 'Ngân sách dự kiến của khách (VNĐ)',
    type: 'NUMBER',
    is_required: true,
    show_in_filter: true,
    show_in_export: true,
    created_at: '2025-02-15T14:00:00Z',
  },
  {
    id: 'cf-opp-2',
    target: 'OPPORTUNITY',
    key: 'expected_close_date',
    label: 'Ngày dự kiến chốt hợp đồng',
    type: 'DATE',
    is_required: true,
    show_in_filter: true,
    show_in_export: true,
    created_at: '2025-02-20T15:00:00Z',
  },
  {
    id: 'cf-opp-3',
    target: 'OPPORTUNITY',
    key: 'procurement_channel',
    label: 'Hình thức mua sắm / Đấu thầu',
    type: 'SELECT',
    options: ['Chỉ định thầu', 'Chào hàng cạnh tranh', 'Đấu thầu rộng rãi', 'Mua sắm trực tiếp'],
    is_required: false,
    show_in_filter: true,
    show_in_export: true,
    created_at: '2025-03-01T09:30:00Z',
  },
]

function getStored(): CustomFieldDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_FIELDS))
  return INITIAL_FIELDS
}

function saveStored(items: CustomFieldDefinition[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const customFieldService = {
  getFields(target?: CustomFieldTarget): CustomFieldDefinition[] {
    const list = getStored()
    if (target) return list.filter((f) => f.target === target)
    return list
  },

  createField(data: Omit<CustomFieldDefinition, 'id' | 'created_at'>): CustomFieldDefinition {
    const list = getStored()
    const exists = list.some((f) => f.target === data.target && f.key.toLowerCase() === data.key.toLowerCase())
    if (exists) {
      throw new Error(`Mã trường "${data.key}" đã tồn tại cho đối tượng này!`)
    }
    const newField: CustomFieldDefinition = {
      ...data,
      id: `cf-${Date.now()}`,
      created_at: new Date().toISOString(),
    }
    list.push(newField)
    saveStored(list)
    return newField
  },

  updateField(id: string, data: Partial<CustomFieldDefinition>): CustomFieldDefinition {
    const list = getStored()
    const idx = list.findIndex((f) => f.id === id)
    if (idx === -1) throw new Error('Không tìm thấy trường tuỳ chỉnh')
    list[idx] = { ...list[idx], ...data }
    saveStored(list)
    return list[idx]
  },

  deleteField(id: string): void {
    const list = getStored()
    const filtered = list.filter((f) => f.id !== id)
    saveStored(filtered)
  },
}
