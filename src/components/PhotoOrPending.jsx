/**
 * แสดงรูปถ้ามี URL แล้ว หรือช่องว่างพร้อมข้อความ "รอซิงก์รูป" ถ้ายังอัปโหลดไม่สำเร็จ (คิวไว้ใน
 * เครื่องตอนออฟไลน์ — ดู src/lib/offlineQueue.js) เมื่อกลับมาออนไลน์แล้วรออัปโหลดสำเร็จ รูปจะขึ้น
 * เองอัตโนมัติโดยไม่ต้องรีเฟรชหน้า (ผ่าน onSnapshot ที่หน้าเรียกอยู่แล้ว)
 */
export default function PhotoOrPending({ src, alt, className, onClick }) {
  if (!src) {
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
      <button type="button" onClick={onClick} className={className}>
        <img src={src} alt={alt} className="h-full w-full object-contain" />
      </button>
    )
  }
  return <img src={src} alt={alt} className={className} />
}
