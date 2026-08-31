import { ITEM_CATEGORIES, VEHICLE_TYPES } from '../lib/options'

function categoryLabel(item) {
  const cat = ITEM_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category
  if (item.category === 'vehicle') {
    const v = VEHICLE_TYPES.find((t) => t.value === item.vehicleType)?.label
    return v ? `${cat} (${v})` : cat
  }
  if (item.category === 'other') {
    return item.otherDetail ? `${cat}: ${item.otherDetail}` : cat
  }
  return cat
}

export default function PrintTicket({ repair, qrDataUrl }) {
  return (
    <div className="border border-dashed border-slate-400 p-4 flex flex-col gap-3 text-sm leading-snug text-slate-800 overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b-2 border-slate-300 pb-2">
        <div>
          <p className="font-bold text-lg leading-tight">ใบลงทะเบียนรับซ่อม</p>
          <p className="font-bold text-base text-primary leading-tight">RYTC-Fix</p>
          <p className="text-xs text-slate-500 mt-1">ศูนย์ซ่อมสร้างเพื่อชุมชน วิทยาลัยเทคนิคระยอง</p>
        </div>
        <img src={qrDataUrl} alt="QR" className="h-32 w-32 shrink-0" />
      </div>

      <div>
        <p className="font-semibold text-base mb-0.5">ผู้ขอรับบริการ</p>
        <p>ชื่อ-นามสกุล: {repair.requester.fullName}</p>
        <p>เลขบัตรประชาชน: {repair.requester.nationalId}</p>
        <p>โทรศัพท์: {repair.requester.phone}</p>
      </div>

      <div>
        <p className="font-semibold text-base mb-0.5">สิ่งของที่นำมาซ่อม</p>
        <p>ประเภท: {categoryLabel(repair.item)}</p>
        {repair.item.registrationNo && <p>เลขทะเบียน: {repair.item.registrationNo}</p>}
      </div>

      <div>
        <p className="font-semibold text-base mb-0.5">เจ้าหน้าที่รับลงทะเบียน</p>
        <p>ชื่อ-นามสกุล: {repair.intake.staffName}</p>
        <p>โทรศัพท์: {repair.intake.staffPhone}</p>
      </div>

      <p className="mt-auto pt-2 text-xs text-slate-400 border-t border-slate-200">
        รหัสรายการ: {repair.id}
      </p>
    </div>
  )
}
