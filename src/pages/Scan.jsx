import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { getRepair } from '../lib/repairs'

const READER_ID = 'qr-reader'

function extractRepairId(text) {
  // ไม่ผูกกับ "#/repairs/" ตรงๆ เพราะใบเก่าที่เคยพิมพ์ไว้ตอนแอปยังใช้ HashRouter จะมี # นำหน้า
  // ส่วนใบใหม่ (BrowserRouter) จะไม่มี # เลย — จับแค่ "/repairs/{id}" เฉยๆ ก็ครอบคลุมทั้งสองแบบ
  const match = text.match(/\/repairs\/([^/?#]+)/)
  if (match) return match[1]
  if (/^[A-Za-z0-9_-]+$/.test(text.trim())) return text.trim()
  return null
}

function destinationFor(repair) {
  if (repair.status === 1) return `/repairs/${repair.id}/assess`
  if (repair.status === 8 || repair.status === 10) return `/repairs/${repair.id}`
  return `/repairs/${repair.id}/status`
}

export default function Scan() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const scannerRef = useRef(null)
  const handledRef = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner

    async function handleDecoded(decodedText) {
      if (handledRef.current) return
      const repairId = extractRepairId(decodedText)
      if (!repairId) {
        setError('QR นี้ไม่ใช่ QR ของ RYTC-FixIT')
        return
      }
      handledRef.current = true
      setBusy(true)
      try {
        await scanner.stop()
      } catch {
        // ignore
      }
      const repair = await getRepair(repairId)
      if (!repair) {
        setError('ไม่พบรายการนี้ในระบบ')
        setBusy(false)
        handledRef.current = false
        return
      }
      navigate(destinationFor(repair))
    }

    scanner
      .start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, handleDecoded, () => {})
      .catch((err) => setError(`ไม่สามารถเปิดกล้องได้: ${err}`))

    return () => {
      scanner.stop().catch(() => {})
    }
  }, [navigate])

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4 text-center">
      <h1 className="text-xl font-bold text-slate-800">สแกน QR Code</h1>
      <p className="text-sm text-slate-500">
        สแกน QR บนใบลงทะเบียนเพื่อไปยังขั้นตอนที่เหมาะสมของงานซ่อมนี้
      </p>
      <div id={READER_ID} className="rounded-xl overflow-hidden border border-orange-100" />
      {busy && <p className="text-sm text-slate-400">กำลังค้นหารายการ...</p>}
      {error && (
        <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}
    </div>
  )
}
