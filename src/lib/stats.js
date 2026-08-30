import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import { STATUSES } from './options'

const STATS_ID = 'summary'

function emptyStats() {
  const byStatus = {}
  STATUSES.forEach((s) => {
    byStatus[String(s.code)] = 0
  })
  return {
    total: 0,
    byCategory: { tool_machine: 0, appliance: 0, vehicle: 0, other: 0 },
    byStatus,
    unrepairableCount: 0,
  }
}

async function adjustStats(mutate) {
  const ref = doc(db, 'stats', STATS_ID)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const current = snap.exists() ? snap.data() : emptyStats()
    const next = mutate({ ...current, byCategory: { ...current.byCategory }, byStatus: { ...current.byStatus } })
    next.updatedAt = serverTimestamp()
    tx.set(ref, next)
  })
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
    return s
  })
}

export async function recordStatusChange(oldStatusCode, newStatusCode) {
  if (oldStatusCode === newStatusCode) return
  await adjustStats((s) => {
    s.byStatus[String(oldStatusCode)] = Math.max(0, (s.byStatus[String(oldStatusCode)] ?? 0) - 1)
    s.byStatus[String(newStatusCode)] = (s.byStatus[String(newStatusCode)] ?? 0) + 1
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
    if (unrepairable) {
      s.unrepairableCount = Math.max(0, (s.unrepairableCount ?? 0) - 1)
    }
    return s
  })
}
