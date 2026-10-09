// Test script for Sprint 5 - Story S5-03: Ghi nhận hoạt động và lịch sử tương tác của cơ hội
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

console.log('--- TEST S5-03: OPPORTUNITY ACTIVITY & TIMELINE ---')

// 1. Kiểm tra tồn tại các file chính
const requiredFiles = [
  'src/types/opportunity.ts',
  'src/services/opportunityActivityService.ts',
  'src/components/OpportunityActivityTimeline/OpportunityActivityTimeline.tsx',
  'src/components/OpportunityActivityTimeline/OpportunityActivityTimeline.css',
  'src/components/OpportunityDetailModal/OpportunityDetailModal.tsx',
  'src/components/OpportunityDetailModal/OpportunityDetailModal.css',
  'src/pages/OpportunitiesPage/OpportunitiesPage.tsx',
  'src/pages/OpportunitiesPage/OpportunitiesPage.css',
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
  'OpportunityActivity',
  'OpportunityActivityType',
  'CreateOpportunityActivityPayload',
]

for (const t of requiredTypes) {
  if (typesContent.includes(t)) {
    console.log(`✅ Type found: ${t}`)
  } else {
    console.error(`❌ Type missing: ${t}`)
    allPassed = false
  }
}

// 3. Kiểm tra opportunityActivityService methods
const serviceContent = readFileSync(resolve('src/services/opportunityActivityService.ts'), 'utf-8')
const requiredServiceMethods = [
  'getActivities',
  'createActivity',
  'deleteActivity',
  'getActivityStats',
]

for (const m of requiredServiceMethods) {
  if (serviceContent.includes(m)) {
    console.log(`✅ Service method found: ${m}`)
  } else {
    console.error(`❌ Service method missing: ${m}`)
    allPassed = false
  }
}

// 4. Kiểm tra OpportunityActivityTimeline features
const timelineContent = readFileSync(resolve('src/components/OpportunityActivityTimeline/OpportunityActivityTimeline.tsx'), 'utf-8')
const requiredFeatures = [
  'timeline-stream',
  'log-activity-form',
  'filter-pill',
  'timeline-search-box',
  'empty-state',
  'loading-state',
  'STAGE_CHANGE',
  'next_action',
]

for (const feat of requiredFeatures) {
  if (timelineContent.includes(feat)) {
    console.log(`✅ Timeline feature found: ${feat}`)
  } else {
    console.error(`❌ Timeline feature missing: ${feat}`)
    allPassed = false
  }
}

if (!allPassed) {
  console.error('❌ SOME CHECKS FAILED')
  process.exit(1)
} else {
  console.log('🎉 ALL S5-03 CHECKS PASSED!')
}
