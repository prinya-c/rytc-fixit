import { FIXIT_LOGO, RYTC_LOGO } from '../lib/assets'
import { ITEM_CATEGORIES, VEHICLE_TYPES } from '../lib/options'

function categoryLabel(item) {
  const cat = ITEM_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category
  if (item.category === 'vehicle') {
    const v = VEHICLE_TYPES.find((t) => t.value === item.vehicleType)?.label
    return v ? `${cat} (${v})` : cat
  }
  if (item.itemName) return `${cat}: ${item.itemName}`
  return cat
}

export default function PrintTicket({ repair, qrDataUrl, contactQrDataUrl }) {
  return (
    <div className="border border-dashed border-slate-400 p-4 flex flex-col gap-3 text-sm leading-snug text-slate-800 overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b-2 border-slate-300 pb-2">
        <div>
          <img src={FIXIT_LOGO} alt="Fix it Center" className="h-10 w-10 object-contain" />
          <p className="font-bold text-lg leading-tight mt-1">ใบลงทะเบียนรับซ่อม</p>
          <p className="font-bold text-base text-primary leading-tight">RYTC-FixIT</p>
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
        {repair.item.brand && <p>ยี่ห้อ: {repair.item.brand}</p>}
        {repair.item.model && <p>รุ่น: {repair.item.model}</p>}
        {repair.item.registrationNo && <p>เลขทะเบียนรถ: {repair.item.registrationNo}</p>}
      </div>

      <div>
        <p className="font-semibold text-base mb-0.5">เจ้าหน้าที่รับลงทะเบียน</p>
        <p>ชื่อ-นามสกุล: {repair.intake.staffName}</p>
        <p>โทรศัพท์: {repair.intake.staffPhone}</p>
      </div>

      <div className="mt-auto pt-2 border-t border-slate-200 flex items-center gap-2">
        <img src={contactQrDataUrl} alt="QR ติดตามสถานะ" className="h-14 w-14 shrink-0" />
        <p className="text-[10px] leading-tight text-slate-500">
          สแกนเพื่อติดตามสถานะงานซ่อม
          <br />
          หรือโทรสอบถามได้ที่เจ้าหน้าที่รับลงทะเบียน
        </p>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-[10px] text-slate-400">รหัสรายการ: {repair.id}</p>
        <img src={RYTC_LOGO} alt="Rayong Technical College" className="h-5 object-contain" />
      </div>
    </div>
  )
}
