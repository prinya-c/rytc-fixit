import { useEffect, useMemo, useState } from 'react'
import StatusBadge from '../components/StatusBadge'
import { STATUSES, ITEM_CATEGORIES, VEHICLE_TYPES } from '../lib/options'
import { subscribePublicRepairs } from '../lib/repairs'
import { subscribeStats } from '../lib/stats'

const CATEGORY_ICON = { tool_machine: '🔧', appliance: '🔌', vehicle: '🏍️', other: '📦' }

function categoryLabel(item) {
  const cat = ITEM_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category
  if (item.category === 'vehicle') {
    const v = VEHICLE_TYPES.find((t) => t.value === item.vehicleType)?.label
    return v ? `${cat} (${v})` : cat
  }
  return cat
}

function formatDate(ts) {
  if (!ts?.toDate) return '-'
  return ts.toDate().toLocaleDateString('th-TH', { dateStyle: 'medium' })
}

function countFor(stats, category, statusCode) {
  if (category && statusCode) {
    return stats?.byCategoryStatus?.[category]?.[String(statusCode)] ?? 0
  }
  if (category) return stats?.byCategory?.[category] ?? 0
  if (statusCode) return stats?.byStatus?.[String(statusCode)] ?? 0
  return stats?.total ?? 0
}

function StatCard({ icon, label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl shadow-sm border p-4 flex items-center gap-3 transition-colors ${
        active
          ? 'bg-primary border-primary text-white'
          : 'bg-white border-orange-100 hover:border-primary/40 hover:shadow-md'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`text-2xl font-bold ${active ? 'text-white' : 'text-slate-800'}`}>{value}</p>
        <p className={`text-sm ${active ? 'text-white/90' : 'text-slate-500'}`}>{label}</p>
      </div>
    </button>
  )
}

