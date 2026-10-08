// test_s4_03_campaign_lead.mjs - Verification script for S4-03 Campaign Lead Management
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

console.log('--- TESTING S4-03: CAMPAIGN LEAD MANAGEMENT FRONTEND ---')

// 1. Kiểm tra sự tồn tại của các file S4-03
const filesToCheck = [
  'src/types/campaign.ts',
  'src/services/campaignService.ts',
  'src/pages/CampaignsPage/CampaignsPage.tsx',
  'src/pages/CampaignsPage/CampaignsPage.css',
]

for (const file of filesToCheck) {
  const fullPath = path.resolve(process.cwd(), file)
  assert.ok(fs.existsSync(fullPath), `File must exist: ${file}`)
  const content = fs.readFileSync(fullPath, 'utf8')
  assert.ok(content.length > 100, `File must not be empty: ${file}`)
  console.log(`[PASS] File exists and non-empty: ${file}`)
}

// 2. Kiểm tra menuConfig có menu-campaigns
const menuConfigPath = path.resolve(process.cwd(), 'src/constants/menuConfig.ts')
const menuConfigContent = fs.readFileSync(menuConfigPath, 'utf8')
assert.ok(menuConfigContent.includes("'menu-campaigns'"), 'menuConfig must include menu-campaigns')
console.log('[PASS] menuConfig.ts contains menu-campaigns')

// 3. Kiểm tra Sidebar có icon và mapping menu-campaigns
const sidebarPath = path.resolve(process.cwd(), 'src/components/Sidebar/Sidebar.tsx')
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8')
assert.ok(sidebarContent.includes("'menu-campaigns'"), 'Sidebar.tsx must map menu-campaigns')
assert.ok(sidebarContent.includes('IconMegaphone'), 'Sidebar.tsx must define IconMegaphone')
console.log('[PASS] Sidebar.tsx maps menu-campaigns with IconMegaphone')

// 4. Kiểm tra App.tsx có route campaigns
const appPath = path.resolve(process.cwd(), 'src/App.tsx')
const appContent = fs.readFileSync(appPath, 'utf8')
assert.ok(appContent.includes('/dashboard/campaigns'), 'App.tsx must include /dashboard/campaigns route')
console.log('[PASS] App.tsx contains /dashboard/campaigns route')

// 5. Kiểm tra DashboardPage có isCampaignView và render CampaignsPage
const dashboardPagePath = path.resolve(process.cwd(), 'src/pages/DashboardPage/DashboardPage.tsx')
const dashboardPageContent = fs.readFileSync(dashboardPagePath, 'utf8')
assert.ok(dashboardPageContent.includes('CampaignsPage'), 'DashboardPage must import CampaignsPage')
assert.ok(dashboardPageContent.includes('isCampaignView'), 'DashboardPage must define isCampaignView')
assert.ok(dashboardPageContent.includes('<CampaignsPage />'), 'DashboardPage must render <CampaignsPage />')
console.log('[PASS] DashboardPage.tsx integrates CampaignsPage correctly')

// 6. Kiểm tra cấu trúc logic của Campaign Service
const campaignServicePath = path.resolve(process.cwd(), 'src/services/campaignService.ts')
const campaignServiceContent = fs.readFileSync(campaignServicePath, 'utf8')
assert.ok(campaignServiceContent.includes('getCampaigns'), 'campaignService must have getCampaigns')
assert.ok(campaignServiceContent.includes('createCampaign'), 'campaignService must have createCampaign')
assert.ok(campaignServiceContent.includes('updateCampaign'), 'campaignService must have updateCampaign')
assert.ok(campaignServiceContent.includes('deleteCampaign'), 'campaignService must have deleteCampaign')
assert.ok(campaignServiceContent.includes('getLeadsByCampaign'), 'campaignService must have getLeadsByCampaign')
assert.ok(campaignServiceContent.includes('getCampaignStats'), 'campaignService must have getCampaignStats')
assert.ok(campaignServiceContent.includes('exportCampaignLeadsToExcel'), 'campaignService must have exportCampaignLeadsToExcel')
console.log('[PASS] campaignService.ts has full CRUD, Stats, Leads drilldown, and Excel export')

console.log('--- ALL S4-03 LOGICAL CHECKS PASSED SUCCESSFULLY ---')
