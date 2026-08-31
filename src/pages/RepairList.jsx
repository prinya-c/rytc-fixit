import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PhotoOrPending from '../components/PhotoOrPending'
import StatusBadge from '../components/StatusBadge'
import { subscribeRepairs } from '../lib/repairs'
import { ITEM_CATEGORIES, STATUSES } from '../lib/options'

function categoryLabel(category) {
  return ITEM_CATEGORIES.find((c) => c.value === category)?.label ?? category
}

export default function RepairList() {
  const [searchParams] = useSearchParams()
  const [repairs, setRepairs] = useState(null)
  const [search, setSearch] = useState('')
  // ค่าเริ่มต้นมาจาก query string ได้ (เช่น ลิงก์ drilldown จาก Dashboard: /repairs?status=3
  // หรือ /repairs?category=vehicle) — จากนั้นเจ้าหน้าที่ปรับตัวกรองเองต่อได้ตามปกติ
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '')
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') || '')

  useEffect(() => subscribeRepairs(setRepairs), [])

  const filtered = useMemo(() => {
    if (!repairs) return []
    const term = search.trim().toLowerCase()
    return repairs.filter((r) => {
      if (statusFilter && String(r.status) !== statusFilter) return false
      if (categoryFilter && r.item?.category !== categoryFilter) return false
      if (!term) return true
      return (
        r.requester?.fullName?.toLowerCase().includes(term) ||
        r.requester?.phone?.includes(term) ||
        r.requester?.nationalId?.includes(term)
      )
    })
  }, [repairs, search, statusFilter, categoryFilter])

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">รายการงานซ่อม</h1>
        <Link
          to="/repairs/new"
          className="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2 text-sm font-medium"
        >
          + ลงทะเบียนใหม่
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          placeholder="ค้นหาชื่อ/เบอร์โทร/เลขบัตรประชาชน"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[220px] rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">ทุกประเภท</option>
          {ITEM_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">ทุกสถานะ</option>
          {STATUSES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.code}. {s.label}
            </option>
          ))}
        </select>
        {(statusFilter || categoryFilter || search) && (
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setStatusFilter('')
              setCategoryFilter('')
            }}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {repairs === null && <p className="text-slate-400 text-center py-10">กำลังโหลด...</p>}
      {repairs !== null && filtered.length === 0 && (
        <p className="text-slate-400 text-center py-10">ไม่พบรายการ</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => (
          <Link
            key={r.id}
            to={`/repairs/${r.id}`}
            className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden hover:shadow-md transition-shadow"
          >
            <PhotoOrPending
              src={r.photosIntake?.itemPhotos?.[0]}
              alt={r.requester?.fullName}
              className="h-36 w-full object-contain bg-orange-50"
            />
            <div className="p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-slate-800 truncate">{r.requester?.fullName}</p>
                <StatusBadge status={r.status} unrepairable={r.unrepairable} />
              </div>
              <p className="text-sm text-slate-500">{categoryLabel(r.item?.category)}</p>
              <p className="text-xs text-slate-400">โทร {r.requester?.phone}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
