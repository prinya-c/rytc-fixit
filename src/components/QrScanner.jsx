import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

const READER_ID = 'qr-reader'

/**
 * กล้องสแกน QR แบบใช้ซ้ำได้ (หน้า /scan สำหรับเจ้าหน้าที่ และหน้าติดตามสถานะสาธารณะ /track) —
 * จัดการวงจรชีวิตของ html5-qrcode ให้ครบ (เปิด/หยุด/เคลียร์กล้อง ครั้งเดียวไม่ซ้อนกัน) กันปัญหา
 * video/overlay ค้างทับหน้าถัดไปตอน navigate ออกจากหน้านี้
 *
 * onDecode(text) ให้คืนค่า true ถ้าจัดการ QR นี้แล้ว (จะหยุดกล้อง) หรือ false ถ้ายังไม่ใช่ QR
 * ที่ต้องการ (สแกนต่อ โดยไม่ต้องหยุดกล้อง)
 */
export default function QrScanner({ onDecode, onCameraError }) {
  const busyRef = useRef(false)
  const stoppedRef = useRef(false)
  const onDecodeRef = useRef(onDecode)
  const onCameraErrorRef = useRef(onCameraError)

  // อัปเดต ref ให้ชี้ callback ล่าสุดเสมอ (นอก render, ตาม React rule) — เพื่อให้ effect หลัก
  // ด้านล่างไม่ต้องมี onDecode/onCameraError เป็น dependency (จะได้ไม่ต้อง restart กล้องทุกครั้ง
  // ที่หน้าที่เรียกใช้ re-render ด้วย inline function ใหม่)
  useEffect(() => {
    onDecodeRef.current = onDecode
    onCameraErrorRef.current = onCameraError
  })

  useEffect(() => {
    const scanner = new Html5Qrcode(READER_ID)

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
      if (busyRef.current) return
      busyRef.current = true
      const consumed = await onDecodeRef.current(decodedText)
      if (consumed) {
        await stopAndClear()
      } else {
        busyRef.current = false
      }
    }

    scanner
      .start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, handleDecoded, () => {})
      .catch((err) => onCameraErrorRef.current?.(err))

    return () => {
      stopAndClear()
    }
  }, [])

  return <div id={READER_ID} className="rounded-xl overflow-hidden border border-orange-100" />
}