function StatusCard({ status, count, maxCount, active, onClick }) {
  const pct = Math.round((count / maxCount) * 100)
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl shadow-sm border p-4 flex flex-col gap-2 transition-colors ${
        active ? 'bg-primary border-primary text-white' : 'bg-white border-orange-100 hover:border-primary/40 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            active ? 'bg-white/20 text-white' : 'bg-primary-light text-primary'
          }`}
        >
          {status.code}
        </span>
        <span className={`text-xl font-bold ${active ? 'text-white' : 'text-slate-800'}`}>{count}</span>
      </div>
      <p className={`text-sm leading-snug ${active ? 'text-white/90' : 'text-slate-600'}`}>{status.label}</p>
      <div className={`h-1.5 rounded-full mt-auto ${active ? 'bg-white/20' : 'bg-orange-50'}`}>
        <div
          className={`h-1.5 rounded-full transition-all ${active ? 'bg-white' : 'bg-primary'}`}
          style={{ width: `${count > 0 ? Math.max(pct, 4) : 0}%` }}
        />
      </div>
    </button>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [drilldownItems, setDrilldownItems] = useState(null)

  useEffect(() => subscribeStats(setStats), [])

  const hasFilter = Boolean(selectedCategory || selectedStatus)

  useEffect(() => {
    if (!hasFilter) {
      setDrilldownItems(null)
      return undefined
    }
    setDrilldownItems(null)
    return subscribePublicRepairs(
      { category: selectedCategory || undefined, status: selectedStatus || undefined },
      setDrilldownItems,
    )
  }, [selectedCategory, selectedStatus, hasFilter])

  const filteredTotal = countFor(stats, selectedCategory, selectedStatus)
  const maxStatusCount = Math.max(
    1,
    ...STATUSES.map((s) => countFor(stats, selectedCategory, s.code)),
  )

  const filterLabel = useMemo(() => {
    const parts = []
    if (selectedCategory) parts.push(ITEM_CATEGORIES.find((c) => c.value === selectedCategory)?.label)
    if (selectedStatus) parts.push(`สถานะ ${selectedStatus}. ${STATUSES.find((s) => s.code === selectedStatus)?.label}`)
    return parts.join(' × ')
  }, [selectedCategory, selectedStatus])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
        <h1 className="text-2xl font-bold text-primary">RYTC-Fix</h1>
        <p className="text-slate-600 mt-1">
          ระบบติดตามงานซ่อม โครงการ <strong>อาชีวะอาสา! ศูนย์ซ่อมสร้างเพื่อชุมชน (Fix it Center)</strong>{' '}
          วิทยาลัยเทคนิคระยอง — ให้บริการซ่อมเครื่องมือ เครื่องใช้ไฟฟ้า เครื่องจักรกลการเกษตร
          และยานพาหนะแก่ประชาชนโดยไม่คิดค่าใช้จ่าย พร้อมถ่ายทอดความรู้การดูแลรักษาเบื้องต้น
        </p>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-700">
          {hasFilter ? `กำลังกรอง: ${filterLabel}` : 'สรุปงานซ่อมทั้งหมด'}
        </h2>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('')
              setSelectedStatus(null)
            }}
            className="text-sm text-primary hover:underline"
          >
            ✕ ล้างตัวกรอง (ดูทั้งหมด {stats?.total ?? 0} รายการ)
          </button>
        )}
      </div>

      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            icon="🗂️"
            label={hasFilter ? 'รวมตามตัวกรอง' : 'รายการทั้งหมด'}
            value={filteredTotal}
            active={false}
            onClick={() => {
              setSelectedCategory('')
              setSelectedStatus(null)
            }}
          />
          {ITEM_CATEGORIES.map((c) => (
            <StatCard
              key={c.value}
              icon={CATEGORY_ICON[c.value]}
              label={c.label}
              value={countFor(stats, c.value, selectedStatus)}
              active={selectedCategory === c.value}
              onClick={() => setSelectedCategory((prev) => (prev === c.value ? '' : c.value))}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-3">สถานะงานซ่อม</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {STATUSES.map((s) => (
            <StatusCard
              key={s.code}
              status={s}
              count={countFor(stats, selectedCategory, s.code)}
              maxCount={maxStatusCount}
              active={selectedStatus === s.code}
              onClick={() => setSelectedStatus((prev) => (prev === s.code ? null : s.code))}
            />
          ))}
        </div>
        {stats?.unrepairableCount > 0 && (
          <p className="mt-4 text-sm text-danger">
            รายการที่ซ่อมไม่ได้สะสม: <strong>{stats.unrepairableCount}</strong> รายการ
          </p>
        )}
      </section>

      {hasFilter && (
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-1">รายการที่ตรงกับตัวกรอง</h2>
          <p className="text-xs text-slate-400 mb-4">
            แสดงเฉพาะรูปสิ่งของ ประเภท และสถานะ — ไม่มีชื่อ เบอร์โทร หรือข้อมูลส่วนบุคคลของผู้ขอรับบริการ
          </p>
          {drilldownItems === null && <p className="text-slate-400 text-center py-6">กำลังโหลด...</p>}
          {drilldownItems !== null && drilldownItems.length === 0 && (
            <p className="text-slate-400 text-center py-6">ไม่พบรายการที่ตรงกับตัวกรองนี้</p>
          )}
          {drilldownItems !== null && drilldownItems.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {drilldownItems.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-orange-100 overflow-hidden bg-white"
                >
                  <img
                    src={r.itemPhoto}
                    alt={categoryLabel(r)}
                    className="h-28 w-full object-cover bg-orange-50"
                  />
                  <div className="p-2.5 space-y-1">
                    <StatusBadge status={r.status} unrepairable={r.unrepairable} />
                    <p className="text-sm text-slate-700">{categoryLabel(r)}</p>
                    <p className="text-xs text-slate-400">ลงทะเบียน {formatDate(r.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <p className="text-xs text-slate-400 text-center">
        คลิกการ์ดเพื่อเจาะลึกตัวเลข (กดซ้ำ หรือกด "ล้างตัวกรอง" เพื่อกลับไปดูภาพรวม)
      </p>
    </div>
  )
}
