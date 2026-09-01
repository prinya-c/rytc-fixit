import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { changeRepairStatus, saveAssessment, subscribeRepair } from '../lib/repairs'
import { DAMAGE_LEVELS, ITEM_CATEGORIES, STATUSES, UNREPAIRABLE_REASONS, VEHICLE_TYPES } from '../lib/options'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'

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

export default function RepairAssess() {
  const { id } = useParams()
  const { user, staffProfile } = useAuth()
  const navigate = useNavigate()

  const [repair, setRepair] = useState(undefined)
  const [inspectionNotes, setInspectionNotes] = useState('')
  const [causeNote, setCauseNote] = useState('')
  const [damageLevel, setDamageLevel] = useState('minor')
  const [nextStatus, setNextStatus] = useState(3)
  const [unrepairable, setUnrepairable] = useState(false)
  const [reason, setReason] = useState(UNREPAIRABLE_REASONS[0])
  const [reasonNote, setReasonNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const unsub = subscribeRepair(id, (data) => {
      setRepair(data)
      if (data) setNextStatus(Math.max(data.status, 3))
    })
    return unsub
  }, [id])

  if (repair === undefined) return <p className="text-center text-slate-400 py-10">กำลังโหลด...</p>
  if (repair === null) return <p className="text-center text-danger py-10">ไม่พบรายการนี้</p>

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await saveAssessment(id, {
        inspectionNotes,
        damageLevel,
        causeNote,
        staffUid: user.uid,
        staffName: staffProfile.fullName,
      })
      await changeRepairStatus(id, {
        newStatus: Number(nextStatus),
        note: 'บันทึกผลคัดแยก/ประเมิน',
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
      <h1 className="text-xl font-bold text-slate-800">คัดแยก/ประเมินความเสียหาย</h1>
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
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 space-y-4">
        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ระดับความเสียหาย</label>
          <select value={damageLevel} onChange={(e) => setDamageLevel(e.target.value)} className={inputClass}>
            {DAMAGE_LEVELS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">บันทึกผลการตรวจสภาพเบื้องต้น</label>
          <textarea
            rows={3}
            value={inspectionNotes}
            onChange={(e) => setInspectionNotes(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">สาเหตุเกิดจาก</label>
          <textarea
            rows={2}
            placeholder="เช่น ใช้งานมานาน, แช่น้ำท่วม, ขาดการบำรุงรักษา"
            value={causeNote}
            onChange={(e) => setCauseNote(e.target.value)}
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={unrepairable}
            onChange={(e) => {
              const checked = e.target.checked
              setUnrepairable(checked)
              if (checked) setNextStatus(8)
            }}
            className="h-4 w-4"
          />
          ไม่สามารถซ่อมได้
        </label>

        {unrepairable ? (
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
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ส่งต่อไปสถานะ</label>
            <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} className={inputClass}>
              {STATUSES.filter((s) => s.code >= 2).map((s) => (
                <option key={s.code} value={s.code}>
                  {s.code}. {s.label}
                </option>
              ))}
            </select>
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
    </div>
  )
}
