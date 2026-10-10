import { API_BASE_URL } from './authService.ts'
import type {
  OpportunityTask,
  CreateOpportunityTaskPayload,
  UpdateOpportunityTaskPayload,
} from '../types/opportunity.ts'

const STORAGE_KEY = 'crm_opportunity_tasks_v1'

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
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

// Dữ liệu mẫu ban đầu cho công việc liên quan đến cơ hội bán hàng
const INITIAL_TASKS: OpportunityTask[] = [
  {
    id: 'opp-task-1',
    opportunity_id: 'opp-001',
    opportunity_title: 'Hợp đồng Nâng cấp CRM Toàn diện - AlphaTech',
    title: 'Soạn thảo bảng báo giá chính thức kèm chính sách chiết khấu năm',
    description: 'Áp dụng chính sách giảm 10% gói Enterprise 50 Users khi thanh toán 1 năm trả trước. Gửi bản PDF có chữ ký Giám đốc kinh doanh.',
    assigned_to_id: 1,
    assigned_to_name: 'Nguyễn Văn An',
    due_date: '2026-10-15',
    due_time: '17:00',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    reminder_type: '1_DAY_BEFORE',
    reminder_at: '2026-10-14T17:00:00Z',
    is_completed: false,
    created_at: '2026-10-05T14:30:00Z',
  },
  {
    id: 'opp-task-2',
    opportunity_id: 'opp-001',
    opportunity_title: 'Hợp đồng Nâng cấp CRM Toàn diện - AlphaTech',
    title: 'Đặt lịch họp trực tiếp chốt điều khoản hợp đồng tại trụ sở AlphaTech',
    description: 'Mời Trưởng phòng Kỹ thuật và Kế toán trưởng AlphaTech tham gia để thống nhất tiến độ nghiệm thu và đợt thanh toán.',
    assigned_to_id: 1,
    assigned_to_name: 'Nguyễn Văn An',
    due_date: '2026-10-20',
    due_time: '09:30',
    status: 'TODO',
    priority: 'URGENT',
    reminder_type: '1_HOUR_BEFORE',
    reminder_at: '2026-10-20T08:30:00Z',
    is_completed: false,
    created_at: '2026-10-06T10:00:00Z',
  },
  {
    id: 'opp-task-3',
    opportunity_id: 'opp-001',
    opportunity_title: 'Hợp đồng Nâng cấp CRM Toàn diện - AlphaTech',
    title: 'Gửi bản demo giải pháp và tài liệu API tích hợp',
    description: 'Đã gửi link tài liệu Swagger API và tài khoản demo staging cho đội IT khách hàng kiểm tra.',
    assigned_to_id: 1,
    assigned_to_name: 'Nguyễn Văn An',
    due_date: '2026-10-04',
    due_time: '18:00',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    reminder_type: 'ON_DUE',
    is_completed: true,
    completed_at: '2026-10-04T16:45:00Z',
    created_at: '2026-10-02T11:00:00Z',
  },
  {
    id: 'opp-task-4',
    opportunity_id: 'opp-002',
    opportunity_title: 'Gói Chuyển đổi số Quản trị Xây dựng - Hòa Bình Group',
    title: 'Thẩm định hồ sơ năng lực nhà thầu và phương án bảo mật dữ liệu',
    description: 'Soạn thảo phụ lục bảo mật thông tin NDA và kế hoạch sao lưu dữ liệu máy chủ đám mây.',
    assigned_to_id: 2,
    assigned_to_name: 'Trần Thị Bình',
    due_date: '2026-10-18',
    due_time: '16:00',
    status: 'TODO',
    priority: 'HIGH',
    reminder_type: '1_DAY_BEFORE',
    reminder_at: '2026-10-17T16:00:00Z',
    is_completed: false,
    created_at: '2026-10-07T16:00:00Z',
  },
]

function getStoredTasks(): OpportunityTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TASKS))
  return INITIAL_TASKS
}

