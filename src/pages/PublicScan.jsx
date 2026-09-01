import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'

const READER_ID = 'qr-reader'

function extractRepairId(text) {
  // รองรับทั้งลิงก์เต็ม (/repairs/{id}) และกรณีสแกนได้แค่ตัว id ดิบๆ
  const match = text.match(/\/repairs\/([^/?#]+)/)
  if (match) return match[1]
  if (/^[A-Za-z0-9_-]+$/.test(text.trim())) return text.trim()
  return null
}

/**
 * หน้าสาธารณะ (ไม่ต้องล็อกอิน) สำหรับกดสแกน QR จากปุ่มในหน้าแรก — ใช้ QR ใบเดียวกับที่เจ้าหน้าที่
 * ใช้ (อันบนบนใบลงทะเบียน) แล้ว navigate ไป /repairs/:id ตรงๆ โดยไม่ query ข้อมูลก่อน เพราะ
 * repairs/{id} ปิดอ่านไว้เฉพาะเจ้าหน้าที่ที่ล็อกอิน — หน้าปลายทาง (RepairDetailGate.jsx) จะเลือก
 * แสดงสถานะสาธารณะหรือรายละเอียดเต็มเองตาม auth state อยู่แล้ว
 */
export default function PublicScan() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const scannerRef = useRef(null)
  const handledRef = useRef(false)
  const stoppedRef = useRef(false)

  useEffect(() => {
    const scanner = new Html5Qrcode(READER_ID)
    scannerRef.current = scanner

    // ต้องเรียกแค่ครั้งเดียว ไม่ว่าจะมาจากตอนสแกนเจอ QR หรือตอนออกจากหน้านี้ (cleanup) — เรียก
    // stop() ซ้ำสองรอบทำให้กล้อง/DOM ของ html5-qrcode เคลียร์ไม่หมด เหลือ video/overlay ค้างทับ
    // หน้าถัดไปที่ navigate ไป (ดูบั๊กเดียวกันที่เคยแก้ไว้ใน Scan.jsx)
    async function stopAndClear() {
      if (stoppedRef.current) return
      stoppedRef.current = true
      try {
        await scanner.stop()
      } catch {
        // ignore
      }
      try {
        scanner.clear()
      } catch {
        // ignore
      }
    }

    async function handleDecoded(decodedText) {
      if (handledRef.current) return
      const repairId = extractRepairId(decodedText)
      if (!repairId) {
        setError('QR นี้ไม่ใช่ QR ของ RYTC-FixIT')
        return
      }
      handledRef.current = true
      await stopAndClear()
      navigate(`/repairs/${repairId}`)
    }

    scanner
      .start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, handleDecoded, () => {})
      .catch((err) => setError(`ไม่สามารถเปิดกล้องได้: ${err}`))

    return () => {
      stopAndClear()
    }
  }, [navigate])

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4 text-center">
      <h1 className="text-xl font-bold text-slate-800">สแกน QR เพื่อดูสถานะงานซ่อม</h1>
      <p className="text-sm text-slate-500">
        สแกน QR บนใบลงทะเบียนเพื่อดูสถานะงานซ่อมของท่าน
      </p>
      <div id={READER_ID} className="rounded-xl overflow-hidden border border-orange-100" />
      {error && (
        <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}
      <button type="button" onClick={() => navigate('/')} className="text-sm text-slate-500 hover:underline">
        กลับหน้าแรก
      </button>
    </div>
  )
}
