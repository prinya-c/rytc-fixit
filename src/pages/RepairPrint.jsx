import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import PrintTicket from '../components/PrintTicket'
import { getRepair } from '../lib/repairs'

// ลิงก์ติดตามสถานะสาธารณะ (Dashboard) — เหมือนกันทุกใบ ไม่ขึ้นกับรายการซ่อม
const CONTACT_URL = 'https://fixit-app.ryct.ac.th'

export default function RepairPrint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [repair, setRepair] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [contactQrDataUrl, setContactQrDataUrl] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // ลิงก์ติดตามสถานะไม่ขึ้นกับ id ของรายการ สร้างได้ทันทีโดยไม่ต้องรอโหลดข้อมูล
    QRCode.toDataURL(CONTACT_URL, { margin: 1, width: 200 }).then(setContactQrDataUrl)
  }, [])

  useEffect(() => {
    let active = true
    getRepair(id).then((data) => {
      if (!active) return
      if (!data) {
        setError('ไม่พบรายการนี้')
        return
      }
      setRepair(data)
      const url = `${window.location.origin}${import.meta.env.BASE_URL}#/repairs/${id}`
      // width สูงกว่าที่แสดงจริง (h-32 ~128px ในหน้าเว็บ) เพื่อให้คมชัดตอนพิมพ์บนกระดาษจริง
      QRCode.toDataURL(url, { margin: 1, width: 400 }).then((dataUrl) => {
        if (active) setQrDataUrl(dataUrl)
      })
    })
    return () => {
      active = false
    }
  }, [id])

  if (error) {
    return <p className="text-center text-danger py-10">{error}</p>
  }
  if (!repair || !qrDataUrl || !contactQrDataUrl) {
    return <p className="text-center text-slate-400 py-10">กำลังโหลด...</p>
  }

  return (
    <div>
      <div className="no-print max-w-3xl mx-auto px-4 py-4 flex gap-3">
        <button
          onClick={() => window.print()}
          className="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2 font-medium"
        >
          🖨️ พิมพ์ใบลงทะเบียน
        </button>
        <button
          onClick={() => navigate(`/repairs/${id}`)}
          className="rounded-md border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50"
        >
          ไปหน้ารายละเอียด
        </button>
      </div>

      <div className="mx-auto w-[210mm] h-[297mm] grid grid-cols-2 grid-rows-2 bg-white">
        <PrintTicket repair={repair} qrDataUrl={qrDataUrl} contactQrDataUrl={contactQrDataUrl} />
        <PrintTicket repair={repair} qrDataUrl={qrDataUrl} contactQrDataUrl={contactQrDataUrl} />
        <PrintTicket repair={repair} qrDataUrl={qrDataUrl} contactQrDataUrl={contactQrDataUrl} />
        <PrintTicket repair={repair} qrDataUrl={qrDataUrl} contactQrDataUrl={contactQrDataUrl} />
      </div>
    </div>
  )
}
