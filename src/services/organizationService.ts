import type { Region, DepartmentNode } from '../types/organization.ts'
import { getMockUsers } from './userService.ts'

const STORAGE_REGIONS_KEY = 'crm_regions_data_v2'
const STORAGE_DEPT_KEY = 'crm_organization_tree_data_v2'

const INITIAL_REGIONS: Region[] = [
  { id: 'reg-north', name: 'Miền Bắc', code: 'KV-MB', description: 'Trụ sở chính Hà Nội và các tỉnh phía Bắc' },
  { id: 'reg-south', name: 'Miền Nam', code: 'KV-MN', description: 'Chi nhánh TP. Hồ Chí Minh và miền Đông/Tây Nam Bộ' },
  { id: 'reg-central', name: 'Miền Trung', code: 'KV-MT', description: 'Chi nhánh Đà Nẵng và các tỉnh miền Trung' },
]

export const organizationService = {
  getRegions(): Region[] {
    try {
      localStorage.removeItem('crm_regions_data')
    } catch {}
    try {
      const raw = localStorage.getItem(STORAGE_REGIONS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    localStorage.setItem(STORAGE_REGIONS_KEY, JSON.stringify(INITIAL_REGIONS))
    return INITIAL_REGIONS
  },

  addRegion(region: Omit<Region, 'id'>): Region {
    const list = this.getRegions()
    const newReg: Region = { ...region, id: `reg-${Date.now()}` }
    list.push(newReg)
    localStorage.setItem(STORAGE_REGIONS_KEY, JSON.stringify(list))
    return newReg
  },

  /**
   * Lấy cây sơ đồ tổ chức phòng ban.
   * Nếu chưa có cây, tự động tạo cấu trúc từ các đội nhóm của người dùng hệ thống.
   */
  getDepartmentTree(): DepartmentNode[] {
    try {
      localStorage.removeItem('crm_organization_tree_data')
    } catch {}
    try {
      const raw = localStorage.getItem(STORAGE_DEPT_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Luôn cập nhật và liên kết thành viên thực tế theo user.team
          const users = getMockUsers()
          this.syncMembersFromUsers(parsed, users)
          return parsed
        }
      }
    } catch {}

    // Khởi tạo cây ban đầu theo các đội nhóm thực tế từ danh sách người dùng
    const users = getMockUsers()
    const tree = this.generateInitialTreeFromUsers(users)
    this.saveDepartmentTree(tree)
    return tree
  },

  saveDepartmentTree(tree: DepartmentNode[]): void {
    localStorage.setItem(STORAGE_DEPT_KEY, JSON.stringify(tree))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crm-org-updated'))
    }
  },

  flattenDepartments(nodes: DepartmentNode[]): DepartmentNode[] {
    const res: DepartmentNode[] = []
    const traverse = (list: DepartmentNode[]) => {
      for (const node of list) {
        res.push(node)
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      }
    }
    traverse(nodes)
    return res
  },

  /**
   * Sinh cây phòng ban mặc định liên kết với người dùng
   */
  generateInitialTreeFromUsers(users: ReturnType<typeof getMockUsers>): DepartmentNode[] {
    const rootLeader = users.find((u) => u.role === 'ADMIN' || u.role === 'MANAGER') || users[0]
    
    // Nhóm người dùng theo team
    const teamGroups = new Map<string, typeof users>()
    for (const u of users) {
      const tName = (u.team || 'Đội Kinh Doanh 1').trim()
      const arr = teamGroups.get(tName) || []
      arr.push(u)
      teamGroups.set(tName, arr)
    }

    if (!teamGroups.has('Đội Kinh Doanh 1')) {
      teamGroups.set('Đội Kinh Doanh 1', [])
    }
    if (!teamGroups.has('Đội Kinh Doanh 2')) {
      teamGroups.set('Đội Kinh Doanh 2', [])
    }

    const subDepartments: DepartmentNode[] = []
    let deptIdx = 1
    for (const [tName, memberList] of teamGroups.entries()) {
      const leader = memberList.find((m) => m.role === 'MANAGER') || memberList[0] || rootLeader
      subDepartments.push({
        id: `dept-${deptIdx}`,
        name: tName,
        code: `KD-0${deptIdx}`,
        parent_id: 'dept-root',
        leader_id: leader ? Number(leader.id) : 1,
        leader_name: leader ? leader.full_name : 'Trưởng nhóm',
        region_id: tName.includes('2') || tName.toLowerCase().includes('nam') ? 'reg-south' : 'reg-north',
        region_name: tName.includes('2') || tName.toLowerCase().includes('nam') ? 'Miền Nam' : 'Miền Bắc',
        description: `Đội ngũ kinh doanh phụ trách ${tName}`,
        children: [],
        members: memberList.map((m) => ({
          id: Number(m.id),
          name: m.full_name,
          email: m.email,
          role: m.role || 'STAFF',
        })),
      })
      deptIdx++
    }

    const rootNode: DepartmentNode = {
      id: 'dept-root',
      name: 'Khối Kinh Doanh & Tiếp Thị Toàn Quốc',
      code: 'KDO-HQ',
      parent_id: null,
      leader_id: rootLeader ? Number(rootLeader.id) : 1,
      leader_name: rootLeader ? rootLeader.full_name : 'Giám Đốc Kinh Doanh',
      region_id: 'reg-north',
      region_name: 'Miền Bắc',
      description: 'Khối điều hành toàn bộ hoạt động kinh doanh, chăm sóc khách hàng và tiếp thị.',
      children: subDepartments,
      members: rootLeader ? [{ id: Number(rootLeader.id), name: rootLeader.full_name, email: rootLeader.email, role: 'ADMIN' }] : [],
    }

    return [rootNode]
  },

  /**
   * Đồng bộ danh sách thành viên trong từng node với danh sách tài khoản người dùng
   */
  syncMembersFromUsers(nodes: DepartmentNode[], users: ReturnType<typeof getMockUsers>): void {
    const traverse = (list: DepartmentNode[]) => {
      for (const node of list) {
        // Lấy các user có team khớp với tên node này
        const matchingUsers = users.filter((u) => (u.team || 'Đội Kinh Doanh 1').trim().toLowerCase() === node.name.trim().toLowerCase())
        if (matchingUsers.length > 0) {
          node.members = matchingUsers.map((m) => ({
            id: Number(m.id),
            name: m.full_name,
            email: m.email,
            role: m.role || 'STAFF',
          }))
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children)
        }
      }
    }
    traverse(nodes)
  },

  /**
   * Lấy danh sách phẳng tất cả các đội nhóm thực tế (kèm ID và Tên) để nạp vào Select dropdown các tab
   */
  getAllTeams(): Array<{ id: number; name: string }> {
    const tree = this.getDepartmentTree()
    const flat = this.flattenDepartments(tree)
    const teamsMap = new Map<string, { id: number; name: string }>()

    flat.forEach((dept, idx) => {
      // Bỏ qua node khối gốc nếu có node con
      const cleanName = dept.name.trim()
      if (!teamsMap.has(cleanName)) {
        teamsMap.set(cleanName, {
          id: idx + 1,
          name: cleanName,
        })
      }
    })

    // Lấy thêm từ danh sách người dùng để đảm bảo không bị sót đội nào
    const users = getMockUsers()
    users.forEach((u) => {
      if (u.team && u.team.trim()) {
        const cleanName = u.team.trim()
        if (!teamsMap.has(cleanName)) {
          teamsMap.set(cleanName, {
            id: teamsMap.size + 1,
            name: cleanName,
          })
        }
      }
    })

    return Array.from(teamsMap.values())
  },

  addDepartment(parentId: string | null, data: Omit<DepartmentNode, 'id' | 'children' | 'members'>): DepartmentNode {
    const tree = this.getDepartmentTree()
    const newNode: DepartmentNode = {
      ...data,
      id: `dept-${Date.now()}`,
      children: [],
      members: [
        { id: data.leader_id, name: data.leader_name, email: 'lead@company.com', role: 'MANAGER' },
      ],
    }

    if (!parentId) {
      tree.push(newNode)
    } else {
      const findAndAdd = (list: DepartmentNode[]): boolean => {
        for (const item of list) {
          if (item.id === parentId) {
            item.children = item.children || []
            item.children.push(newNode)
            return true
          }
          if (item.children && findAndAdd(item.children)) return true
        }
        return false
      }
      findAndAdd(tree)
    }

    this.saveDepartmentTree(tree)
    return newNode
  },

  
  deleteDepartment(deptId: string): { success: boolean; message?: string } {
    const tree = this.getDepartmentTree()

    const findNode = (list: DepartmentNode[]): DepartmentNode | null => {
      for (const item of list) {
        if (item.id === deptId) return item
        if (item.children && item.children.length > 0) {
          const found = findNode(item.children)
          if (found) return found
        }
      }
      return null
    }

    const targetNode = findNode(tree)
    if (!targetNode) {
      return { success: false, message: 'Không tìm thấy phòng ban cần xóa!' }
    }

    if (targetNode.children && targetNode.children.length > 0) {
      return {
        success: false,
        message: 'Không thể xóa "' + targetNode.name + '" vì đang có ' + targetNode.children.length + ' nhánh con trực thuộc. Vui lòng chuyển hoặc xóa các nhánh con trước!',
      }
    }

    const removeFromList = (list: DepartmentNode[]): boolean => {
      const idx = list.findIndex((item) => item.id === deptId)
      if (idx !== -1) {
        list.splice(idx, 1)
        return true
      }
      for (const item of list) {
        if (item.children && item.children.length > 0) {
          if (removeFromList(item.children)) return true
        }
      }
      return false
    }

    removeFromList(tree)
    this.saveDepartmentTree(tree)
    return { success: true }
  },

  assignMemberToDepartment(deptId: string, member: { id: number; name: string; email: string; role: string }): void {
    const tree = this.getDepartmentTree()
    // Quy tắc AC: Mỗi nhân viên thuộc đúng một nhóm tại một thời điểm -> Xóa khỏi nhóm cũ
    const removeMember = (list: DepartmentNode[]) => {
      for (const item of list) {
        item.members = item.members.filter((m) => m.id !== member.id)
        if (item.children) removeMember(item.children)
      }
    }
    removeMember(tree)

    // Thêm vào nhóm mới
    const addToDept = (list: DepartmentNode[]): boolean => {
      for (const item of list) {
        if (item.id === deptId) {
          item.members.push(member)
          return true
        }
        if (item.children && addToDept(item.children)) return true
      }
      return false
    }
    addToDept(tree)
    this.saveDepartmentTree(tree)
  },
}
