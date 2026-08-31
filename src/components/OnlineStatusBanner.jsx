import { useEffect, useState } from 'react'

/**
 * แถบแจ้งเตือนเมื่อเครื่องขาดการเชื่อมต่ออินเทอร์เน็ต — ข้อมูลที่บันทึกช่วงนี้ยังถูกเก็บไว้
 * ในเครื่อง (Firestore offline cache) และจะซิงก์ขึ้น Firebase อัตโนมัติเมื่อกลับมาออนไลน์
 * ยกเว้นรูปภาพที่ยังอัปโหลดไม่สำเร็จ ต้องรออินเทอร์เน็ตกลับมาก่อนจึงจะอัปโหลดได้
 */
export default function OnlineStatusBanner() {
  const [online, setOnline] = useState(navigator.onLine)

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

  if (online) return null

  return (
    <div className="bg-amber-500 text-white text-sm text-center py-2 px-4">
      📴 ขณะนี้ไม่มีสัญญาณอินเทอร์เน็ต — ข้อมูลจะถูกบันทึกไว้ในเครื่องและซิงก์อัตโนมัติเมื่อกลับมาออนไลน์
      (ยกเว้นรูปภาพที่ยังอัปโหลดไม่สำเร็จ)
    </div>
  )
}
