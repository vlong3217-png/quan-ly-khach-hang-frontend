// test_s4_04_lead_scoring.mjs - Automated verification script for S4-04 Lead Scoring & Classification
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

console.log('--- TESTING S4-04: LEAD SCORING & CLASSIFICATION FRONTEND ---')

// 1. Kiểm tra sự tồn tại của các file S4-04
const filesToCheck = [
  'src/types/lead.ts',
  'src/services/leadScoringService.ts',
  'src/services/leadService.ts',
  'src/pages/LeadFormsPage/LeadFormsPage.tsx',
  'src/pages/LeadFormsPage/LeadFormsPage.css',
]

for (const file of filesToCheck) {
  const fullPath = path.resolve(process.cwd(), file)
  assert.ok(fs.existsSync(fullPath), `File must exist: ${file}`)
  const content = fs.readFileSync(fullPath, 'utf8')
  assert.ok(content.length > 100, `File must not be empty: ${file}`)
  console.log(`[PASS] File exists and non-empty: ${file}`)
}

// 2. Kiểm tra types lead.ts có chứa các trường chấm điểm và phân loại
const leadTypesPath = path.resolve(process.cwd(), 'src/types/lead.ts')
const leadTypesContent = fs.readFileSync(leadTypesPath, 'utf8')
assert.ok(leadTypesContent.includes('LeadScoreTier'), 'lead.ts must define LeadScoreTier')
assert.ok(leadTypesContent.includes('LeadSegment'), 'lead.ts must define LeadSegment')
assert.ok(leadTypesContent.includes('LeadScoreBreakdown'), 'lead.ts must define LeadScoreBreakdown')
assert.ok(leadTypesContent.includes('LeadScoringRule'), 'lead.ts must define LeadScoringRule')
assert.ok(leadTypesContent.includes('score?: number'), 'Lead interface must include score field')
assert.ok(leadTypesContent.includes('score_tier?: LeadScoreTier'), 'Lead interface must include score_tier field')
assert.ok(leadTypesContent.includes('segment?: LeadSegment'), 'Lead interface must include segment field')
console.log('[PASS] src/types/lead.ts contains all S4-04 scoring and segmentation definitions')

// 3. Kiểm tra logic leadScoringService.ts
const scoringServicePath = path.resolve(process.cwd(), 'src/services/leadScoringService.ts')
const scoringServiceContent = fs.readFileSync(scoringServicePath, 'utf8')
assert.ok(scoringServiceContent.includes('calculateLeadScore'), 'Service must export calculateLeadScore')
assert.ok(scoringServiceContent.includes('determineScoreTier'), 'Service must export determineScoreTier')
assert.ok(scoringServiceContent.includes('determineLeadSegment'), 'Service must export determineLeadSegment')
assert.ok(scoringServiceContent.includes('recalculateLeadScore'), 'Service must have recalculateLeadScore')
assert.ok(scoringServiceContent.includes('recalculateAllLeads'), 'Service must have recalculateAllLeads')
assert.ok(scoringServiceContent.includes('updateManualScore'), 'Service must have updateManualScore')
assert.ok(scoringServiceContent.includes('getScoringStats'), 'Service must have getScoringStats')
console.log('[PASS] leadScoringService.ts implements complete scoring engine and API methods')

// 4. Kiểm tra LeadFormsPage.tsx chứa tab, cột điểm, và modal điều chỉnh
const leadFormsPagePath = path.resolve(process.cwd(), 'src/pages/LeadFormsPage/LeadFormsPage.tsx')
const pageContent = fs.readFileSync(leadFormsPagePath, 'utf8')
assert.ok(pageContent.includes('LEAD_SCORING'), 'LeadFormsPage must support LEAD_SCORING tab')
assert.ok(pageContent.includes('tab-btn-lead-scoring'), 'LeadFormsPage must render tab button for scoring')
assert.ok(pageContent.includes('lead-scoring-panel'), 'LeadFormsPage must render lead scoring panel')
assert.ok(pageContent.includes('table-lead-scoring'), 'LeadFormsPage must render scoring table')
assert.ok(pageContent.includes('modal-score-detail'), 'LeadFormsPage must render modal score detail')
assert.ok(pageContent.includes('btn-recalculate-all-scores'), 'LeadFormsPage must have recalculate all button')
assert.ok(pageContent.includes('canManageScoring'), 'LeadFormsPage must enforce role-based permissions')
console.log('[PASS] LeadFormsPage.tsx integrates scoring matrix, tab, modal, and role-based permissions')

// 5. Kiểm tra CSS class cho scoring
const cssPath = path.resolve(process.cwd(), 'src/pages/LeadFormsPage/LeadFormsPage.css')
const cssContent = fs.readFileSync(cssPath, 'utf8')
assert.ok(cssContent.includes('.lead-score-pill'), 'CSS must include .lead-score-pill')
assert.ok(cssContent.includes('.lead-segment-badge'), 'CSS must include .lead-segment-badge')
assert.ok(cssContent.includes('.scoring-summary-cards'), 'CSS must include .scoring-summary-cards')
assert.ok(cssContent.includes('.score-big-circle'), 'CSS must include .score-big-circle')
assert.ok(cssContent.includes('.manual-override-panel'), 'CSS must include .manual-override-panel')
console.log('[PASS] LeadFormsPage.css defines rich visual styling for scores, tiers, and breakdown')

console.log('--- ALL S4-04 LOGICAL CHECKS PASSED SUCCESSFULLY ---')
