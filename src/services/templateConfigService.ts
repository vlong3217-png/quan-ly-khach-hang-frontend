import type { CompanyTemplateConfig } from '../types/templateConfig.ts'

const STORAGE_KEY = 'company_pdf_template_config'

export const DEFAULT_TEMPLATE_CONFIG: CompanyTemplateConfig = {
  company_name: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ & GIẢI PHÁP DOANH NGHIỆP CRM-PRO',
  tax_id: '0109887766',
  address: 'Tầng 12, Tòa nhà Innovation Tower, Số 1 Phố Duy Tân, Cầu Giấy, Hà Nội',
  phone: '1900 6868 - (024) 3795 8888',
  email: 'contact@crmpro-solutions.vn',
  website: 'https://crmpro-solutions.vn',
  bank_name: 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank) - Chi nhánh Thăng Long',
  bank_account_number: '0011 0042 99999',
  bank_account_holder: 'CONG TY CP CONG NGHE VA GIAI PHAP CRM-PRO',
  logo_url: '', // Có thể để trống hoặc dùng SVG/base64
  primary_color: '#0284c7', // Sky-600
  quote_header_title: 'BẢNG BÁO GIÁ DỊCH VỤ & HÀNG HÓA',
  contract_header_title: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc\n---\nHỢP ĐỒNG KINH TẾ',
  default_quote_notes:
    '1. Báo giá có hiệu lực trong vòng 30 ngày kể từ ngày ban hành.\n2. Giá đã bao gồm thuế VAT và phí hỗ trợ triển khai kỹ thuật 12 tháng.\n3. Phương thức thanh toán: Chuyển khoản ngân hàng.',
  default_contract_terms:
    'Hai bên cam kết thực hiện đúng các điều khoản quy định trong hợp đồng. Hợp đồng được lập thành 02 bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản.',
  signatory_company_title: 'ĐẠI DIỆN BÊN BÁN\n(Ký, ghi rõ họ tên & đóng dấu)',
  signatory_customer_title: 'ĐẠI DIỆN BÊN MUA\n(Ký, ghi rõ họ tên & đóng dấu)',
  updated_at: new Date().toISOString(),
}

export const templateConfigService = {
  getConfig(): CompanyTemplateConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...DEFAULT_TEMPLATE_CONFIG, ...JSON.parse(stored) }
      }
    } catch {
      // Fallback on error
    }
    return DEFAULT_TEMPLATE_CONFIG
  },

  updateConfig(patch: Partial<CompanyTemplateConfig>): CompanyTemplateConfig {
    const current = this.getConfig()
    const updated: CompanyTemplateConfig = {
      ...current,
      ...patch,
      updated_at: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  },

  resetToDefault(): CompanyTemplateConfig {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATE_CONFIG))
    return DEFAULT_TEMPLATE_CONFIG
  },
}
