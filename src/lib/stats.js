import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { ITEM_CATEGORIES, STATUSES } from './options'

const STATS_ID = 'summary'

function emptyStatusCounts() {
  const byStatus = {}
  STATUSES.forEach((s) => {
    byStatus[String(s.code)] = 0
  })
  return byStatus
}

function emptyStats() {
  const byCategoryStatus = {}
  ITEM_CATEGORIES.forEach((c) => {
    byCategoryStatus[c.value] = emptyStatusCounts()
  })
  return {
    total: 0,
    byCategory: { tool_machine: 0, appliance: 0, vehicle: 0, other: 0 },
    byStatus: emptyStatusCounts(),
    // เมทริกซ์ประเภท×สถานะ ใช้ทำ drilldown บน Dashboard แบบไขว้กัน (cross-filter)
    // โดยไม่ต้องอ่าน collection repairs ตรงๆ (ซึ่งมีข้อมูลส่วนบุคคล ต้องล็อกอินก่อน) —
    // stats/summary เป็น doc เดียวที่ Firestore Rules เปิด read สาธารณะไว้
    byCategoryStatus,
    unrepairableCount: 0,
  }
}

async function adjustStats(mutate) {
  const ref = doc(db, 'stats', STATS_ID)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const current = snap.exists() ? snap.data() : emptyStats()
    const next = mutate({
      ...current,
      byCategory: { ...current.byCategory },
      byStatus: { ...current.byStatus },
      byCategoryStatus: Object.fromEntries(
        ITEM_CATEGORIES.map((c) => [c.value, { ...(current.byCategoryStatus?.[c.value] ?? emptyStatusCounts()) }]),
      ),
    })
    next.updatedAt = serverTimestamp()
    tx.set(ref, next)
  })
}

function bumpMatrix(s, category, statusCode, delta) {
  if (!s.byCategoryStatus[category]) s.byCategoryStatus[category] = emptyStatusCounts()
  const key = String(statusCode)
  s.byCategoryStatus[category][key] = Math.max(0, (s.byCategoryStatus[category][key] ?? 0) + delta)
}

export function subscribeStats(callback) {
  const ref = doc(db, 'stats', STATS_ID)
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : emptyStats())
  })
}

export async function recordNewRepair(category) {
  await adjustStats((s) => {
    s.total = (s.total ?? 0) + 1
    s.byCategory[category] = (s.byCategory[category] ?? 0) + 1
    s.byStatus['1'] = (s.byStatus['1'] ?? 0) + 1
    bumpMatrix(s, category, 1, 1)
    return s
  })
}

export async function recordStatusChange(category, oldStatusCode, newStatusCode) {
  if (oldStatusCode === newStatusCode) return
  await adjustStats((s) => {
    s.byStatus[String(oldStatusCode)] = Math.max(0, (s.byStatus[String(oldStatusCode)] ?? 0) - 1)
    s.byStatus[String(newStatusCode)] = (s.byStatus[String(newStatusCode)] ?? 0) + 1
    bumpMatrix(s, category, oldStatusCode, -1)
    bumpMatrix(s, category, newStatusCode, 1)
    return s
  })
}

export async function recordUnrepairableChange(delta) {
  await adjustStats((s) => {
    s.unrepairableCount = Math.max(0, (s.unrepairableCount ?? 0) + delta)
    return s
  })
}

export async function recordDeleteRepair({ category, statusCode, unrepairable }) {
  await adjustStats((s) => {
    s.total = Math.max(0, (s.total ?? 0) - 1)
    s.byCategory[category] = Math.max(0, (s.byCategory[category] ?? 0) - 1)
    s.byStatus[String(statusCode)] = Math.max(0, (s.byStatus[String(statusCode)] ?? 0) - 1)
    bumpMatrix(s, category, statusCode, -1)
    if (unrepairable) {
      s.unrepairableCount = Math.max(0, (s.unrepairableCount ?? 0) - 1)
    }
    return s
  })
}
