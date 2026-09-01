import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PhotoOrPending from '../components/PhotoOrPending'
import StatusBadge from '../components/StatusBadge'
import { subscribePublicRepairByRepairId } from '../lib/repairs'
import { ITEM_CATEGORIES, VEHICLE_TYPES } from '../lib/options'

function categoryLabel(repair) {
  if (!repair) return ''
  const cat = ITEM_CATEGORIES.find((c) => c.value === repair.category)?.label ?? repair.category
  if (repair.category === 'vehicle') {
    const v = VEHICLE_TYPES.find((t) => t.value === repair.vehicleType)?.label
    return v ? `${cat} (${v})` : cat
  }
  return cat
}

function formatDate(ts) {
  if (!ts?.toDate) return '-'
  return ts.toDate().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * แสดงเมื่อคนที่ยังไม่ได้ล็อกอินสแกน QR อันบนของใบลงทะเบียน (ลิงก์เดียวกับที่เจ้าหน้าที่ใช้ —
 * ดู RepairDetailGate.jsx) — โชว์แค่สถานะงานซ่อม ไม่มีชื่อ/เบอร์โทร/เลขบัตรประชาชนของผู้ขอรับ
 * บริการ อ่านจาก publicRepairs เท่านั้น (ดู subscribePublicRepairByRepairId ใน repairs.js)
 */
export default function RepairPublicStatus() {
  const { id } = useParams()
  const [repair, setRepair] = useState(undefined)

  useEffect(() => subscribePublicRepairByRepairId(id, setRepair), [id])

  if (repair === undefined) return <p className="text-center text-slate-400 py-10">กำลังโหลด...</p>
  if (repair === null) return <p className="text-center text-danger py-10">ไม่พบรายการนี้</p>

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-slate-800">สถานะงานซ่อม</h1>

      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-slate-800">{categoryLabel(repair)}</p>
          <StatusBadge status={repair.status} unrepairable={repair.unrepairable} />
        </div>
        <PhotoOrPending
          src={repair.itemPhoto}
          alt=""
          className="h-48 w-full rounded-md overflow-hidden bg-orange-50"
        />
        <p className="text-xs text-slate-400">อัปเดตล่าสุด: {formatDate(repair.updatedAt)}</p>
      </div>

      <Link to="/" className="block text-center text-sm text-primary hover:underline">
        กลับหน้าแรก
      </Link>
    </div>
  )
}
