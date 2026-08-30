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
    <div className="border border-dashed border-slate-400 p-3 flex flex-col text-[10px] leading-tight text-slate-800 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-300 pb-1 mb-1">
        <div>
          <p className="font-bold text-xs">ใบลงทะเบียนรับซ่อม RYTC-Fix</p>
          <p className="text-slate-500">ศูนย์ซ่อมสร้างเพื่อชุมชน วิทยาลัยเทคนิคระยอง</p>
        </div>
        <img src={qrDataUrl} alt="QR" className="h-16 w-16 shrink-0" />
      </div>

      <p className="font-semibold mt-1">ผู้ขอรับบริการ</p>
      <p>ชื่อ-นามสกุล: {repair.requester.fullName}</p>
      <p>เลขบัตรประชาชน: {repair.requester.nationalId}</p>
      <p>โทรศัพท์: {repair.requester.phone}</p>

      <p className="font-semibold mt-1">สิ่งของที่นำมาซ่อม</p>
      <p>ประเภท: {categoryLabel(repair.item)}</p>
      {repair.item.registrationNo && <p>เลขทะเบียน: {repair.item.registrationNo}</p>}

      <p className="font-semibold mt-1">เจ้าหน้าที่รับลงทะเบียน</p>
      <p>ชื่อ-นามสกุล: {repair.intake.staffName}</p>
      <p>โทรศัพท์: {repair.intake.staffPhone}</p>

      <p className="mt-auto pt-1 text-slate-400 border-t border-slate-200">
        รหัสรายการ: {repair.id}
      </p>
    </div>
  )
}
