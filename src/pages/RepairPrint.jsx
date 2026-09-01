import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import QRCode from 'qrcode'
import PrintTicket from '../components/PrintTicket'
import { getRepair } from '../lib/repairs'

export default function RepairPrint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [repair, setRepair] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [contactQrDataUrl, setContactQrDataUrl] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getRepair(id).then((data) => {
      if (!active) return
      if (!data) {
        setError('ไม่พบรายการนี้')
        return
      }
      setRepair(data)
      const url = `${window.location.origin}${import.meta.env.BASE_URL}repairs/${id}`
      // ลิงก์ติดตามสถานะสาธารณะ ต้องเป็นรายการนี้เท่านั้น (publicId ไม่ใช่ repairId) ไม่ต้อง
      // ล็อกอิน — ดู TrackStatus.jsx และ publicRepairs ใน repairs.js — รายการเก่าก่อนมีฟิลด์
      // publicId (ถ้ามี) จะ fallback ไปหน้าแรกแทนไม่ให้ QR พังเป็นลิงก์เพี้ยน
      const contactUrl = data.publicId
        ? `${window.location.origin}${import.meta.env.BASE_URL}track/${data.publicId}`
        : `${window.location.origin}${import.meta.env.BASE_URL}`
      // width สูงกว่าที่แสดงจริง (h-32/h-14 ในหน้าเว็บ) เพื่อให้คมชัดตอนพิมพ์บนกระดาษจริง
      Promise.all([
        QRCode.toDataURL(url, { margin: 1, width: 400 }),
        QRCode.toDataURL(contactUrl, { margin: 1, width: 200 }),
      ]).then(([itemQr, contactQr]) => {
        if (!active) return
        setQrDataUrl(itemQr)
        setContactQrDataUrl(contactQr)
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
