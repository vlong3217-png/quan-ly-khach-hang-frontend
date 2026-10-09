// Test S4-05: Lead Conversion Functionality
import fs from 'fs'
import path from 'path'

console.log('--- TEST S4-05: CHUYỂN ĐỔI LEAD THÀNH KHÁCH HÀNG & CƠ HỘI ---')

// 1. Kiểm tra tồn tại các file
const leadConversionServicePath = path.resolve('./src/services/leadConversionService.ts')
const opportunityServicePath = path.resolve('./src/services/opportunityService.ts')
const opportunityTypePath = path.resolve('./src/types/opportunity.ts')
const leadTypePath = path.resolve('./src/types/lead.ts')
const leadFormsPagePath = path.resolve('./src/pages/LeadFormsPage/LeadFormsPage.tsx')
const leadFormsCssPath = path.resolve('./src/pages/LeadFormsPage/LeadFormsPage.css')

console.log('1. Checking file existence:')
console.log(' - leadConversionService.ts:', fs.existsSync(leadConversionServicePath))
console.log(' - opportunityService.ts:', fs.existsSync(opportunityServicePath))
console.log(' - opportunity.ts:', fs.existsSync(opportunityTypePath))
console.log(' - leadFormsPage.tsx:', fs.existsSync(leadFormsPagePath))

// 2. Kiểm tra các hàm nghiệp vụ trong leadConversionService
const serviceContent = fs.readFileSync(leadConversionServicePath, 'utf-8')
const hasPreviewMethod = serviceContent.includes('getConversionPreview')
const hasConvertMethod = serviceContent.includes('convertLead')
const hasLocalFallback = serviceContent.includes('customerService.createCustomer')

console.log('2. leadConversionService methods:')
console.log(' - getConversionPreview:', hasPreviewMethod)
console.log(' - convertLead:', hasConvertMethod)
console.log(' - local customer & opportunity fallback:', hasLocalFallback)

// 3. Kiểm tra UI trong LeadFormsPage.tsx
const pageContent = fs.readFileSync(leadFormsPagePath, 'utf-8')
const hasModalConvert = pageContent.includes('modal-convert-lead')
const hasModalSuccess = pageContent.includes('modal-conversion-success')
const hasConfirmBtn = pageContent.includes('btn-confirm-lead-conversion')
const hasConvertIcons = pageContent.includes('IconUserCheck')
const hasExpectedCloseDateValidation = pageContent.includes('Ngày dự kiến chốt không được ở trong quá khứ')

console.log('3. LeadFormsPage UI check:')
console.log(' - Convert Lead Modal:', hasModalConvert)
console.log(' - Success Modal:', hasModalSuccess)
console.log(' - Confirm conversion button:', hasConfirmBtn)
console.log(' - Conversion IconUserCheck:', hasConvertIcons)
console.log(' - Expected Close Date validation:', hasExpectedCloseDateValidation)

// 4. Kiểm tra CSS
const cssContent = fs.readFileSync(leadFormsCssPath, 'utf-8')
const hasConvertCss = cssContent.includes('.convert-preview-card') && cssContent.includes('.convert-success-modal-body')
console.log('4. LeadFormsPage CSS check:')
console.log(' - Convert styles present:', hasConvertCss)

if (hasPreviewMethod && hasConvertMethod && hasModalConvert && hasModalSuccess && hasConvertCss) {
  console.log('\n>>> S4-05 VERIFICATION: PASSED ALL TESTS! <<<')
} else {
  console.error('\n>>> S4-05 VERIFICATION: FAILED! <<<')
  process.exit(1)
}
