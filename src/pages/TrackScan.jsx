import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QrScanner from '../components/QrScanner'

function extractPublicId(text) {
  const match = text.match(/\/track\/([^/?#]+)/)
  if (match) return match[1]
  if (/^[A-Za-z0-9_-]+$/.test(text.trim())) return text.trim()
  return null
}

export default function TrackScan() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  async function handleDecode(decodedText) {
    const publicId = extractPublicId(decodedText)
    if (!publicId) {
      setError('QR นี้ไม่ใช่ QR ติดตามสถานะของ RYTC-FixIT')
      return false
    }
    navigate(`/track/${publicId}`)
    return true
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4 text-center">
      <h1 className="text-xl font-bold text-slate-800">สแกน QR เพื่อติดตามสถานะ</h1>
      <p className="text-sm text-slate-500">
        สแกน QR ที่มุมล่างของใบลงทะเบียนรับซ่อม เพื่อดูสถานะงานซ่อมของท่าน
      </p>
      <QrScanner onDecode={handleDecode} onCameraError={(err) => setError(`ไม่สามารถเปิดกล้องได้: ${err}`)} />
      {error && (
        <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
      )}
      <button type="button" onClick={() => navigate('/')} className="text-sm text-slate-500 hover:underline">
        กลับหน้าแรก
      </button>
    </div>
  )
}
