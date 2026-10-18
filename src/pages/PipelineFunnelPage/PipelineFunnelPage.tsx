import { useState, useMemo } from 'react'
import type {
  FunnelDateRange,
  FunnelFilterParams,
} from '../../types/pipelineAnalytics.ts'
import { pipelineAnalyticsService } from '../../services/pipelineAnalyticsService.ts'
import './PipelineFunnelPage.css'

export default function PipelineFunnelPage() {
  const [teamId, setTeamId] = useState<number | 'ALL'>('ALL')
  const [userId, setUserId] = useState<number | 'ALL'>('ALL')
  const [productId, setProductId] = useState<string | 'ALL'>('ALL')
  const [dateRange, setDateRange] = useState<FunnelDateRange>('THIS_MONTH')

  const filterParams: FunnelFilterParams = useMemo(
    () => ({
      team_id: teamId,
      user_id: userId,
      product_id: productId,
      date_range: dateRange,
    }),
    [teamId, userId, productId, dateRange]
  )

  const { stages, insights } = useMemo(
    () => pipelineAnalyticsService.getFunnelAnalytics(filterParams),
    [filterParams]
  )

  return (
    <div className="pipeline-funnel-page" id="pipeline-funnel-page">
      {/* Header */}
      <div className="funnel-header">
        <div>
          <h1>
            <span>Phễu bán hàng & Tỷ lệ chuyển đổi</span>
          </h1>
        </div>
      </div>

      {/* Filters Bar: Team, Sales Rep, Product, Date Range */}
      <div className="funnel-filters-bar" id="funnel-filters-bar">
        <div className="filter-item-group">
          <label>Đội nhóm kinh doanh:</label>
          <select
            className="filter-select"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          >
            <option value="ALL">Tất cả đội nhóm (Toàn khối)</option>
          </select>
        </div>

        <div className="filter-item-group">
          <label>Nhân viên phụ trách:</label>
          <select
            className="filter-select"
            value={userId}
            onChange={(e) => setUserId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          >
            <option value="ALL">Tất cả nhân viên</option>
          </select>
        </div>

        <div className="filter-item-group">
          <label>Dòng sản phẩm:</label>
          <select
            className="filter-select"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="ALL">Tất cả sản phẩm & dịch vụ</option>
          </select>
        </div>

        <div className="filter-item-group">
          <label>Khoảng thời gian:</label>
          <select
            className="filter-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as FunnelDateRange)}
          >
            <option value="THIS_MONTH">Tháng này (Tháng 10/2026)</option>
            <option value="LAST_MONTH">Tháng trước (Tháng 09/2026)</option>
            <option value="THIS_QUARTER">Quý này (Quý 4/2026)</option>
            <option value="YEAR_TO_DATE">Từ đầu năm đến nay (YTD 2026)</option>
          </select>
        </div>
      </div>

      {/* S8-05 AC: Điểm rơi rụng nhiều nhất & Điểm nghẽn tắc lâu nhất */}
      <div className="funnel-insights-grid">
        <div className="insight-card alert-drop" id="card-highest-drop-off">
          <span className="insight-label">
            <span>Giai đoạn rơi rụng nhiều nhất</span>
          </span>
          <span className="insight-value" style={{ color: '#dc2626' }}>
            {insights.highest_drop_off_stage.drop_off_rate}% rơi rụng
          </span>
          <span className="insight-desc">
            Tại khâu: <strong>{insights.highest_drop_off_stage.stage_name}</strong>
            <br />
            {insights.highest_drop_off_stage.explanation}
          </span>
        </div>

        <div className="insight-card alert-bottleneck" id="card-longest-bottleneck">
          <span className="insight-label">
            <span>Giai đoạn tắc lâu nhất (Điểm nghẽn)</span>
          </span>
          <span className="insight-value" style={{ color: '#d97706' }}>
            TB {insights.longest_bottleneck_stage.avg_days} ngày
          </span>
          <span className="insight-desc">
            Tại khâu: <strong>{insights.longest_bottleneck_stage.stage_name}</strong>
            <br />
            {insights.longest_bottleneck_stage.explanation}
          </span>
        </div>

        <div className="insight-card success-conv">
          <span className="insight-label">
            <span>Tỷ lệ chuyển đổi toàn phễu</span>
          </span>
          <span className="insight-value" style={{ color: '#15803d' }}>
            {insights.overall_conversion_rate}%
          </span>
          <span className="insight-desc">
            Tổng {insights.total_deals} cơ hội đầu vào ➔ Chốt thành công {stages[stages.length - 1].count} cơ hội.
          </span>
        </div>

        <div className="insight-card info-val">
          <span className="insight-label">
            <span>Tổng giá trị luân chuyển trong phễu</span>
          </span>
          <span className="insight-value" style={{ color: '#2563eb' }}>
            {insights.total_value.toLocaleString('vi-VN')} ₫
          </span>
          <span className="insight-desc">Tổng quy mô toàn bộ các cơ hội đang nằm trên các nấc phễu.</span>
        </div>
      </div>

      {/* Visual Pipeline Funnel Blueprint */}
      <div className="funnel-visual-card">
        <h3 className="funnel-card-title">
          <span>Sơ đồ dòng chảy phễu bán hàng (Pipeline Conversion Flow)</span>
        </h3>

        <div className="funnel-stages-visual" id="funnel-visual-flow">
          {stages.map((st, idx) => {
            return (
              <div key={st.stage_id} style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="funnel-stage-block">
                  <div className="stage-bar-visual-wrapper">
                    <div
                      className={`stage-bar-box ${st.is_highest_drop_off ? 'highest-drop' : ''} ${st.is_longest_bottleneck ? 'longest-bottleneck' : ''}`}
                    >
                      <div className="stage-info-col">
                        <div className="stage-name-text">
                          {st.stage_name}
                          {st.is_highest_drop_off && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: '0.7rem',
                                color: '#b91c1c',
                                background: '#fee2e2',
                                padding: '2px 8px',
                                borderRadius: 9999,
                                fontWeight: 700,
                              }}
                            >
                              Rơi rụng nhiều nhất ({st.drop_off_rate}%)
                            </span>
                          )}
                          {st.is_longest_bottleneck && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: '0.7rem',
                                color: '#b45309',
                                background: '#fef3c7',
                                padding: '2px 8px',
                                borderRadius: 9999,
                                fontWeight: 700,
                              }}
                            >
                              Tắc lâu nhất (TB {st.avg_days_in_stage} ngày)
                            </span>
                          )}
                        </div>
                        <div className="stage-metrics-sub">
                          <span>
                            Số lượng: <strong>{st.count} cơ hội</strong>
                          </span>
                          <span>•</span>
                          <span className="stage-days-badge">
                            ⏱ Thời gian ngâm TB: {st.avg_days_in_stage} ngày
                          </span>
                        </div>
                      </div>

                      <div className="stage-value-col">
                        <span className="stage-value-text">{st.value.toLocaleString('vi-VN')} ₫</span>
                        {idx < stages.length - 1 && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Chuyển tiếp: {st.conversion_rate_to_next}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Transition connector if not last */}
                {idx < stages.length - 1 && (
                  <div className="funnel-transition-indicator">
                    <span className="conv-rate-pill">
                      Chuyển sang giai đoạn sau: {st.conversion_rate_to_next}%
                    </span>
                    <span className="drop-rate-pill">
                      Rơi rụng / Thua: {st.drop_off_rate}% ({st.drop_off_count} deals)
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Detailed Funnel Table */}
      <div className="dashboard-panel" style={{ background: '#ffffff', borderRadius: 14, padding: 24, border: '1px solid #e2e8f0' }}>
        <h3 className="funnel-card-title" style={{ marginBottom: 16 }}>
          <span>Bảng phân tích chi tiết chỉ số chuyển đổi theo từng giai đoạn</span>
        </h3>

        <table className="funnel-table">
          <thead>
            <tr>
              <th>Giai đoạn Pipeline</th>
              <th style={{ width: 130, textAlign: 'right' }}>Số cơ hội</th>
              <th style={{ width: 190, textAlign: 'right' }}>Giá trị (₫)</th>
              <th style={{ width: 150, textAlign: 'right' }}>Tỷ lệ chuyển đổi</th>
              <th style={{ width: 150, textAlign: 'right' }}>Tỷ lệ rơi rụng</th>
              <th style={{ width: 160, textAlign: 'right' }}>Thời gian TB (ngày)</th>
              <th style={{ width: 220 }}>Đánh giá & Khuyến nghị</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((st) => (
              <tr key={st.stage_id}>
                <td>
                  <strong style={{ color: '#0f172a' }}>{st.stage_name}</strong>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{st.count}</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e293b' }}>
                  {st.value.toLocaleString('vi-VN')} ₫
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#15803d' }}>
                  {st.conversion_rate_to_next}%
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: st.is_highest_drop_off ? '#dc2626' : '#64748b' }}>
                  {st.drop_off_rate > 0 ? `${st.drop_off_rate}%` : '—'}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: st.is_longest_bottleneck ? '#d97706' : '#334155' }}>
                  {st.avg_days_in_stage} ngày
                </td>
                <td>
                  {st.is_highest_drop_off && (
                    <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: 600 }}>
                      Điểm rò rỉ cơ hội lớn nhất. Cần tối ưu chính sách chiết khấu.
                    </span>
                  )}
                  {st.is_longest_bottleneck && (
                    <span style={{ color: '#d97706', fontSize: '0.8rem', fontWeight: 600 }}>
                      Điểm nghẽn pháp lý. Cần chuẩn hóa mẫu hợp đồng rút gọn.
                    </span>
                  )}
                  {!st.is_highest_drop_off && !st.is_longest_bottleneck && (
                    <span style={{ color: '#16a34a', fontSize: '0.8rem' }}>
                      Vận hành ổn định trong định mức tiêu chuẩn.
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
