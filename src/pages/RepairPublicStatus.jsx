import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PhotoOrPending from '../components/PhotoOrPending'
import StatusBadge from '../components/StatusBadge'
import { subscribePublicRepairByRepairId } from '../lib/repairs'

function formatDate(ts) {
  if (!ts?.toDate) return '-'
  return ts.toDate().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

/**
 * แสดงเมื่อคนที่ยังไม่ได้ล็อกอินสแกน QR อันบนของใบลงทะเบียน (ลิงก์เดียวกับที่เจ้าหน้าที่ใช้ —
 * ดู RepairDetailGate.jsx) — โชว์ชื่อสิ่งของ/ยี่ห้อ-รุ่น/ชื่อผู้ขอรับบริการ/สถานะงานซ่อม ไม่มีเบอร์
 * โทร/เลขบัตรประชาชน/รูปคน อ่านจาก publicRepairs เท่านั้น (ดู subscribePublicRepairByRepairId
 * ใน repairs.js) ไม่แสดงประเภทสิ่งของ (category) เพราะชื่อสิ่งของสื่อความได้ตรงกว่าอยู่แล้ว
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
        {repair.itemName && <p className="font-semibold text-slate-800 text-lg">{repair.itemName}</p>}
        {(repair.brand || repair.model) && (
          <p className="text-sm text-slate-500">
            {repair.brand && `ยี่ห้อ ${repair.brand}`}
            {repair.brand && repair.model && ' · '}
            {repair.model && `รุ่น ${repair.model}`}
          </p>
        )}
        {repair.requesterName && <p className="text-sm text-slate-600">เจ้าของ: {repair.requesterName}</p>}
        <StatusBadge status={repair.status} unrepairable={repair.unrepairable} showLabel />
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
