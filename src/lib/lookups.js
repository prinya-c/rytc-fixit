import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

/**
 * dept/position เป็น collection ข้อมูลอ้างอิงคงที่ (สาขาวิชา/ตำแหน่งเจ้าหน้าที่) ที่แอดมินเพิ่ม/
 * แก้ผ่าน Firebase Console เท่านั้น ไม่มีหน้าจัดการในแอป — แคชไว้ในเครื่องระหว่าง session เพราะ
 * ข้อมูลมีจำนวนน้อยและแทบไม่เปลี่ยน
 *
 * โครงสร้างจริงใน Firestore:
 *   dept/{randomId}      -> { "dept-name": string }
 *   position/{code}      -> { "staff-position": string }   (doc id เช่น "1001", "1002", ...)
 */
let cache = null

async function loadLookups() {
  if (cache) return cache
  const [deptSnap, positionSnap] = await Promise.all([
    getDocs(collection(db, 'dept')),
    getDocs(collection(db, 'position')),
  ])
  const depts = deptSnap.docs
    .map((d) => ({ id: d.id, name: d.data()['dept-name'] ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name, 'th'))
  const positions = positionSnap.docs
    .map((d) => ({ id: d.id, name: d.data()['staff-position'] ?? '' }))
    .sort((a, b) => a.id.localeCompare(b.id))
  cache = { depts, positions }
  return cache
}

export async function listDepts() {
  return (await loadLookups()).depts
}

export async function listPositions() {
  return (await loadLookups()).positions
}
