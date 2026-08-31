import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PhotoLightbox from '../components/PhotoLightbox'
import StatusBadge from '../components/StatusBadge'
import { deleteRepair, subscribeRepair, subscribeStatusLogs } from '../lib/repairs'
import { ITEM_CATEGORIES, VEHICLE_TYPES } from '../lib/options'

function categoryLabel(item) {
  if (!item) return ''
  const cat = ITEM_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category
  if (item.category === 'vehicle') {
    const v = VEHICLE_TYPES.find((t) => t.value === item.vehicleType)?.label
    return v ? `${cat} (${v})` : cat
  }
  if (item.category === 'other' && item.otherDetail) return `${cat}: ${item.otherDetail}`
  return cat
}

function formatDate(ts) {
  if (!ts?.toDate) return '-'
  return ts.toDate().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
}

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 space-y-2">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  )
}

export default function RepairDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [repair, setRepair] = useState(undefined)
  const [logs, setLogs] = useState([])
  const [deleting, setDeleting] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  useEffect(() => subscribeRepair(id, setRepair), [id])
  useEffect(() => subscribeStatusLogs(id, setLogs), [id])

  async function handleDelete() {
    if (!window.confirm('ยืนยันลบรายการนี้? การลบไม่สามารถกู้คืนได้')) return
    setDeleting(true)
    try {
      await deleteRepair(id)
      navigate('/repairs', { replace: true })
    } catch (err) {
      window.alert(err.message || 'ลบไม่สำเร็จ')
      setDeleting(false)
    }
  }

  if (repair === undefined) return <p className="text-center text-slate-400 py-10">กำลังโหลด...</p>
  if (repair === null) return <p className="text-center text-danger py-10">ไม่พบรายการนี้</p>

  const allPhotos = [...(repair.photosIntake?.itemPhotos ?? []), repair.photosIntake?.personPhoto].filter(Boolean)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{repair.requester?.fullName}</h1>
          <p className="text-xs text-slate-400">รหัสรายการ: {repair.id}</p>
        </div>
        <StatusBadge status={repair.status} unrepairable={repair.unrepairable} className="text-sm px-3 py-1.5" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          to={`/repairs/${id}/print`}
          className="rounded-md bg-primary hover:bg-primary-hover text-white px-3 py-2 text-sm font-medium"
        >
          🖨️ พิมพ์ใบลงทะเบียน
        </Link>
        <Link
          to={`/repairs/${id}/assess`}
          className="rounded-md border border-primary text-primary px-3 py-2 text-sm font-medium hover:bg-orange-50"
        >
          คัดแยก/ประเมิน
        </Link>
        <Link
          to={`/repairs/${id}/status`}
          className="rounded-md border border-primary text-primary px-3 py-2 text-sm font-medium hover:bg-orange-50"
        >
          อัปเดตสถานะ
        </Link>
        <Link
          to={`/repairs/${id}/close`}
          className="rounded-md border border-success text-success px-3 py-2 text-sm font-medium hover:bg-green-50"
        >
          ปิดงาน/ส่งมอบ
        </Link>
        {repair.status === 8 && (
          <Link
            to={`/repairs/${id}/report`}
            className="rounded-md bg-success hover:bg-success-hover text-white px-3 py-2 text-sm font-medium"
          >
            🖨️ พิมพ์ใบรายงานซ่อม
          </Link>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md border border-danger text-danger px-3 py-2 text-sm font-medium hover:bg-red-50 disabled:opacity-60"
        >
          {deleting ? 'กำลังลบ...' : 'ลบรายการ'}
        </button>
      </div>

      <Section title="ผู้ขอรับบริการ">
        <p>เลขบัตรประชาชน: {repair.requester?.nationalId}</p>
        <p>โทรศัพท์: {repair.requester?.phone}</p>
      </Section>

      <Section title="สิ่งของที่นำมาซ่อม">
        <p>ประเภท: {categoryLabel(repair.item)}</p>
        {repair.item?.registrationNo && <p>เลขทะเบียน: {repair.item.registrationNo}</p>}
        <div className="text-sm text-slate-600 space-y-1 pt-1">
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
        {allPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            {allPhotos.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightboxUrl(url)}
                className="h-24 w-full rounded-md overflow-hidden cursor-zoom-in"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title="เจ้าหน้าที่รับลงทะเบียน">
        <p>{repair.intake?.staffName} · {repair.intake?.staffPhone}</p>
        <p className="text-xs text-slate-400">ลงทะเบียนเมื่อ {formatDate(repair.intake?.registeredAt)}</p>
      </Section>

      {repair.assessment && (
        <Section title="ผลคัดแยก/ประเมิน">
          <p>ระดับความเสียหาย: {repair.assessment.damageLevel}</p>
          <p>บันทึกเพิ่มเติม: {repair.assessment.inspectionNotes || '-'}</p>
          <p className="text-xs text-slate-400">
            โดย {repair.assessment.assessedByName} เมื่อ {formatDate(repair.assessment.assessedAt)}
          </p>
        </Section>
      )}

      {repair.unrepairable && (
        <Section title="ไม่สามารถซ่อมได้">
          <p>เหตุผล: {repair.unrepairableReason}</p>
          {repair.unrepairableNote && <p>รายละเอียดเพิ่มเติม: {repair.unrepairableNote}</p>}
        </Section>
      )}

      {repair.closure && (
        <Section title="ปิดงาน/ส่งมอบคืน">
          <p>ผู้รับคืน: {repair.closure.receiverName}</p>
          {repair.closure.receiverRelation && <p>ความเกี่ยวข้อง: {repair.closure.receiverRelation}</p>}
          <p className="text-xs text-slate-400">
            โดย {repair.closure.closedByName} เมื่อ {formatDate(repair.closure.closedAt)}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-2 max-w-xs">
            {[repair.closure.itemPhoto, repair.closure.personPhoto].filter(Boolean).map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setLightboxUrl(url)}
                className="h-24 w-full rounded-md overflow-hidden cursor-zoom-in"
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title="ประวัติการเปลี่ยนสถานะ">
        {logs.length === 0 && <p className="text-sm text-slate-400">ยังไม่มีประวัติ</p>}
        <ol className="space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="text-sm border-l-2 border-primary pl-3">
              <p className="font-medium text-slate-700">
                {log.status}. {log.statusLabel}
              </p>
              {log.note && <p className="text-slate-500">{log.note}</p>}
              {log.reasonNote && <p className="text-danger">เหตุผล: {log.reasonNote}</p>}
              <p className="text-xs text-slate-400">
                {log.changedByName} · {formatDate(log.changedAt)}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <PhotoLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  )
}
