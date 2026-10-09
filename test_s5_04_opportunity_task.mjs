// Test script for Sprint 5 - Story S5-04: Quản lý công việc và lịch nhắc liên quan đến cơ hội
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

console.log('--- TEST S5-04: OPPORTUNITY TASKS & REMINDERS ---')

// 1. Kiểm tra tồn tại các file chính
const requiredFiles = [
  'src/types/opportunity.ts',
  'src/services/opportunityTaskService.ts',
  'src/components/OpportunityTaskManager/OpportunityTaskManager.tsx',
  'src/components/OpportunityTaskManager/OpportunityTaskManager.css',
  'src/components/OpportunityDetailModal/OpportunityDetailModal.tsx',
  'src/pages/OpportunitiesPage/OpportunitiesPage.tsx',
]

let allPassed = true

for (const f of requiredFiles) {
  const p = resolve(f)
  if (!existsSync(p)) {
    console.error(`❌ Missing file: ${f}`)
    allPassed = false
  } else {
    console.log(`✅ File exists: ${f}`)
  }
}

// 2. Kiểm tra type definitions
const typesContent = readFileSync(resolve('src/types/opportunity.ts'), 'utf-8')
const requiredTypes = [
  'OpportunityTask',
  'OpportunityTaskStatus',
  'OpportunityTaskPriority',
  'OpportunityReminderType',
  'CreateOpportunityTaskPayload',
  'UpdateOpportunityTaskPayload',
]

for (const t of requiredTypes) {
  if (typesContent.includes(t)) {
    console.log(`✅ Type found: ${t}`)
  } else {
    console.error(`❌ Type missing: ${t}`)
    allPassed = false
  }
}

// 3. Kiểm tra opportunityTaskService methods
const serviceContent = readFileSync(resolve('src/services/opportunityTaskService.ts'), 'utf-8')
const requiredServiceMethods = [
  'getTasks',
  'createTask',
  'updateTask',
  'toggleTaskComplete',
  'deleteTask',
  'getTaskStats',
]

for (const m of requiredServiceMethods) {
  if (serviceContent.includes(m)) {
    console.log(`✅ Service method found: ${m}`)
  } else {
    console.error(`❌ Service method missing: ${m}`)
    allPassed = false
  }
}

// 4. Kiểm tra OpportunityTaskManager UI features
const taskManagerContent = readFileSync(resolve('src/components/OpportunityTaskManager/OpportunityTaskManager.tsx'), 'utf-8')
const requiredFeatures = [
  'task-list-stream',
  'opp-task-modal',
  'task-search-input',
  'custom-checkbox-btn',
  'priority-badge',
  'reminder-badge',
  'overdue-badge',
  'task-kpi-summary',
]

for (const feat of requiredFeatures) {
  if (taskManagerContent.includes(feat)) {
    console.log(`✅ Task feature found: ${feat}`)
  } else {
    console.error(`❌ Task feature missing: ${feat}`)
    allPassed = false
  }
}

// 5. Kiểm tra tích hợp trong OpportunityDetailModal
const detailModalContent = readFileSync(resolve('src/components/OpportunityDetailModal/OpportunityDetailModal.tsx'), 'utf-8')
if (detailModalContent.includes('OpportunityTaskManager') && detailModalContent.includes("activeTab === 'TASKS'")) {
  console.log('✅ OpportunityDetailModal integrated OpportunityTaskManager successfully')
} else {
  console.error('❌ OpportunityTaskManager not integrated into OpportunityDetailModal')
  allPassed = false
}

if (!allPassed) {
  console.error('❌ SOME CHECKS FAILED')
  process.exit(1)
} else {
  console.log('🎉 ALL S5-04 CHECKS PASSED!')
}
