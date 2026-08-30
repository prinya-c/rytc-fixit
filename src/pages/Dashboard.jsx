import { useEffect, useState } from 'react'
import { STATUSES, ITEM_CATEGORIES } from '../lib/options'
import { subscribeStats } from '../lib/stats'

const CATEGORY_ICON = { tool_machine: '🔧', appliance: '🔌', vehicle: '🏍️', other: '📦' }

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => subscribeStats(setStats), [])

  const total = stats?.total ?? 0
  const maxStatusCount = Math.max(1, ...STATUSES.map((s) => stats?.byStatus?.[String(s.code)] ?? 0))

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

      <section>
        <h2 className="text-lg font-semibold text-slate-700 mb-3">สรุปงานซ่อมทั้งหมด</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="รายการทั้งหมด" value={total} icon="🗂️" />
          {ITEM_CATEGORIES.map((c) => (
            <StatCard
              key={c.value}
              label={c.label}
              value={stats?.byCategory?.[c.value] ?? 0}
              icon={CATEGORY_ICON[c.value]}
            />
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">สถานะงานซ่อม</h2>
        <div className="space-y-3">
          {STATUSES.map((s) => {
            const count = stats?.byStatus?.[String(s.code)] ?? 0
            const pct = Math.round((count / maxStatusCount) * 100)
            return (
              <div key={s.code} className="flex items-center gap-3">
                <span className="w-6 text-right text-sm font-semibold text-primary">{s.code}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm text-slate-600 mb-1">
                    <span>{s.label}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-orange-50">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${count > 0 ? Math.max(pct, 4) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {stats?.unrepairableCount > 0 && (
          <p className="mt-4 text-sm text-danger">
            รายการที่ซ่อมไม่ได้สะสม: <strong>{stats.unrepairableCount}</strong> รายการ
          </p>
        )}
      </section>
    </div>
  )
}
