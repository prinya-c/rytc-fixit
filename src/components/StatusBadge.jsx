import { statusLabel } from '../lib/options'

// สีพื้นหลังต่างกันไปตามลำดับขั้นตอน (STATUSES ใน options.js) ช่วยให้แยกสถานะออกจากกันได้ไว
// โดยไม่ต้องอ่านข้อความ — ไล่โทนจากกลาง (เริ่มต้น) → ฟ้า/เขียวอมฟ้า (คัดแยก/ล้าง) → ส้ม/เหลือง
// (กำลังซ่อม 3 สถานี) → ม่วง (ตรวจสอบคุณภาพ) → เขียวอมฟ้าเข้ม (เสร็จ รอส่งมอบ) → แดงอมชมพู
// (ซ่อมไม่ได้ รอส่งคืน) → เขียว (ปิดจบจริง)
const STATUS_COLORS = {
  1: 'bg-slate-100 text-slate-700',
  2: 'bg-indigo-100 text-indigo-700',
  3: 'bg-cyan-100 text-cyan-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-amber-100 text-amber-800',
  6: 'bg-yellow-100 text-yellow-800',
  7: 'bg-purple-100 text-purple-700',
  8: 'bg-teal-100 text-teal-700',
  9: 'bg-rose-100 text-rose-700',
  10: 'bg-green-100 text-green-700',
}

/** showLabel: ใส่คำว่า "สถานะ: " นำหน้า — ใช้เฉพาะจุดที่ badge ไม่มีบริบทอื่นบอกอยู่แล้วว่านี่คือ
 * สถานะอะไร (เช่นหน้าสถานะสาธารณะ) ส่วนจุดอื่น (การ์ดรายการ, หัวหน้ารายละเอียด) ปล่อยค่าเริ่มต้น
 * ไว้ เพราะมีบริบทรอบข้างชัดเจนอยู่แล้ว ใส่ซ้ำจะรก
 */
export default function StatusBadge({ status, unrepairable, showLabel = false, className = '' }) {
  const label = statusLabel(status)
  const color = unrepairable ? 'bg-red-100 text-red-700' : (STATUS_COLORS[status] ?? 'bg-amber-100 text-amber-800')
  const text = unrepairable ? `ซ่อมไม่ได้ • ${label}` : label

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${color} ${className}`}
    >
      {showLabel ? `สถานะ: ${text}` : text}
    </span>
  )
}
