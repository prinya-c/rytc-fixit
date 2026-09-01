import { FIXIT_LOGO, RYTC_LOGO } from '../lib/assets'
import { ITEM_CATEGORIES, OTHER_VALUE, VEHICLE_TYPES } from '../lib/options'

const CENTER_NAME = 'วิทยาลัยเทคนิคระยอง'

function fmtDate(ts) {
  return ts?.toDate ? ts.toDate().toLocaleDateString('th-TH', { dateStyle: 'medium' }) : '-'
}

function fmtTime(ts) {
  return ts?.toDate ? ts.toDate().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-'
}

/** ปีงบประมาณไทย: ต.ค.-ธ.ค. อยู่ในปีงบประมาณถัดไป, ม.ค.-ก.ย. อยู่ในปีงบประมาณเดียวกัน (พ.ศ.) */
function fiscalYear(ts) {
  if (!ts?.toDate) return '-'
  const d = ts.toDate()
  const beYear = d.getFullYear() + 543
  return d.getMonth() + 1 >= 10 ? beYear + 1 : beYear
}

function itemDescription(item) {
  if (!item) return '-'
  if (item.category === 'vehicle') {
    const v = VEHICLE_TYPES.find((t) => t.value === item.vehicleType)?.label
    return v || 'ยานพาหนะ'
  }
  if (item.category === 'other') return item.otherDetail || 'อื่นๆ'
  return ITEM_CATEGORIES.find((c) => c.value === item.category)?.label || '-'
}

function formatAddress(r) {
  const parts = []
  if (r.houseNo) parts.push(`บ้านเลขที่ ${r.houseNo}`)
  if (r.moo) parts.push(`หมู่ที่ ${r.moo}`)
  if (r.subDistrict) parts.push(`ตำบล ${r.subDistrict}`)
  if (r.district) parts.push(`อำเภอ ${r.district}`)
  if (r.province) parts.push(`จังหวัด ${r.province}`)
  return parts.length > 0 ? parts.join(' ') : '-'
}

/** แทนที่ OTHER_VALUE ด้วยข้อความที่กรอกจริง (ถ้ามี) ก่อนแสดงผล */
function displayItems(items, otherDetail) {
  if (!items || items.length === 0) return null
  return items.map((item) => (item === OTHER_VALUE && otherDetail ? otherDetail : item))
}

function ListOrDash({ items }) {
  if (!items || items.length === 0) return <p>-</p>
  return items.map((item, i) => (
    <p key={`${item}-${i}`}>
      {i + 1}. {item}
    </p>
  ))
}

/** หาช่วงเวลาซ่อม/ผู้ตรวจเช็คจากประวัติ statusLogs — ไม่มีฟิลด์แยกเก็บ ใช้ log ที่มีอยู่แทน */
function findRepairStart(logs) {
  const repairLogs = logs.filter((l) => [4, 5, 6].includes(l.status))
  if (repairLogs.length === 0) return null
  return repairLogs.reduce((earliest, l) => {
    const t = l.changedAt?.toMillis?.() ?? Infinity
    const eT = earliest?.changedAt?.toMillis?.() ?? Infinity
    return t < eT ? l : earliest
  }, repairLogs[0])
}

