/** แสดงรูปขนาดใหญ่แบบเต็มจอ เมื่อ src มีค่า — แตะที่ไหนก็ได้เพื่อปิด */
export default function PhotoLightbox({ src, onClose }) {
  if (!src) return null

  return (
    <div
      className="no-print fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="ปิด"
        className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white text-2xl flex items-center justify-center hover:bg-white/20"
      >
        ✕
      </button>
      <img src={src} alt="" className="max-h-full max-w-full object-contain rounded-md" />
    </div>
  )
}
