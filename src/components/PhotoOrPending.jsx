import { useEffect, useState } from 'react'
import { getPendingPhoto } from '../lib/offlineQueue'

function SyncBadge() {
  return (
    <span className="absolute bottom-1 right-1 inline-flex items-center gap-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-medium px-1.5 py-0.5 shadow-sm">
      🕒 รอซิงก์
    </span>
  )
}

/**
 * แสดงรูปถ้ามี URL แล้ว (จาก Firestore/Storage) — ถ้ายังไม่มี (คิวไว้ในเครื่องตอนออฟไลน์ ดู
 * src/lib/offlineQueue.js) แต่ระบุ repairId/kind/slot มาด้วย จะลองหาไฟล์รูปที่ค้างคิวอยู่ในเครื่อง
 * มาแสดงเป็น preview แทน (พร้อมป้าย "รอซิงก์" มุมล่างขวา บอกว่ายังไม่ได้อัปโหลดขึ้น Firebase จริง)
 * ถ้าไม่มีไฟล์ในเครื่องเลย ถึงจะโชว่ช่องว่าง "รอซิงก์รูป" เต็มช่อง — เมื่อกลับมาออนไลน์แล้วซิงก์
 * สำเร็จ รูปจริงจะขึ้นแทนที่ preview เองอัตโนมัติผ่าน onSnapshot ที่หน้าเรียกอยู่แล้ว
 */
export default function PhotoOrPending({ src, alt, className, onClick, repairId, kind, slot }) {
  const [localPreview, setLocalPreview] = useState(null)

  useEffect(() => {
    if (src || !repairId || !kind || !slot) return undefined
    let cancelled = false
    let objectUrl = null
    getPendingPhoto(repairId, kind, slot).then((record) => {
      if (cancelled || !record) return
      objectUrl = URL.createObjectURL(record.file)
      setLocalPreview(objectUrl)
    })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src, repairId, kind, slot])

  // ไม่ต้อง setLocalPreview(null) เมื่อ src กลายเป็นค่าจริง — effectiveSrc ด้านล่างใช้ src ก่อน
  // localPreview อยู่แล้วเมื่อมันมีค่า (URL เก่าที่ค้างใน state จะถูกละเว้นไปเอง)
  const effectiveSrc = src || localPreview
  const showBadge = !src && !!localPreview

  if (!effectiveSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 bg-orange-50 text-slate-400 ${className ?? ''}`}
      >
        <span className="text-lg">🕒</span>
        <span className="text-[11px] leading-tight text-center px-1">รอซิงก์รูป</span>
      </div>
    )
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`relative ${className ?? ''}`}>
        <img src={effectiveSrc} alt={alt} className="h-full w-full object-contain" />
        {showBadge && <SyncBadge />}
      </button>
    )
  }
  if (showBadge) {
    return (
      <div className={`relative ${className ?? ''}`}>
        <img src={effectiveSrc} alt={alt} className="h-full w-full object-contain" />
        <SyncBadge />
      </div>
    )
  }
  return <img src={effectiveSrc} alt={alt} className={className} />
}