export default function RepairReportSheet({ repair, logs }) {
  const repairStartLog = findRepairStart(logs)

  return (
    <div className="p-[15mm] text-[13px] leading-snug text-slate-900">
      <div className="flex items-center justify-between mb-3">
        <img src={RYTC_LOGO} alt="Rayong Technical College" className="h-10 object-contain" />
        <div className="text-center">
          <p className="text-lg font-bold">ใบรับงานซ่อม (Repair Form)</p>
          <p className="text-sm">ศูนย์ซ่อมสร้างเพื่อชุมชน (Fix it Center)</p>
        </div>
        <img src={FIXIT_LOGO} alt="Fix it Center" className="h-16 w-16 object-contain" />
      </div>

      <div className="flex justify-between mb-2">
        <p>ชื่อศูนย์: {CENTER_NAME}</p>
        <p>ปีงบประมาณ: {fiscalYear(repair.intake?.registeredAt)}</p>
      </div>

      <div className="grid grid-cols-2 border border-slate-500">
        <div className="p-2 border-r border-slate-500">
          วัน/เดือน/ปี: {fmtDate(repair.intake?.registeredAt)} &nbsp; เวลา: {fmtTime(repair.intake?.registeredAt)}
        </div>
        <div className="p-2">เลขที่: {repair.id}</div>
      </div>

      <div className="border border-t-0 border-slate-500 p-2 space-y-1">
        <p className="font-semibold">ส่วนของผู้รับบริการ</p>
        <p>ชื่อ-สกุล: {repair.requester?.fullName}</p>
        <p>บัตรประจำตัวประชาชน: {repair.requester?.nationalId}</p>
        <p>ที่อยู่: {formatAddress(repair.requester ?? {})}</p>
        <p>โทรศัพท์: {repair.requester?.phone}</p>
        <p>สิ่งของที่นำมาซ่อม: {itemDescription(repair.item)}</p>
        <p className="font-semibold mt-1">ประเภทเครื่องใช้ที่ซ่อม</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          {ITEM_CATEGORIES.map((c) => (
            <span key={c.value}>
              {repair.item?.category === c.value ? '☑' : '☐'} {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 border border-t-0 border-slate-500">
        <div className="p-2 border-r border-slate-500">
          <p className="font-semibold text-center mb-1">อาการเสีย</p>
          <ListOrDash
            items={displayItems(repair.intakeCondition?.symptoms, repair.intakeCondition?.symptomOtherDetail)}
          />
        </div>
        <div className="p-2 border-r border-slate-500">
          <p className="font-semibold text-center mb-1">สภาพเครื่องใช้ที่นำมาซ่อม</p>
          <ListOrDash
            items={displayItems(repair.intakeCondition?.condition, repair.intakeCondition?.conditionOtherDetail)}
          />
        </div>
        <div className="p-2">
          <p className="font-semibold text-center mb-1">อุปกรณ์ที่ติดมาด้วย</p>
          <ListOrDash
            items={displayItems(repair.intakeCondition?.accessories, repair.intakeCondition?.accessoryOtherDetail)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 border border-t-0 border-slate-500">
        <div className="p-2 border-r border-slate-500 min-h-[20mm]">
          <p className="font-semibold">สาเหตุเกิดจาก</p>
          <p>{repair.assessment?.causeNote || '-'}</p>
        </div>
        <div className="p-2 min-h-[20mm]">
          <p className="font-semibold">รายละเอียดการซ่อม</p>
          <p>{repair.qualityCheck?.repairDetails || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 border border-t-0 border-slate-500">
        <div className="p-2 border-r border-slate-500 space-y-1">
          <p>
            {!repair.unrepairable ? '☑' : '☐'} ซ่อมได้ &nbsp;&nbsp; {repair.unrepairable ? '☑' : '☐'} ซ่อมไม่ได้
          </p>
          <p>
            วันที่เริ่มซ่อม: {fmtDate(repairStartLog?.changedAt)} &nbsp; เวลา: {fmtTime(repairStartLog?.changedAt)}
          </p>
          <p>
            วันที่ซ่อมเสร็จ: {fmtDate(repair.qualityCheck?.checkedAt)} &nbsp; เวลา: {fmtTime(repair.qualityCheck?.checkedAt)}
          </p>
        </div>
        <div className="p-2 space-y-1">
          <p className="font-semibold">ผู้ดำเนินการซ่อม/ตรวจเช็ค</p>
          <p>ชื่อ-สกุล: {repair.qualityCheck?.technicianName || '-'}</p>
          <p>บัตรประจำตัวประชาชนเลขที่: {repair.qualityCheck?.technicianNationalId || '-'}</p>
          <p>สาขาวิชา: {repair.qualityCheck?.department || '-'}</p>
          <p>ครูสาขาวิชา: {repair.qualityCheck?.supervisingTeacher || '-'}</p>
        </div>
      </div>

      <div className="flex justify-between mt-10 px-4 text-center">
        <div>
          <p>ผู้รับเครื่อง...........................................</p>
          <p className="mt-1">({repair.closure?.receiverName || '-'})</p>
          <p>วันที่ {fmtDate(repair.closure?.closedAt)}</p>
        </div>
        <div>
          <p>ผู้ส่งมอบเครื่อง...........................................</p>
          <p className="mt-1">({repair.closure?.closedByName || '-'})</p>
          <p>วันที่ {fmtDate(repair.closure?.closedAt)}</p>
        </div>
      </div>
    </div>
  )
}
