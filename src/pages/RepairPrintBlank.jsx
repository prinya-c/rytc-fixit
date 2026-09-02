import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import PrintTicketBlank from '../components/PrintTicketBlank'

// ลิงก์ติดตามสถานะสาธารณะ (Dashboard) — เหมือนกันทุกใบ ไม่ขึ้นกับรายการซ่อม (ใบเปล่านี้ก็ไม่ได้
// ผูกกับรายการซ่อมใดๆ อยู่แล้ว)
const CONTACT_URL = 'https://fixit-app.rytc.ac.th'

export default function RepairPrintBlank() {
  const navigate = useNavigate()
  const [contactQrDataUrl, setContactQrDataUrl] = useState(null)

  useEffect(() => {
    QRCode.toDataURL(CONTACT_URL, { margin: 1, width: 200 }).then(setContactQrDataUrl)
  }, [])

  if (!contactQrDataUrl) {
    return <p className="text-center text-slate-400 py-10">กำลังโหลด...</p>
  }

  return (
    <div>
      <div className="no-print max-w-3xl mx-auto px-4 py-4 flex gap-3">
        <button
          onClick={() => window.print()}
          className="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2 font-medium"
        >
          🖨️ พิมพ์ใบลงทะเบียนเปล่า
        </button>
        <button
          onClick={() => navigate(-1)}
          className="rounded-md border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50"
        >
          ย้อนกลับ
        </button>
      </div>

      {/* print-preview-scroll: กันจอมือถือดันความกว้างทั้งหน้าเว็บเกินจอ (ดู index.css) —
          ใบพิมพ์จริง 210mm กว้างกว่าจอมือถือทุกรุ่น ต้องเลื่อนดูในกรอบนี้แทน */}
      <div className="print-preview-scroll">
        <div className="mx-auto w-[210mm] h-[297mm] grid grid-cols-2 grid-rows-2 bg-white">
          <PrintTicketBlank contactQrDataUrl={contactQrDataUrl} />
          <PrintTicketBlank contactQrDataUrl={contactQrDataUrl} />
          <PrintTicketBlank contactQrDataUrl={contactQrDataUrl} />
          <PrintTicketBlank contactQrDataUrl={contactQrDataUrl} />
        </div>
      </div>
    </div>
  )
}
