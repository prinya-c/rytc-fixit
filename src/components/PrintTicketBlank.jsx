import { FIXIT_LOGO, RYTC_LOGO } from '../lib/assets'
import { ITEM_CATEGORIES } from '../lib/options'

/** บรรทัดกรอกมือ: label ชิดซ้าย ส่วนเส้นประยืดเต็มที่เหลือ ทำให้ปลายเส้นประของทุกบรรทัดชิดขอบ
 * ขวาเท่ากันเสมอ ไม่ว่า label จะยาวสั้นแค่ไหน (ต่างจากพิมพ์จุดไข่ปลาจำนวนคงที่ที่ปลายเยื้องกัน) */
function BlankLine({ label }) {
  return (
    <p className="flex items-end gap-1">
      <span className="shrink-0">{label}</span>
      <span className="flex-1 border-b border-dotted border-slate-400">&nbsp;</span>
    </p>
  )
}

/** ใบลงทะเบียนเปล่า ไม่ผูกกับรายการซ่อมใด ๆ — ให้เจ้าหน้าที่กรอกด้วยมือหน้างาน (เช่นตอนคิวยาว
 * ไฟดับ หรือยังไม่สะดวกลงทะเบียนในระบบทันที) ทุกช่องเป็นเส้นประให้กรอกเอง ตรงกับโครงของ
 * PrintTicket.jsx (ใบลงทะเบียนจริง) ทุกช่อง ต่างกันแค่ไม่มี QR ด้านบนเพราะยังไม่มีรหัสรายการ */
export default function PrintTicketBlank({ contactQrDataUrl }) {
  return (
    <div className="border border-dashed border-slate-400 p-3 flex flex-col gap-2 text-xs leading-snug text-slate-800 overflow-hidden">
      <div className="flex items-start justify-between gap-2 border-b-2 border-slate-300 pb-1.5">
        <div>
          <img src={FIXIT_LOGO} alt="Fix it Center" className="h-8 w-8 object-contain" />
          <p className="font-bold text-base leading-tight mt-1">ใบลงทะเบียนรับซ่อม</p>
          <p className="font-bold text-sm text-primary leading-tight">FixIT Center</p>
          <p className="text-[10px] text-slate-500 mt-0.5">ศูนย์ซ่อมสร้างเพื่อชุมชน อาชีวศึกษาจังหวัดระยอง</p>
        </div>
        <div className="flex flex-col items-center justify-center h-20 w-14 border-2 border-primary rounded-md shrink-0">
          <p className="text-[9px] leading-none text-slate-500 mt-1">คิวที่</p>
        </div>
      </div>

      <div className="space-y-0.5">
        <p className="font-semibold text-sm mb-0.5">ผู้ขอรับบริการ</p>
        <BlankLine label="ชื่อ-นามสกุล:" />
        <BlankLine label="เลขบัตรประชาชน:" />
        <BlankLine label="โทรศัพท์:" />
      </div>

      <div className="space-y-0.5">
        <p className="font-semibold text-sm mb-0.5">สิ่งของที่นำมาซ่อม</p>
        <p>ประเภท:</p>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {ITEM_CATEGORIES.map((c) => (
            <span key={c.value}>☐ {c.label}</span>
          ))}
        </div>
        <BlankLine label="สิ่งที่ส่งซ่อม:" />
        <p className="flex items-end gap-1">
          <span className="shrink-0">ยี่ห้อ:</span>
          <span className="flex-1 border-b border-dotted border-slate-400">&nbsp;</span>
          <span className="shrink-0">รุ่น:</span>
          <span className="flex-1 border-b border-dotted border-slate-400">&nbsp;</span>
        </p>
        <BlankLine label="เลขทะเบียนรถ:" />
      </div>

      <div className="space-y-0.5">
        <p className="font-semibold text-sm mb-0.5">เจ้าหน้าที่รับลงทะเบียน</p>
        <BlankLine label="ชื่อ-นามสกุล:" />
        <BlankLine label="โทรศัพท์:" />
      </div>

      <div className="mt-auto pt-1.5 border-t border-slate-200 flex items-center gap-2">
        <img src={contactQrDataUrl} alt="QR ติดตามสถานะ" className="h-12 w-12 shrink-0" />
        <p className="text-[9px] leading-tight text-slate-500">
          สแกนเพื่อติดตามสถานะงานซ่อม
          <br />
          หรือโทรสอบถามได้ที่เจ้าหน้าที่รับลงทะเบียน
        </p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-[9px] text-slate-400 flex items-end gap-1 flex-1">
          <span className="shrink-0">รหัสรายการ:</span>
          <span className="flex-1 border-b border-dotted border-slate-400">&nbsp;</span>
        </p>
        <img src={RYTC_LOGO} alt="Rayong Technical College" className="h-4 object-contain shrink-0" />
      </div>
    </div>
  )
}
