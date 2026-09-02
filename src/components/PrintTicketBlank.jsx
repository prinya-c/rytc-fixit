import { FIXIT_LOGO, RYTC_LOGO } from '../lib/assets'

const BLANK = '.......................................................'

/** ใบลงทะเบียนเปล่า ไม่ผูกกับรายการซ่อมใด ๆ — ให้เจ้าหน้าที่กรอกด้วยมือหน้างาน (เช่นตอนคิวยาว
 * ไฟดับ หรือยังไม่สะดวกลงทะเบียนในระบบทันที) ทุกช่องเป็นเส้นประให้กรอกเอง ตรงกับโครงของ
 * PrintTicket.jsx (ใบลงทะเบียนจริง) ทุกช่อง ต่างกันแค่ไม่มี QR ด้านบนเพราะยังไม่มีรหัสรายการ */
export default function PrintTicketBlank({ contactQrDataUrl }) {
  return (
    <div className="border border-dashed border-slate-400 p-4 flex flex-col gap-3 text-sm leading-snug text-slate-800 overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b-2 border-slate-300 pb-2">
        <div>
          <img src={FIXIT_LOGO} alt="Fix it Center" className="h-10 w-10 object-contain" />
          <p className="font-bold text-lg leading-tight mt-1">ใบลงทะเบียนรับซ่อม</p>
          <p className="font-bold text-base text-primary leading-tight">FixIT Center</p>
          <p className="text-xs text-slate-500 mt-1">ศูนย์ซ่อมสร้างเพื่อชุมชน อาชีวศึกษาจังหวัดระยอง</p>
        </div>
        <div className="flex flex-col items-center justify-center h-24 w-16 border-2 border-primary rounded-md shrink-0">
          <p className="text-[10px] leading-none text-slate-500 mt-1.5">คิวที่</p>
        </div>
      </div>

      <div>
        <p className="font-semibold text-base mb-0.5">ผู้ขอรับบริการ</p>
        <p>ชื่อ-นามสกุล: {BLANK}</p>
        <p>เลขบัตรประชาชน: {BLANK}</p>
        <p>โทรศัพท์: {BLANK}</p>
      </div>

      <div>
        <p className="font-semibold text-base mb-0.5">สิ่งของที่นำมาซ่อม</p>
        <p>ประเภท: {BLANK}</p>
        <p>สิ่งที่ส่งซ่อม: {BLANK}</p>
        <p>ยี่ห้อ: {BLANK}</p>
        <p>รุ่น: {BLANK}</p>
        <p>เลขทะเบียนรถ: {BLANK}</p>
      </div>

      <div>
        <p className="font-semibold text-base mb-0.5">เจ้าหน้าที่รับลงทะเบียน</p>
        <p>ชื่อ-นามสกุล: {BLANK}</p>
        <p>โทรศัพท์: {BLANK}</p>
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
        <p className="text-[10px] text-slate-400">รหัสรายการ: {BLANK}</p>
        <img src={RYTC_LOGO} alt="Rayong Technical College" className="h-5 object-contain" />
      </div>
    </div>
  )
}
