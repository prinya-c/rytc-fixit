import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PhotoLightbox from '../components/PhotoLightbox'
import PhotoOrPending from '../components/PhotoOrPending'
import { useAuth } from '../context/AuthContext'
import { changeRepairStatus, saveQualityCheck, subscribeRepair } from '../lib/repairs'
import { subscribeTechnicians } from '../lib/technicians'
import {
  ITEM_CATEGORIES,
  STATUSES_SELECTABLE,
  UNREPAIRABLE_REASONS,
  VEHICLE_TYPES,
  suggestRepairStatus,
} from '../lib/options'

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

function defaultNextStatus(repair) {
  if (repair.status === 3) return suggestRepairStatus(repair.item)
  return Math.min(repair.status + 1, 8)
}

export default function RepairStatus() {
  const { id } = useParams()
  const { user, staffProfile } = useAuth()
  const navigate = useNavigate()

  const [repair, setRepair] = useState(undefined)
  const [nextStatus, setNextStatus] = useState('')
  const [note, setNote] = useState('')
  const [unrepairable, setUnrepairable] = useState(false)
  const [reason, setReason] = useState(UNREPAIRABLE_REASONS[0])
  const [reasonNote, setReasonNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  // ฟิลด์เพิ่มเติมสำหรับใบรายงานซ่อม — กรอกเฉพาะตอนย้ายไปสถานะ "ตรวจสอบคุณภาพ" (7)
  const [technicianId, setTechnicianId] = useState('')
  const [technicianName, setTechnicianName] = useState('')
  const [technicianNationalId, setTechnicianNationalId] = useState('')
  const [department, setDepartment] = useState('')
  const [supervisingTeacher, setSupervisingTeacher] = useState('')
  const [repairDetails, setRepairDetails] = useState('')
  const [technicians, setTechnicians] = useState([])

  useEffect(() => {
    const unsub = subscribeRepair(id, (data) => {
      setRepair(data)
      if (data) {
        setNextStatus(defaultNextStatus(data))
        setUnrepairable(!!data.unrepairable)
        if (data.unrepairableReason) setReason(data.unrepairableReason)
      }
    })
    return unsub
  }, [id])

  // รายชื่อช่างซ่อม (จัดการที่ /technicians) ใช้เลือกให้เติมชื่อ/สาขาวิชาให้อัตโนมัติด้านล่าง
  useEffect(() => subscribeTechnicians(setTechnicians), [])

  if (repair === undefined) return <p className="text-center text-slate-400 py-10">กำลังโหลด...</p>
  if (repair === null) return <p className="text-center text-danger py-10">ไม่พบรายการนี้</p>

  // แสดงครบ 3 ช่องเสมอ (ไม่กรอง null ทิ้ง) เพื่อให้เห็นว่ารูปไหนยังรอซิงก์จากคิวออฟไลน์อยู่
  const intakePhotos = [
    repair.photosIntake?.itemPhotos?.[0] ?? null,
    repair.photosIntake?.itemPhotos?.[1] ?? null,
    repair.photosIntake?.personPhoto ?? null,
  ]

  const isQualityCheck = String(nextStatus) === '7'

  function handleNextStatusChange(value) {
    setNextStatus(value)
    if (String(value) === '7' && !technicianName) {
      setTechnicianName(staffProfile.fullName)
    }
  }

  /** เลือกช่างซ่อมจากรายชื่อที่จัดการไว้ที่ /technicians — เติมชื่อ/สาขาวิชา/เลขบัตรประชาชน (ถ้ามี)
   * ให้อัตโนมัติ (ยังแก้ไขเป็นข้อความเองต่อได้ตามปกติ เผื่อกรณีคนที่ซ่อมจริงยังไม่มีในทะเบียน) */
  function handleTechnicianSelect(techId) {
    setTechnicianId(techId)
    const tech = technicians.find((t) => t.id === techId)
    if (tech) {
      setTechnicianName(tech.fullName)
      setDepartment(tech.deptName)
      if (tech.nationalId) setTechnicianNationalId(tech.nationalId)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isQualityCheck) {
        await saveQualityCheck(id, {
          technicianId: technicianId || null,
          technicianName,
          technicianNationalId,
          department,
          supervisingTeacher,
          repairDetails,
          staffUid: user.uid,
          staffName: staffProfile.fullName,
        })
      }
      await changeRepairStatus(id, {
        newStatus: Number(nextStatus),
        note,
        unrepairable,
        unrepairableReason: unrepairable ? reason : null,
        unrepairableNote: unrepairable ? reasonNote : null,
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
      <h1 className="text-xl font-bold text-slate-800">อัปเดตสถานะงานซ่อม</h1>
      <p className="text-sm text-slate-500">
        {repair.requester?.fullName} · สถานะปัจจุบัน: {repair.status}. {repair.statusLabel}
      </p>

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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">สถานะใหม่</label>
          <select
            value={nextStatus}
            onChange={(e) => handleNextStatusChange(e.target.value)}
            className={inputClass}
          >
            {STATUSES_SELECTABLE.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code}. {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">บันทึกเพิ่มเติม</label>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </div>

        {isQualityCheck && (
          <div className="space-y-3 rounded-md bg-orange-50 border border-orange-200 p-3">
            <p className="text-sm font-medium text-slate-700">
              ข้อมูลผู้ดำเนินการซ่อม/ตรวจเช็ค (สำหรับพิมพ์ใบรายงานซ่อมตอนปิดงาน)
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">เลือกช่างซ่อม</label>
              <select
                value={technicianId}
                onChange={(e) => handleTechnicianSelect(e.target.value)}
                className={inputClass}
              >
                <option value="">-- เลือกจากทะเบียนช่างซ่อม (หรือกรอกเองด้านล่าง) --</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} · {t.deptName}
                  </option>
                ))}
              </select>
              {technicians.length === 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  ยังไม่มีรายชื่อในทะเบียน — เพิ่มได้ที่เมนู "ช่างซ่อม" หรือกรอกเองด้านล่างไปก่อนได้
                </p>
              )}
            </div>
            {/* ซ่อนฟิลด์เหล่านี้เมื่อเลือกช่างซ่อมจากทะเบียนแล้ว (ชื่อ/สาขาวิชาก็เห็นอยู่แล้วใน
                ดรอปดาวน์ด้านบน) แสดงเฉพาะตอนยังไม่ได้เลือก ให้กรอกเองได้เผื่อคนที่ซ่อมจริงยังไม่มี
                ในทะเบียน — ค่าที่เติมไว้แล้วจากการเลือกยังถูกบันทึกไปด้วยตามปกติแม้ไม่แสดงในฟอร์ม */}
            {!technicianId && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อ-นามสกุล</label>
                  <input
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">เลขบัตรประชาชน</label>
                  <input
                    value={technicianNationalId}
                    onChange={(e) => setTechnicianNationalId(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    maxLength={13}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">สาขาวิชา</label>
                  <input
                    placeholder="เช่น ช่างยนต์, ช่างไฟฟ้า"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">ครูสาขาวิชา</label>
                  <input
                    value={supervisingTeacher}
                    onChange={(e) => setSupervisingTeacher(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">รายละเอียดการซ่อม</label>
              <textarea
                rows={3}
                placeholder="สรุปสิ่งที่ซ่อม/เปลี่ยนอะไหล่/แก้ไขอะไรไปบ้าง"
                value={repairDetails}
                onChange={(e) => setRepairDetails(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={unrepairable}
            onChange={(e) => setUnrepairable(e.target.checked)}
            className="h-4 w-4"
          />
          ไม่สามารถซ่อมได้
        </label>

        {unrepairable && (
          <div className="space-y-3 rounded-md bg-red-50 border border-red-200 p-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เหตุผลที่ซ่อมไม่ได้</label>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
                {UNREPAIRABLE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียดเพิ่มเติม</label>
              <input value={reasonNote} onChange={(e) => setReasonNote(e.target.value)} className={inputClass} />
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-md py-2.5 font-medium disabled:opacity-60"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
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
