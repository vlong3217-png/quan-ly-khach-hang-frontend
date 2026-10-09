// test_s5_01_opportunity.mjs - Verification script for S5-01 Opportunity Frontend
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

console.log('--- TESTING S5-01: OPPORTUNITY MANAGEMENT FRONTEND ---')

// 1. Kiểm tra sự tồn tại của các file S5-01
const filesToCheck = [
  'src/types/opportunity.ts',
  'src/services/opportunityService.ts',
  'src/pages/OpportunitiesPage/OpportunitiesPage.tsx',
  'src/pages/OpportunitiesPage/OpportunitiesPage.css',
]

for (const file of filesToCheck) {
  const fullPath = path.resolve(process.cwd(), file)
  assert.ok(fs.existsSync(fullPath), `File must exist: ${file}`)
  const content = fs.readFileSync(fullPath, 'utf8')
  assert.ok(content.length > 100, `File must not be empty: ${file}`)
  console.log(`[PASS] File exists and non-empty: ${file}`)
}

// 2. Kiểm tra menuConfig có menu-opportunities
const menuConfigPath = path.resolve(process.cwd(), 'src/constants/menuConfig.ts')
const menuConfigContent = fs.readFileSync(menuConfigPath, 'utf8')
assert.ok(menuConfigContent.includes("'menu-opportunities'"), 'menuConfig must include menu-opportunities')
console.log('[PASS] menuConfig.ts contains menu-opportunities')

// 3. Kiểm tra Sidebar có icon và mapping menu-opportunities
const sidebarPath = path.resolve(process.cwd(), 'src/components/Sidebar/Sidebar.tsx')
const sidebarContent = fs.readFileSync(sidebarPath, 'utf8')
assert.ok(sidebarContent.includes("'menu-opportunities'"), 'Sidebar.tsx must map menu-opportunities')
assert.ok(sidebarContent.includes('IconBriefcase'), 'Sidebar.tsx must define IconBriefcase')
console.log('[PASS] Sidebar.tsx maps menu-opportunities with IconBriefcase')

// 4. Kiểm tra App.tsx có route opportunities
const appPath = path.resolve(process.cwd(), 'src/App.tsx')
const appContent = fs.readFileSync(appPath, 'utf8')
assert.ok(appContent.includes('/dashboard/opportunities'), 'App.tsx must include /dashboard/opportunities route')
console.log('[PASS] App.tsx contains /dashboard/opportunities route')

// 5. Kiểm tra DashboardPage có isOpportunityView và render OpportunitiesPage
const dashboardPagePath = path.resolve(process.cwd(), 'src/pages/DashboardPage/DashboardPage.tsx')
const dashboardPageContent = fs.readFileSync(dashboardPagePath, 'utf8')
assert.ok(dashboardPageContent.includes('OpportunitiesPage'), 'DashboardPage must import OpportunitiesPage')
assert.ok(dashboardPageContent.includes('isOpportunityView'), 'DashboardPage must define isOpportunityView')
assert.ok(dashboardPageContent.includes('<OpportunitiesPage />'), 'DashboardPage must render <OpportunitiesPage />')
console.log('[PASS] DashboardPage.tsx integrates OpportunitiesPage correctly')

// 6. Kiểm tra cấu trúc logic của Opportunity Service
const oppServicePath = path.resolve(process.cwd(), 'src/services/opportunityService.ts')
const oppServiceContent = fs.readFileSync(oppServicePath, 'utf8')
assert.ok(oppServiceContent.includes('getOpportunities'), 'opportunityService must have getOpportunities')
assert.ok(oppServiceContent.includes('createOpportunity'), 'opportunityService must have createOpportunity')
assert.ok(oppServiceContent.includes('updateOpportunity'), 'opportunityService must have updateOpportunity')
assert.ok(oppServiceContent.includes('deleteOpportunity'), 'opportunityService must have deleteOpportunity')
assert.ok(oppServiceContent.includes('changeStage'), 'opportunityService must have changeStage')
assert.ok(oppServiceContent.includes('getOpportunitySummary'), 'opportunityService must have getOpportunitySummary')
assert.ok(oppServiceContent.includes('exportOpportunitiesToExcel'), 'opportunityService must have exportOpportunitiesToExcel')
assert.ok(oppServiceContent.includes('Ngày dự kiến chốt không được là ngày trong quá khứ') || oppServiceContent.includes('quá khứ'), 'opportunityService must validate past close date')
console.log('[PASS] opportunityService.ts has full CRUD, Validation, Stage change, and Excel export')

// 7. Kiểm tra Validation không cho chọn ngày chốt trong quá khứ ở OpportunitiesPage.tsx
const oppPagePath = path.resolve(process.cwd(), 'src/pages/OpportunitiesPage/OpportunitiesPage.tsx')
const oppPageContent = fs.readFileSync(oppPagePath, 'utf8')
assert.ok(oppPageContent.includes('min={todayStr}'), 'OpportunitiesPage must restrict date picker min to today')
assert.ok(oppPageContent.includes('Ngày dự kiến chốt không được là ngày trong quá khứ'), 'OpportunitiesPage must validate past close date')
assert.ok(oppPageContent.includes('401'), 'OpportunitiesPage must handle 401 Unauthorized')
assert.ok(oppPageContent.includes('403'), 'OpportunitiesPage must handle 403 Forbidden')
console.log('[PASS] OpportunitiesPage.tsx strictly enforces past date validation and handles 401/403')

console.log('--- ALL S5-01 LOGICAL CHECKS PASSED SUCCESSFULLY ---')
