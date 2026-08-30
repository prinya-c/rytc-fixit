// สถานะงานซ่อม 8 ขั้น ตามขั้นตอนปฏิบัติงานของศูนย์ซ่อมสร้างเพื่อชุมชน (Fix it Center)
export const STATUSES = [
  { code: 1, label: 'รับลงทะเบียน' },
  { code: 2, label: 'คัดแยก/ประเมิน' },
  { code: 3, label: 'ชะล้างดินโคลน' },
  { code: 4, label: 'กำลังซ่อม ณ ศูนย์ซ่อมรถจักรยานยนต์' },
  { code: 5, label: 'กำลังซ่อม ณ ศูนย์ซ่อมรถยนต์' },
  { code: 6, label: 'กำลังซ่อม ณ สถานีซ่อมและบำรุงรักษาเครื่องใช้ไฟฟ้า' },
  { code: 7, label: 'ตรวจสอบคุณภาพ' },
  { code: 8, label: 'ส่งมอบ' },
]

export function statusLabel(code) {
  return STATUSES.find((s) => s.code === code)?.label ?? `สถานะ ${code}`
}

export const ITEM_CATEGORIES = [
  { value: 'tool_machine', label: 'เครื่องมือ/เครื่องจักรกลการเกษตร' },
  { value: 'appliance', label: 'เครื่องใช้ไฟฟ้า/เครื่องใช้ในครัวเรือน' },
  { value: 'vehicle', label: 'ยานพาหนะ' },
  { value: 'other', label: 'อื่นๆ' },
]

export const VEHICLE_TYPES = [
  { value: 'bicycle', label: 'รถจักรยาน' },
  { value: 'motorcycle', label: 'รถจักรยานยนต์' },
  { value: 'car', label: 'รถยนต์' },
]

// สถานะซ่อมที่แนะนำเป็นค่าเริ่มต้นตามประเภท/ชนิดยานพาหนะ — เจ้าหน้าที่ปรับเองได้เสมอ
export function suggestRepairStatus(item) {
  if (item?.category === 'vehicle') {
    return item.vehicleType === 'car' ? 5 : 4
  }
  return 6
}

export const SYMPTOM_OPTIONS = [
  'ไม่ติด/สตาร์ทไม่ติด',
  'มีเสียงดังผิดปกติ',
  'น้ำมัน/สารหล่อลื่นรั่วซึม',
  'สายไฟ/ปลั๊กชำรุด',
  'ไม่มีไฟเข้าเครื่อง',
  'ยางรั่ว/แบน',
  'เบรกไม่ทำงาน',
  'ใบมีด/ใบพัดทื่อหรือชำรุด',
  'ตัวเครื่องบุบ/แตกหัก',
  'สนิมกัดกร่อน',
  'แช่น้ำ/เปียกน้ำ',
]

export const CONDITION_OPTIONS = [
  'สภาพดี ใช้งานทั่วไป',
  'มีคราบสนิม/ตะไคร่',
  'เปียกน้ำ/แช่น้ำมา',
  'บุบ/แตกร้าว',
  'สายไฟ/สายชาร์จชำรุด',
  'ชิ้นส่วนหายไปบางส่วน',
  'สกปรกมาก มีดินโคลน',
]

export const ACCESSORY_OPTIONS = [
  'สายไฟ/สายชาร์จ',
  'รีโมทควบคุม',
  'แบตเตอรี่',
  'กุญแจ',
  'คู่มือการใช้งาน',
  'กล่อง/บรรจุภัณฑ์',
  'ใบเสร็จ/ใบรับประกัน',
  'อะไหล่สำรอง',
  'ไม่มีอุปกรณ์เสริม',
]

export const UNREPAIRABLE_REASONS = [
  'ขาดอะไหล่/หาอะไหล่ไม่ได้ในพื้นที่',
  'ชิ้นส่วนหลักเสียหายเกินซ่อมแซม',
  'ต้นทุนซ่อมสูงกว่ามูลค่าเครื่อง',
  'ไม่มีช่างชำนาญเฉพาะทางในศูนย์',
  'อะไหล่เลิกผลิต/หารุ่นไม่ได้แล้ว',
  'เจ้าของแจ้งขอยกเลิกซ่อม',
]

export const DAMAGE_LEVELS = [
  { value: 'minor', label: 'เล็กน้อย' },
  { value: 'moderate', label: 'ปานกลาง' },
  { value: 'severe', label: 'ค่อนข้างมาก' },
  { value: 'unrepairable', label: 'รุนแรง/มีแนวโน้มซ่อมไม่ได้' },
]

export const OTHER_VALUE = 'อื่นๆ โปรดระบุ'
