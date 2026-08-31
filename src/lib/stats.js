import { doc, increment, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
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

// ใช้ increment() + setDoc(merge:true) แทน runTransaction() เพราะ transaction ต้องอ่าน
// ค่าปัจจุบันจาก server ก่อนเขียนเสมอ จึงใช้งานตอนออฟไลน์ไม่ได้ — increment() เป็นคำสั่ง
// เดลต้าที่ SDK คิวไว้ในเครื่องแล้วส่งไป apply ที่ server เองตอนกลับมาออนไลน์
async function applyStats(delta) {
  const ref = doc(db, 'stats', STATS_ID)
  await setDoc(ref, { ...delta, updatedAt: serverTimestamp() }, { merge: true })
}

export function subscribeStats(callback) {
  const ref = doc(db, 'stats', STATS_ID)
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data() : emptyStats())
  })
}

export async function recordNewRepair(category) {
  await applyStats({
    total: increment(1),
    byCategory: { [category]: increment(1) },
    byStatus: { 1: increment(1) },
    byCategoryStatus: { [category]: { 1: increment(1) } },
  })
}

export async function recordStatusChange(category, oldStatusCode, newStatusCode) {
  if (oldStatusCode === newStatusCode) return
  await applyStats({
    byStatus: { [oldStatusCode]: increment(-1), [newStatusCode]: increment(1) },
    byCategoryStatus: {
      [category]: { [oldStatusCode]: increment(-1), [newStatusCode]: increment(1) },
    },
  })
}

export async function recordUnrepairableChange(delta) {
  await applyStats({ unrepairableCount: increment(delta) })
}

export async function recordDeleteRepair({ category, statusCode, unrepairable }) {
  await applyStats({
    total: increment(-1),
    byCategory: { [category]: increment(-1) },
    byStatus: { [statusCode]: increment(-1) },
    byCategoryStatus: { [category]: { [statusCode]: increment(-1) } },
    ...(unrepairable ? { unrepairableCount: increment(-1) } : {}),
  })
}
