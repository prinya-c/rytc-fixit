import { useEffect, useState } from 'react'
import { subscribePendingCount } from '../lib/offlineQueue'

/**
 * แถบแจ้งเตือนสถานะออฟไลน์/ซิงก์รูปภาพ:
 * - ขาดสัญญาณ: ข้อมูลฟอร์ม (Firestore offline cache) และรูปภาพ (offlineQueue.js) ยังบันทึกได้
 *   ปกติทั้งคู่ แค่รอซิงก์ขึ้นคลาวด์ตอนกลับมาออนไลน์
 * - กลับมาออนไลน์แล้วแต่ยังมีรูปค้างคิวอยู่: แจ้งว่ากำลังซิงก์ให้อัตโนมัติ
 */
export default function OnlineStatusBanner() {
  const [online, setOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    function handleOnline() {
      setOnline(true)
    }
    function handleOffline() {
      setOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => subscribePendingCount(setPendingCount), [])

  if (!online) {
    return (
      <div className="bg-amber-500 text-white text-sm text-center py-2 px-4">
        📴 ขณะนี้ไม่มีสัญญาณอินเทอร์เน็ต — ข้อมูลและรูปภาพจะซิงก์ขึ้นคลาวด์ให้อัตโนมัติเมื่อกลับมาออนไลน์
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="bg-sky-500 text-white text-sm text-center py-2 px-4">
        🔄 กำลังซิงก์รูปภาพที่ค้างไว้ตอนออฟไลน์ {pendingCount} รูป...
      </div>
    )
  }

  return null
}
