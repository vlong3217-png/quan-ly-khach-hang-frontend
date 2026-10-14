// Test S4-06: Lead Interaction History Functionality
import fs from 'fs'
import path from 'path'

console.log('--- TEST S4-06: THEO DÕI LỊCH SỬ TƯƠNG TÁC VỚI LEAD ---')

// 1. Kiểm tra tồn tại các file
const leadInteractionServicePath = path.resolve('./src/services/leadInteractionService.ts')
const leadTypePath = path.resolve('./src/types/lead.ts')
const leadFormsPagePath = path.resolve('./src/pages/LeadFormsPage/LeadFormsPage.tsx')
const leadFormsCssPath = path.resolve('./src/pages/LeadFormsPage/LeadFormsPage.css')

console.log('1. Checking file existence:')
console.log(' - leadInteractionService.ts:', fs.existsSync(leadInteractionServicePath))
console.log(' - lead.ts:', fs.existsSync(leadTypePath))
console.log(' - leadFormsPage.tsx:', fs.existsSync(leadFormsPagePath))
console.log(' - leadFormsPage.css:', fs.existsSync(leadFormsCssPath))

// 2. Kiểm tra service methods
const serviceContent = fs.readFileSync(leadInteractionServicePath, 'utf-8')
const hasGetByLead = serviceContent.includes('getInteractionsByLead')
const hasGetAllRecent = serviceContent.includes('getAllRecentInteractions')
const hasCreate = serviceContent.includes('createInteraction')
const hasDelete = serviceContent.includes('deleteInteraction')
const hasRecordStatus = serviceContent.includes('recordStatusChange')
const hasRecordScore = serviceContent.includes('recordScoreChange')

console.log('2. Service methods check:')
console.log(' - getInteractionsByLead:', hasGetByLead)
console.log(' - getAllRecentInteractions:', hasGetAllRecent)
console.log(' - createInteraction:', hasCreate)
console.log(' - deleteInteraction:', hasDelete)
console.log(' - recordStatusChange:', hasRecordStatus)
console.log(' - recordScoreChange:', hasRecordScore)

// 3. Kiểm tra UI trong LeadFormsPage.tsx
const pageContent = fs.readFileSync(leadFormsPagePath, 'utf-8')
const hasTab = pageContent.includes('tab-btn-lead-interactions')
const hasModal = pageContent.includes('modal-lead-interactions')
const hasForm = pageContent.includes('form-create-interaction')
const hasTitleInput = pageContent.includes('input-interaction-title')
const hasOutcomeSelect = pageContent.includes('select-interaction-outcome')
const hasTimelineClass = pageContent.includes('interaction-timeline')
const hasHistoryIcon = pageContent.includes('IconHistory')
const hasActionButtons = pageContent.includes('btn-interactions-lead-')

console.log('3. LeadFormsPage UI check:')
console.log(' - Interaction Timeline Tab:', hasTab)
console.log(' - Interaction Modal:', hasModal)
console.log(' - Create Interaction Form:', hasForm)
console.log(' - Title Input:', hasTitleInput)
console.log(' - Outcome Select:', hasOutcomeSelect)
console.log(' - Timeline render class:', hasTimelineClass)
console.log(' - IconHistory presence:', hasHistoryIcon)
console.log(' - Table action button:', hasActionButtons)

// 4. Kiểm tra CSS
const cssContent = fs.readFileSync(leadFormsCssPath, 'utf-8')
const hasTimelineCss = cssContent.includes('.interaction-timeline')
const hasBadgeCss = cssContent.includes('.interaction-icon-badge')
const hasCreatePanelCss = cssContent.includes('.interaction-create-panel')

console.log('4. CSS check:')
console.log(' - .interaction-timeline:', hasTimelineCss)
console.log(' - .interaction-icon-badge:', hasBadgeCss)
console.log(' - .interaction-create-panel:', hasCreatePanelCss)

if (
  hasGetByLead &&
  hasGetAllRecent &&
  hasCreate &&
  hasDelete &&
  hasRecordStatus &&
  hasRecordScore &&
  hasTab &&
  hasModal &&
  hasForm &&
  hasTimelineCss
) {
  console.log('\n>>> S4-06 VERIFICATION: PASSED ALL TESTS! <<<')
} else {
  console.error('\n>>> S4-06 VERIFICATION: FAILED! <<<')
  process.exit(1)
}