function saveStoredTasks(tasks: OpportunityTask[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export const opportunityTaskService = {
  /**
   * Lấy danh sách công việc liên quan đến một cơ hội (hoặc tất cả nếu không truyền ID)
   */
  async getTasks(opportunityId?: string): Promise<OpportunityTask[]> {
    try {
      const url = opportunityId
        ? `${API_BASE_URL}/opportunities/${opportunityId}/tasks`
        : `${API_BASE_URL}/opportunity-tasks`
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          const all = getStoredTasks()
          if (opportunityId) {
            const others = all.filter((t) => t.opportunity_id !== opportunityId)
            saveStoredTasks([...data, ...others])
          } else {
            saveStoredTasks(data)
          }
          return data.sort(
            (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          )
        }
      }
    } catch {
      // Backend offline hoặc chưa có route -> fallback local
    }

    const list = getStoredTasks()
    const filtered = opportunityId
      ? list.filter((t) => t.opportunity_id === opportunityId)
      : list

    return filtered.sort((a, b) => {
      // Công việc chưa hoàn thành lên trước
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1
      }
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    })
  },

  /**
   * Lấy chi tiết một công việc theo ID
   */
  async getTaskById(id: string): Promise<OpportunityTask | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/opportunity-tasks/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) return data
      }
    } catch {}

    const list = getStoredTasks()
    return list.find((t) => t.id === id) || null
  },

  /**
   * Tạo công việc mới liên quan đến cơ hội (S5-04)
   */
  async createTask(payload: CreateOpportunityTaskPayload): Promise<OpportunityTask> {
    const newTask: OpportunityTask = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      opportunity_id: payload.opportunity_id,
      title: payload.title.trim(),
      description: payload.description?.trim() || '',
      assigned_to_id: payload.assigned_to_id,
      assigned_to_name: payload.assigned_to_name || 'Người dùng',
      due_date: payload.due_date,
      due_time: payload.due_time || '17:00',
      status: 'TODO',
      priority: payload.priority || 'MEDIUM',
      reminder_type: payload.reminder_type || 'NONE',
      reminder_at: payload.reminder_at,
      is_completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/opportunities/${payload.opportunity_id}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newTask),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          const list = getStoredTasks()
          saveStoredTasks([data, ...list])
          return data
        }
      }
    } catch {}

    const list = getStoredTasks()
    const updated = [newTask, ...list]
    saveStoredTasks(updated)
    return newTask
  },

  /**
   * Cập nhật công việc (Sửa tiêu đề, hạn chót, người phụ trách, nhắc nhở...) (S5-04)
   */
  async updateTask(id: string, payload: UpdateOpportunityTaskPayload): Promise<OpportunityTask> {
    const list = getStoredTasks()
    const idx = list.findIndex((t) => t.id === id)
    if (idx === -1) {
      throw new Error('Không tìm thấy công việc!')
    }

    const updatedTask: OpportunityTask = {
      ...list[idx],
      ...payload,
      is_completed:
        payload.is_completed !== undefined
          ? payload.is_completed
          : payload.status === 'COMPLETED'
          ? true
          : list[idx].is_completed,
      completed_at:
        payload.is_completed || payload.status === 'COMPLETED'
          ? list[idx].completed_at || new Date().toISOString()
          : undefined,
      updated_at: new Date().toISOString(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/opportunity-tasks/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedTask),
      })
      if (response.ok) {
        const data = await response.json()
        if (data && data.id) {
          list[idx] = data
          saveStoredTasks(list)
          return data
        }
      }
    } catch {}

    list[idx] = updatedTask
    saveStoredTasks(list)
    return updatedTask
  },

  /**
   * Đánh dấu hoàn thành hoặc chưa hoàn thành (Toggle complete)
   */
  async toggleTaskComplete(id: string): Promise<OpportunityTask> {
    const list = getStoredTasks()
    const task = list.find((t) => t.id === id)
    if (!task) throw new Error('Không tìm thấy công việc!')

    const nextCompleted = !task.is_completed
    return this.updateTask(id, {
      is_completed: nextCompleted,
      status: nextCompleted ? 'COMPLETED' : 'TODO',
    })
  },

  /**
   * Xóa công việc
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/opportunity-tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
    } catch {}

    const list = getStoredTasks().filter((t) => t.id !== id)
    saveStoredTasks(list)
  },

  /**
   * Thống kê công việc
   */
  async getTaskStats(opportunityId?: string) {
    const tasks = await this.getTasks(opportunityId)
    const today = new Date().toISOString().split('T')[0]

    const completed = tasks.filter((t) => t.is_completed).length
    const pending = tasks.filter((t) => !t.is_completed).length
    const overdue = tasks.filter((t) => !t.is_completed && t.due_date < today).length

    return {
      total: tasks.length,
      completed,
      pending,
      overdue,
    }
  },

  /**
   * Chuyển giao toàn bộ công việc chưa hoàn thành của một cơ hội sang người mới (S5-08)
   */
  async reassignTasksForOpportunity(
    opportunityId: string,
    newOwnerId: number,
    newOwnerName: string
  ): Promise<number> {
    const list = getStoredTasks()
    let count = 0
    const updatedList = list.map((t) => {
      if (t.opportunity_id === opportunityId && !t.is_completed) {
        count++
        return {
          ...t,
          assigned_to_id: newOwnerId,
          assigned_to_name: newOwnerName,
          updated_at: new Date().toISOString(),
        }
      }
      return t
    })
    if (count > 0) {
      saveStoredTasks(updatedList)
    }
    return count
  },
}

