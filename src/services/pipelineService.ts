import type { PipelineStage } from '../types/pipeline.ts'

const STORAGE_KEY = 'crm_pipeline_stages_data'

const INITIAL_STAGES: PipelineStage[] = [
  {
    id: 'stage-1',
    code: 'STG-CONTACT',
    name: 'Tiếp cận & Đánh giá',
    order: 1,
    win_probability: 10,
    required_conditions: ['Đã xác thực thông tin người liên hệ', 'Đã thực hiện ít nhất 1 cuộc gọi thành công'],
    color: '#64748b',
    description: 'Tìm hiểu sơ bộ và xác định đối tượng tiềm năng',
    active_opportunities_count: 8,
  },
  {
    id: 'stage-2',
    code: 'STG-QUALIFY',
    name: 'Xác định nhu cầu (BANT)',
    order: 2,
    win_probability: 25,
    required_conditions: ['Đã khảo sát nhu cầu cụ thể', 'Đã xác định ngân sách dự kiến'],
    color: '#0284c7',
    description: 'Xác định bài toán và ngân sách đầu tư',
    active_opportunities_count: 6,
  },
  {
    id: 'stage-3',
    code: 'STG-PROPOSE',
    name: 'Đề xuất giải pháp & Demo',
    order: 3,
    win_probability: 50,
    required_conditions: ['Phải có ít nhất một cuộc gặp trực tiếp hoặc Demo Online', 'Đã gửi tài liệu giải pháp'],
    color: '#2563eb',
    description: 'Thuyết trình sản phẩm và demo tính năng',
    active_opportunities_count: 5,
  },
  {
    id: 'stage-4',
    code: 'STG-QUOTE',
    name: 'Gửi báo giá chính thức',
    order: 4,
    win_probability: 70,
    required_conditions: ['Đã xuất báo giá từ bảng giá niêm yết', 'Giá bán không dưới giá sàn (hoặc đã được GĐKD duyệt)'],
    color: '#7c3aed',
    description: 'Gửi bảng chào giá và điều khoản thương mại',
    active_opportunities_count: 4,
  },
  {
    id: 'stage-5',
    code: 'STG-NEGOTIATE',
    name: 'Đàm phán hợp đồng',
    order: 5,
    win_probability: 85,
    required_conditions: ['Đã thống nhất dự thảo hợp đồng', 'Đã chốt tiến độ thanh toán và bàn giao'],
    color: '#d97706',
    description: 'Thương lượng điều khoản pháp lý và bảo lãnh',
    active_opportunities_count: 3,
  },
  {
    id: 'stage-6',
    code: 'STG-WON',
    name: 'Chốt thành công (Won)',
    order: 6,
    win_probability: 100,
    required_conditions: ['Đã ký hợp đồng pháp lý hai bên', 'Đã nhận tạm ứng hợp đồng'],
    is_closed_stage: true,
    color: '#16a34a',
    description: 'Chuyển sang bước bàn giao và triển khai',
    active_opportunities_count: 15,
  },
]

function getStored(): PipelineStage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STAGES))
  return INITIAL_STAGES
}

function saveStored(items: PipelineStage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export const pipelineService = {
  getStages(): PipelineStage[] {
    const list = getStored()
    return list.sort((a, b) => a.order - b.order)
  },

  createStage(data: Omit<PipelineStage, 'id' | 'order' | 'active_opportunities_count'>): PipelineStage {
    const list = getStored()
    const newStage: PipelineStage = {
      ...data,
      id: `stage-${Date.now()}`,
      order: list.length + 1,
      active_opportunities_count: 0,
    }
    list.push(newStage)
    saveStored(list)
    return newStage
  },

  updateStage(id: string, data: Partial<PipelineStage>): PipelineStage {
    const list = getStored()
    const idx = list.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('Không tìm thấy giai đoạn')
    list[idx] = { ...list[idx], ...data }
    saveStored(list)
    return list[idx]
  },

  deleteStage(id: string): { success: boolean; message?: string } {
    const list = getStored()
    const stage = list.find((s) => s.id === id)
    if (!stage) throw new Error('Không tìm thấy giai đoạn')
    // Tiêu chí chấp nhận S2-09: Thay đổi cấu hình không làm hỏng cơ hội đang chạy
    if ((stage.active_opportunities_count || 0) > 0) {
      throw new Error(
        `Giai đoạn "${stage.name}" đang có ${stage.active_opportunities_count} cơ hội đang chạy! Vui lòng chuyển các cơ hội sang giai đoạn khác trước khi xóa để không làm hỏng dữ liệu.`
      )
    }
    const filtered = list.filter((s) => s.id !== id)
    // Cập nhật lại số thứ tự
    filtered.forEach((item, index) => {
      item.order = index + 1
    })
    saveStored(filtered)
    return { success: true, message: 'Đã xóa giai đoạn thành công' }
  },

  reorder(fromIdx: number, toIdx: number): PipelineStage[] {
    const list = this.getStages()
    if (fromIdx < 0 || fromIdx >= list.length || toIdx < 0 || toIdx >= list.length) return list
    const [moved] = list.splice(fromIdx, 1)
    list.splice(toIdx, 0, moved)
    list.forEach((item, index) => {
      item.order = index + 1
    })
    saveStored(list)
    return list
  },
}
