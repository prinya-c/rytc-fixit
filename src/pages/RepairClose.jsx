import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PhotoCaptureInput from '../components/PhotoCaptureInput'
import PhotoLightbox from '../components/PhotoLightbox'
import PhotoOrPending from '../components/PhotoOrPending'
import { closeRepair, subscribeRepair } from '../lib/repairs'
import { uploadOrQueuePhoto } from '../lib/offlineQueue'
import { ITEM_CATEGORIES, VEHICLE_TYPES } from '../lib/options'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'

const INTAKE_SLOTS = ['item1', 'item2', 'person']

function categoryLabel(item) {
  if (!item) return ''
  const cat = ITEM_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category
  if (item.category === 'vehicle') {
    const v = VEHICLE_TYPES.find((t) => t.value === item.vehicleType)?.label
    return v ? `${cat} (${v})` : cat
  }
  if (item.itemName) return `${cat}: ${item.itemName}`
  return cat
}

export default function RepairClose() {
  const { id } = useParams()
  const { user, staffProfile } = useAuth()
  const navigate = useNavigate()

  const [repair, setRepair] = useState(undefined)
  const [itemPhoto, setItemPhoto] = useState(null)
  const [personPhoto, setPersonPhoto] = useState(null)
  const [receiverName, setReceiverName] = useState('')
  const [receiverRelation, setReceiverRelation] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  useEffect(() => {
    const unsub = subscribeRepair(id, (data) => {
      setRepair(data)
      if (data?.requester?.fullName) setReceiverName((prev) => prev || data.requester.fullName)
    })
    return unsub
  }, [id])

  if (repair === undefined) return <p className="text-center text-slate-400 py-10">กำลังโหลด...</p>
  if (repair === null) return <p className="text-center text-danger py-10">ไม่พบรายการนี้</p>

  // แสดงครบ 3 ช่องเสมอ (ไม่กรอง null ทิ้ง) เพื่อให้เห็นว่ารูปไหนยังรอซิงก์จากคิวออฟไลน์อยู่
  const intakePhotos = [
    repair.photosIntake?.itemPhotos?.[0] ?? null,
    repair.photosIntake?.itemPhotos?.[1] ?? null,
    repair.photosIntake?.personPhoto ?? null,
  ]

  async function handleSubmit(e) {
    e.preventDefault()
    if (!itemPhoto || !personPhoto) {
      setError('กรุณาถ่ายรูปสิ่งของและรูปผู้รับคืนให้ครบ')
      return
    }
    if (!receiverName.trim()) {
      setError('กรุณากรอกชื่อผู้รับคืน')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const [itemPhotoUrl, personPhotoUrl] = await Promise.all([
        uploadOrQueuePhoto({ repairId: id, kind: 'closure', slot: 'item', subPath: 'closure/item.jpg', file: itemPhoto }),
        uploadOrQueuePhoto({ repairId: id, kind: 'closure', slot: 'person', subPath: 'closure/person.jpg', file: personPhoto }),
      ])
      await closeRepair(id, {
        itemPhoto: itemPhotoUrl,
        personPhoto: personPhotoUrl,
        receiverName: receiverName.trim(),
        receiverRelation: receiverRelation.trim(),
        staffUid: user.uid,
        staffName: staffProfile.fullName,
      })
      navigate(`/repairs/${id}`)
    } catch (err) {
      setError(err.message || 'บันทึกไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-slate-800">ปิดงาน / ส่งมอบคืน</h1>
      <p className="text-sm text-slate-500">{repair.requester?.fullName} · รหัสรายการ {repair.id}</p>

      <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 space-y-1 text-sm text-slate-600">
        <p className="text-slate-800 font-medium">{categoryLabel(repair.item)}</p>
        {repair.item?.brand && <p>ยี่ห้อ: {repair.item.brand}</p>}
        {repair.intakeCondition?.symptoms?.length > 0 && (
          <p>อาการที่เสีย: {repair.intakeCondition.symptoms.join(', ')}</p>
        )}
        {repair.intakeCondition?.condition?.length > 0 && (
          <p>สภาพ: {repair.intakeCondition.condition.join(', ')}</p>
        )}
        {repair.intakeCondition?.accessories?.length > 0 && (
          <p>อุปกรณ์ที่ติดมาด้วย: {repair.intakeCondition.accessories.join(', ')}</p>
        )}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {intakePhotos.map((url, i) => (
            <PhotoOrPending
              key={i}
              src={url}
              alt=""
              repairId={id}
              kind="intake"
              slot={INTAKE_SLOTS[i]}
              onClick={url ? () => setLightboxUrl(url) : undefined}
              className="h-28 w-full rounded-md overflow-hidden cursor-zoom-in bg-orange-50"
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 space-y-4">
        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PhotoCaptureInput label="รูปสิ่งของที่ส่งคืน" file={itemPhoto} onChange={setItemPhoto} required />
          <PhotoCaptureInput
            label="รูปผู้รับคืนคู่กับสิ่งของ"
            file={personPhoto}
            onChange={setPersonPhoto}
            capture="user"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุลผู้รับคืน *</label>
          <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            ความเกี่ยวข้องกับเจ้าของ (กรณีมารับแทน)
          </label>
          <input
            placeholder="เช่น บุตร, ญาติ, ตัวแทน"
            value={receiverRelation}
            onChange={(e) => setReceiverRelation(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-success hover:bg-success-hover text-white rounded-md py-2.5 font-medium disabled:opacity-60"
          >
            {submitting ? 'กำลังบันทึก...' : 'ยืนยันส่งมอบคืน'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/repairs/${id}`)}
            className="rounded-md border border-slate-300 px-5 py-2.5 text-slate-600 hover:bg-slate-50"
          >
            ยกเลิก
          </button>
        </div>
      </form>

      <PhotoLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  )
}
