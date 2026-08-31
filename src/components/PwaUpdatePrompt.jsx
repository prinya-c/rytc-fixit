import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * แจ้งเตือนเมื่อแอปเวอร์ชันใหม่ดาวน์โหลดเสร็จแล้ว (Service Worker แคช "app shell" ชุดใหม่ไว้
 * พร้อมใช้แล้ว) แต่รอให้เจ้าหน้าที่กดยืนยันเองก่อนสลับไปใช้ — กันไม่ให้สลับเวอร์ชันกลางคันตอน
 * กำลังกรอกฟอร์มอยู่โดยไม่รู้ตัว (registerType: 'prompt' ใน vite.config.js คู่กับ component นี้)
 */
export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      // เช็คเวอร์ชันใหม่เป็นระยะเผื่อเปิดแอปค้างไว้นานๆ (ปกติ Service Worker เช็คตอนโหลดหน้าใหม่
      // เท่านั้น) ศูนย์ซ่อมอาจเปิดแท็บทิ้งไว้ทั้งวันระหว่างให้บริการ
      setInterval(() => registration.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="bg-primary text-white text-sm text-center py-2 px-4 flex flex-wrap items-center justify-center gap-3">
      <span>🆕 มีเวอร์ชันใหม่ของแอปพร้อมใช้งาน</span>
      <button
        type="button"
        onClick={() => updateServiceWorker(true)}
        className="rounded-md bg-white text-primary px-3 py-1 font-medium hover:bg-orange-50"
      >
        อัปเดตตอนนี้
      </button>
      <button type="button" onClick={() => setNeedRefresh(false)} className="text-white/80 hover:text-white underline">
        ไว้ทีหลัง
      </button>
    </div>
  )
}
