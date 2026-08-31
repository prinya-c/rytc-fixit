import { useEffect, useMemo } from 'react'

/** ปุ่มถ่ายรูปจากกล้อง/แกลเลอรี พร้อม preview รูปที่เลือก */
export default function PhotoCaptureInput({ label, file, onChange, capture = 'environment', required }) {
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <label className="relative flex flex-col items-center justify-center gap-1 border-2 border-dashed border-orange-200 rounded-lg h-32 cursor-pointer bg-orange-50/60 hover:bg-orange-50 overflow-hidden text-primary">
        {previewUrl ? (
          <img src={previewUrl} alt={label} className="h-full w-full object-contain" />
        ) : (
          <>
            <span className="text-3xl">📷</span>
            <span className="text-xs">แตะเพื่อถ่ายรูป</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          capture={capture}
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
    </div>
  )
}
