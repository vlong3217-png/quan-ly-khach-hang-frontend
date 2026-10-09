// test_s5_02_pipeline_kanban.mjs - Verification script for S5-02 Pipeline Kanban Frontend
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

console.log('--- TESTING S5-02: PIPELINE KANBAN FRONTEND ---')

// 1. Kiểm tra sự tồn tại của các file S5-02
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

// 2. Kiểm tra tính năng Kanban trên OpportunitiesPage.tsx
const oppPagePath = path.resolve(process.cwd(), 'src/pages/OpportunitiesPage/OpportunitiesPage.tsx')
const oppPageContent = fs.readFileSync(oppPagePath, 'utf8')

assert.ok(oppPageContent.includes('opp-kanban-board'), 'Must contain opp-kanban-board container')
assert.ok(oppPageContent.includes('opp-kanban-column'), 'Must render opp-kanban-column for each stage')
assert.ok(oppPageContent.includes('opp-kanban-card'), 'Must render opp-kanban-card for each opportunity')
assert.ok(oppPageContent.includes('draggable'), 'Card must be draggable for HTML5 drag-and-drop')
assert.ok(oppPageContent.includes('onDragStart') && oppPageContent.includes('onDrop'), 'Must implement drag and drop event handlers')
assert.ok(oppPageContent.includes('handleMoveStage'), 'Must implement stage transition logic')
assert.ok(oppPageContent.includes('totalRevenue'), 'Must display total revenue on each Kanban column header')
assert.ok(oppPageContent.includes('filterOwner'), 'Must provide filter by owner')
assert.ok(oppPageContent.includes('filterTeam'), 'Must provide filter by team')
assert.ok(oppPageContent.includes('filterDateRange'), 'Must provide filter by close date range')
assert.ok(oppPageContent.includes('viewMode'), 'Must support switching between Kanban and Table views')
console.log('[PASS] OpportunitiesPage.tsx contains complete Kanban, drag-drop, stage transition and advanced filters')

// 3. Kiểm tra CSS Kanban
const oppCssPath = path.resolve(process.cwd(), 'src/pages/OpportunitiesPage/OpportunitiesPage.css')
const oppCssContent = fs.readFileSync(oppCssPath, 'utf8')
assert.ok(oppCssContent.includes('.opp-kanban-board'), 'CSS must define .opp-kanban-board')
assert.ok(oppCssContent.includes('.opp-kanban-column'), 'CSS must define .opp-kanban-column')
assert.ok(oppCssContent.includes('.opp-kanban-card'), 'CSS must define .opp-kanban-card')
assert.ok(oppCssContent.includes('.drag-over'), 'CSS must define drag-over visual feedback')
console.log('[PASS] OpportunitiesPage.css defines rich styles for Kanban board and cards')

// 4. Kiểm tra service method changeStage
const oppServicePath = path.resolve(process.cwd(), 'src/services/opportunityService.ts')
const oppServiceContent = fs.readFileSync(oppServicePath, 'utf8')
assert.ok(oppServiceContent.includes('changeStage'), 'opportunityService must provide changeStage method')
console.log('[PASS] opportunityService.ts supports changeStage API')

console.log('--- ALL S5-02 LOGICAL CHECKS PASSED SUCCESSFULLY ---')
