import type { Region, DepartmentNode } from '../types/organization.ts'

const STORAGE_REGIONS_KEY = 'crm_regions_data'
const STORAGE_DEPT_KEY = 'crm_organization_tree_data'

const INITIAL_REGIONS: Region[] = [
  { id: 'reg-north', code: 'KV-MB', name: 'Khu vực Miền Bắc', description: 'Hà Nội và các tỉnh phía Bắc' },
  { id: 'reg-central', code: 'KV-MT', name: 'Khu vực Miền Trung', description: 'Đà Nẵng, Huế, Quảng Nam...' },
  { id: 'reg-south', code: 'KV-MN', name: 'Khu vực Miền Nam', description: 'TP. Hồ Chí Minh, Bình Dương, Đồng Nai...' },
]

const INITIAL_DEPARTMENTS: DepartmentNode[] = [
  {
    id: 'dept-root',
    name: 'Khối Kinh Doanh Toàn Quốc',
    code: 'KHOI-KD',
    parent_id: null,
    leader_id: 1,
    leader_name: 'Nguyễn Văn An (Giám đốc kinh doanh)',
    region_id: 'reg-north',
    region_name: 'Khu vực Miền Bắc',
    members: [
      { id: 1, name: 'Nguyễn Văn An', email: 'admin@company.com', role: 'ADMIN' },
    ],
    children: [
      {
        id: 'dept-north',
        name: 'Phòng Kinh Doanh Miền Bắc',
        code: 'PKD-MB',
        parent_id: 'dept-root',
        leader_id: 2,
        leader_name: 'Trần Thị Bình (Trưởng phòng)',
        region_id: 'reg-north',
        region_name: 'Khu vực Miền Bắc',
        members: [
          { id: 2, name: 'Trần Thị Bình', email: 'binh.tran@company.com', role: 'MANAGER' },
          { id: 3, name: 'Lê Hoàng Cường', email: 'cuong.le@company.com', role: 'STAFF' },
          { id: 5, name: 'Hoàng Thị Em', email: 'em.hoang@company.com', role: 'STAFF' },
        ],
        children: [
          {
            id: 'team-enterprise-mb',
            name: 'Đội Khách Hàng Doanh Nghiệp (B2B)',
            code: 'DKD-DN-MB',
            parent_id: 'dept-north',
            leader_id: 3,
            leader_name: 'Lê Hoàng Cường (Trưởng nhóm)',
            region_id: 'reg-north',
            region_name: 'Khu vực Miền Bắc',
            members: [
              { id: 3, name: 'Lê Hoàng Cường', email: 'cuong.le@company.com', role: 'STAFF' },
              { id: 5, name: 'Hoàng Thị Em', email: 'em.hoang@company.com', role: 'STAFF' },
            ],
            children: [],
          },
        ],
      },
      {
        id: 'dept-south',
        name: 'Phòng Kinh Doanh Miền Nam',
        code: 'PKD-MN',
        parent_id: 'dept-root',
        leader_id: 6,
        leader_name: 'Võ Đức Phúc (Trưởng phòng)',
        region_id: 'reg-south',
        region_name: 'Khu vực Miền Nam',
        members: [
          { id: 6, name: 'Võ Đức Phúc', email: 'phuc.vo@company.com', role: 'MANAGER' },
          { id: 7, name: 'Đặng Thùy Giang', email: 'giang.dang@company.com', role: 'STAFF' },
          { id: 8, name: 'Bùi Quốc Hùng', email: 'hung.bui@company.com', role: 'STAFF' },
        ],
        children: [],
      },
    ],
  },
]

export const organizationService = {
  getRegions(): Region[] {
    try {
      const raw = localStorage.getItem(STORAGE_REGIONS_KEY)
      if (raw) return JSON.parse(raw)
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

  getDepartmentTree(): DepartmentNode[] {
    try {
      const raw = localStorage.getItem(STORAGE_DEPT_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    localStorage.setItem(STORAGE_DEPT_KEY, JSON.stringify(INITIAL_DEPARTMENTS))
    return INITIAL_DEPARTMENTS
  },

  saveDepartmentTree(tree: DepartmentNode[]): void {
    localStorage.setItem(STORAGE_DEPT_KEY, JSON.stringify(tree))
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
