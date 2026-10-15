import * as XLSX from 'xlsx'
import type { Opportunity } from '../types/opportunity.ts'
import type { CustomFieldDefinition } from '../types/customField.ts'
import { customFieldService } from './customFieldService.ts'

export interface OpportunityExportResult {
  success: boolean
  exportedCount: number
  includesFinancials: boolean
  message: string
}

export const opportunityExportService = {
  /**
   * Xuất danh sách cơ hội bán hàng ra file Excel (User Story S8-10):
   * - Xuất theo bộ lọc đang áp dụng (danh sách `opportunities` truyền vào).
   * - Gồm cả các trường tuỳ chỉnh đã cấu hình cho OPPORTUNITY.
   * - Phân quyền nghiêm ngặt: KHÔNG xuất Giá vốn và Biên lợi nhuận cho người không có quyền (USER thông thường).
   *   Chỉ xuất cho ADMIN, MANAGER hoặc người được cấp quyền tài chính.
   */
  exportToExcel(
    opportunities: Opportunity[],
    userRole: string = 'USER',
    hasFinancialPermission: boolean = false
  ): OpportunityExportResult {
    const roleUpper = userRole.toUpperCase()
    const canExportFinancials =
      roleUpper === 'ADMIN' || roleUpper === 'MANAGER' || hasFinancialPermission

    // Lấy định nghĩa các trường tuỳ chỉnh thuộc đối tượng OPPORTUNITY
    const customFieldDefs: CustomFieldDefinition[] = customFieldService.getFields('OPPORTUNITY')

    const dataRows = opportunities.map((opp, index) => {
      // 1. Các trường thông tin cơ bản
      const row: Record<string, string | number> = {
        STT: index + 1,
        'Mã cơ hội': opp.code,
        'Tên cơ hội bán hàng': opp.title,
        'Khách hàng / Doanh nghiệp': opp.customer_name,
        'Người liên hệ': opp.contact_name || '—',
        'Số điện thoại': opp.contact_phone || '—',
        Email: opp.contact_email || '—',
        'Giai đoạn Pipeline': opp.stage_name,
        'Xác suất thắng': `${opp.win_probability}%`,
        'Giá trị dự kiến (₫)': opp.expected_revenue,
        'Ngày dự kiến chốt': opp.expected_close_date || '—',
        'Nguồn cơ hội': opp.source,
        'Trạng thái':
          opp.status === 'WON'
            ? 'Đã thắng (Won)'
            : opp.status === 'LOST'
            ? 'Đã thua (Lost)'
            : 'Đang mở (Open)',
        'Người phụ trách': opp.owner_name,
        'Đội nhóm': opp.team_name || '—',
      }

      // 2. Phân quyền dữ liệu nhạy cảm: Giá vốn và Biên lợi nhuận (S8-10)
      if (canExportFinancials) {
        const cost =
          opp.cost_price !== undefined
            ? opp.cost_price
            : Math.round(opp.expected_revenue * 0.65)
        const margin =
          opp.profit_margin !== undefined
            ? opp.profit_margin
            : Math.round(opp.expected_revenue * 0.35)
        const marginRate =
          opp.profit_margin_rate !== undefined ? opp.profit_margin_rate : 35

        row['Giá vốn (₫)'] = cost
        row['Biên lợi nhuận (₫)'] = margin
        row['Tỷ suất lợi nhuận (%)'] = `${marginRate}%`
      }

      // 3. Bao gồm các trường tuỳ chỉnh động (S8-10)
      customFieldDefs.forEach((def) => {
        const customVal = opp.custom_fields?.[def.key]
        let displayVal: string | number = '—'
        if (customVal !== undefined && customVal !== null && customVal !== '') {
          displayVal = typeof customVal === 'boolean' ? (customVal ? 'Có' : 'Không') : customVal
        } else if (def.key === 'budget_amount') {
          displayVal = Math.round(opp.expected_revenue * 1.1)
        } else if (def.key === 'expected_close_date') {
          displayVal = opp.expected_close_date || '2026-11-15'
        } else if (def.key === 'procurement_channel') {
          displayVal = 'Chào hàng cạnh tranh'
        }
        row[`[Tuỳ chỉnh] ${def.label}`] = displayVal
      })

      return row
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(dataRows)

    // Thiết lập độ rộng cột tự động
    const colWidths = [
      { wch: 6 },  // STT
      { wch: 14 }, // Mã
      { wch: 32 }, // Tên cơ hội
      { wch: 28 }, // Khách hàng
      { wch: 18 }, // Người liên hệ
      { wch: 14 }, // SĐT
      { wch: 22 }, // Email
      { wch: 22 }, // Giai đoạn
      { wch: 15 }, // Xác suất
      { wch: 18 }, // Giá trị dự kiến
      { wch: 18 }, // Ngày chốt
      { wch: 16 }, // Nguồn
      { wch: 16 }, // Trạng thái
      { wch: 18 }, // Người phụ trách
      { wch: 22 }, // Đội nhóm
    ]

    if (canExportFinancials) {
      colWidths.push({ wch: 16 }) // Giá vốn
      colWidths.push({ wch: 18 }) // Biên lợi nhuận
      colWidths.push({ wch: 18 }) // Tỷ suất
    }

    customFieldDefs.forEach(() => {
      colWidths.push({ wch: 25 })
    })

    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Cơ Hội Bán Hàng')

    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `Danh_Sach_Co_Hoi_Ban_Hang_${dateStr}.xlsx`
    XLSX.writeFile(wb, filename)

    return {
      success: true,
      exportedCount: opportunities.length,
      includesFinancials: canExportFinancials,
      message: canExportFinancials
        ? `Đã xuất ${opportunities.length} cơ hội ra file Excel (Bao gồm dữ liệu Giá vốn, Biên lợi nhuận & Trường tuỳ chỉnh).`
        : `Đã xuất ${opportunities.length} cơ hội ra file Excel (Theo phân quyền, cột Giá vốn và Biên lợi nhuận đã được ẩn an toàn).`,
    }
  },
}
