/**
 * Types cho User Story S2-09: Cấu hình các giai đoạn pipeline và xác suất thắng
 * - Khai báo chuỗi giai đoạn: Tiếp cận → Xác định nhu cầu → Đề xuất giải pháp → Báo giá → Đàm phán → Chốt
 * - Mỗi giai đoạn có xác suất thắng mặc định dùng để tính dự báo
 * - Khai báo điều kiện bắt buộc để rời một giai đoạn (VD: phải có ít nhất một cuộc gặp)
 * - Thay đổi cấu hình không làm hỏng cơ hội đang chạy
 */

export interface PipelineStage {
  id: string
  code: string
  name: string
  order: number
  win_probability: number // 0% - 100%
  required_conditions: string[] // Điều kiện bắt buộc để rời/chuyển giai đoạn
  is_closed_stage?: boolean // Giai đoạn đóng (Thắng / Thua)
  color?: string
  description?: string
  active_opportunities_count?: number // Số cơ hội đang chạy trong giai đoạn
}
