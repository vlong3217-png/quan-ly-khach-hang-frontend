const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

export default function LoginBrandPanel() {
  return (
    <section className="login-brand-panel" aria-label="Giới thiệu hệ thống quản lý khách hàng">
      <div className="login-brand">
        <img src="/favicon.svg" alt="" />
        <span>Quản lý khách hàng</span>
      </div>
      <div className="login-header">
        <span className="login-product-kicker">NỀN TẢNG CRM</span>
        <h2>Kết nối khách hàng. Phát triển kinh doanh.</h2>
        <p>Quản lý khách hàng, cơ hội và hoạt động chăm sóc trên cùng một hệ thống.</p>
      </div>

      <ul className="login-benefits">
        <li>
          <span className="login-benefit-check"><IconCheck /></span>
          Theo dõi khách hàng từ tiếp nhận đến chuyển đổi
        </li>
        <li>
          <span className="login-benefit-check"><IconCheck /></span>
          Quản lý cơ hội, lịch hẹn và công việc tập trung
        </li>
        <li>
          <span className="login-benefit-check"><IconCheck /></span>
          Nắm bắt hiệu quả chăm sóc và phân bổ của đội ngũ
        </li>
      </ul>

      <div className="crm-preview" aria-hidden="true">
        <div className="crm-preview-header">
          <div>
            <span className="crm-preview-eyebrow">TỔNG QUAN KHÁCH HÀNG</span>
            <strong>Pipeline chăm sóc</strong>
          </div>
          <span className="crm-preview-period">Minh họa</span>
        </div>
        <div className="crm-preview-stats">
          <div>
            <span>Khách hàng mới</span>
            <strong>128</strong>
          </div>
          <div>
            <span>Cơ hội đang mở</span>
            <strong>36</strong>
          </div>
        </div>
        <div className="crm-preview-pipeline">
          <div className="crm-pipeline-row">
            <span className="crm-pipeline-dot intake" />
            <span>Tiếp nhận</span>
            <div className="crm-pipeline-track"><i style={{ width: '82%' }} /></div>
            <strong>82%</strong>
          </div>
          <div className="crm-pipeline-row">
            <span className="crm-pipeline-dot care" />
            <span>Đang chăm sóc</span>
            <div className="crm-pipeline-track"><i style={{ width: '58%' }} /></div>
            <strong>58%</strong>
          </div>
          <div className="crm-pipeline-row">
            <span className="crm-pipeline-dot converted" />
            <span>Đã chuyển đổi</span>
            <div className="crm-pipeline-track"><i style={{ width: '34%' }} /></div>
            <strong>34%</strong>
          </div>
        </div>
      </div>
    </section>
  )
}