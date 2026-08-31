import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'
import { statusLabel } from './options'
import { deleteRepairPhotos } from './storageUpload'
import { recordDeleteRepair, recordNewRepair, recordStatusChange, recordUnrepairableChange } from './stats'

const REPAIRS = 'repairs'
const PUBLIC_REPAIRS = 'publicRepairs'

/**
 * publicRepairs/{repairId} คือสำเนาแบบ "ปลอดข้อมูลส่วนบุคคล" ของ repairs/{repairId}
 * เก็บเฉพาะ category, vehicleType, status, unrepairable, รูปสิ่งของ 1 รูป, วันที่ —
 * ไม่มีชื่อ/เบอร์โทร/เลขบัตรประชาชน/รูปคน เพื่อให้ Dashboard สาธารณะ query แสดงรายการจริง
 * (ไม่ใช่แค่ตัวเลขสรุป) ได้โดยไม่ต้องล็อกอิน — ดู firestore.rules ที่เปิด read สาธารณะไว้เฉพาะ
 * collection นี้ (นอกเหนือจาก stats/summary)
 */
function publicRepairFields({ item, status, unrepairable, itemPhoto, createdAt, updatedAt }) {
  return {
    category: item.category,
    vehicleType: item.vehicleType ?? null,
    status,
    statusLabel: statusLabel(status),
    unrepairable: !!unrepairable,
    itemPhoto: itemPhoto ?? null,
    createdAt,
    updatedAt,
  }
}

/** สุ่ม id ล่วงหน้าก่อนสร้างเอกสารจริง ใช้เป็น path อัปโหลดรูปใน Storage ก่อน save เอกสาร */
export function newRepairId() {
  return doc(collection(db, REPAIRS)).id
}

/** สร้างรายการลงทะเบียนซ่อมใหม่ พร้อมสถานะเริ่มต้น "รับลงทะเบียน" และ log แรก */
export async function createRepair(
  repairId,
  { requester, item, intakeCondition, photosIntake, staffUid, staffName, staffPhone },
) {
  const ref = doc(db, REPAIRS, repairId)
  const now = serverTimestamp()
  await setDoc(ref, {
    requester,
    item,
    intakeCondition,
    photosIntake,
    intake: { staffUid, staffName, staffPhone, registeredAt: now },
    status: 1,
    statusLabel: statusLabel(1),
    unrepairable: false,
    unrepairableReason: null,
    unrepairableNote: null,
    assessment: null,
    closure: null,
    createdAt: now,
    updatedAt: now,
  })
  await addDoc(collection(db, REPAIRS, ref.id, 'statusLogs'), {
    status: 1,
    statusLabel: statusLabel(1),
    note: 'รับลงทะเบียน',
    reasonNote: null,
    changedByUid: staffUid,
    changedByName: staffName,
    changedAt: now,
  })
  await setDoc(
    doc(db, PUBLIC_REPAIRS, repairId),
    publicRepairFields({
      item,
      status: 1,
      unrepairable: false,
      itemPhoto: photosIntake?.itemPhotos?.[0],
      createdAt: now,
      updatedAt: now,
    }),
  )
  await recordNewRepair(item.category)
  return ref.id
}

export function subscribeRepair(repairId, callback) {
  return onSnapshot(doc(db, REPAIRS, repairId), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export async function getRepair(repairId) {
  const snap = await getDoc(doc(db, REPAIRS, repairId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export function subscribeRepairs(callback) {
  const q = query(collection(db, REPAIRS), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

export function subscribeStatusLogs(repairId, callback) {
  const q = query(collection(db, REPAIRS, repairId, 'statusLogs'), orderBy('changedAt', 'desc'))
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  })
}

/**
 * ใช้โดย Dashboard สาธารณะ (ไม่ต้องล็อกอิน) เพื่อ drilldown เห็นรายการจริงที่ตรงกับการ์ดที่คลิก
 * ไม่มี orderBy ในตัว query เอง เพื่อเลี่ยงต้องสร้าง composite index — เรียงลำดับฝั่ง client แทน
 * (จำนวนรายการต่อศูนย์ซ่อมหนึ่งแห่งไม่มากพอที่จะมีปัญหาประสิทธิภาพ)
 */
export function subscribePublicRepairs({ category, status } = {}, callback) {
  const constraints = []
  if (category) constraints.push(where('category', '==', category))
  if (status) constraints.push(where('status', '==', status))
  const q = query(collection(db, PUBLIC_REPAIRS), ...constraints)
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
    callback(items)
  })
}

/** บันทึกผลคัดแยก/ประเมิน (ไม่เปลี่ยนสถานะเอง — เรียก changeRepairStatus ต่อจากหน้าฟอร์ม) */
export async function saveAssessment(repairId, { inspectionNotes, damageLevel, staffUid, staffName }) {
  await updateDoc(doc(db, REPAIRS, repairId), {
    assessment: {
      inspectionNotes,
      damageLevel,
      assessedByUid: staffUid,
      assessedByName: staffName,
      assessedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  })
}

/** เปลี่ยนสถานะงานซ่อม + บันทึก log + ปรับสถิติ ใช้ร่วมกันทุกหน้าที่เปลี่ยนสถานะ */
export async function changeRepairStatus(
  repairId,
  { newStatus, note, unrepairable, unrepairableReason, unrepairableNote, staffUid, staffName },
) {
  const ref = doc(db, REPAIRS, repairId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('ไม่พบรายการนี้')
  const current = snap.data()
  const oldStatus = current.status
  const wasUnrepairable = !!current.unrepairable
  // unrepairable === undefined หมายถึง "ไม่แตะต้องค่าเดิม" (ใช้ตอนปิดงานที่ไม่ได้มีสวิตช์นี้ในหน้า)
  const isUnrepairable = unrepairable === undefined ? wasUnrepairable : !!unrepairable

  await updateDoc(ref, {
    status: newStatus,
    statusLabel: statusLabel(newStatus),
    unrepairable: isUnrepairable,
    unrepairableReason: isUnrepairable ? (unrepairableReason ?? null) : null,
    unrepairableNote: isUnrepairable ? (unrepairableNote ?? null) : null,
    updatedAt: serverTimestamp(),
  })

  await addDoc(collection(db, REPAIRS, repairId, 'statusLogs'), {
    status: newStatus,
    statusLabel: statusLabel(newStatus),
    note: note || null,
    reasonNote: isUnrepairable ? (unrepairableReason ?? null) : null,
    changedByUid: staffUid,
    changedByName: staffName,
    changedAt: serverTimestamp(),
  })

  await updateDoc(doc(db, PUBLIC_REPAIRS, repairId), {
    status: newStatus,
    statusLabel: statusLabel(newStatus),
    unrepairable: isUnrepairable,
    updatedAt: serverTimestamp(),
  })

  if (oldStatus !== newStatus) {
    await recordStatusChange(current.item?.category, oldStatus, newStatus)
  }
  if (isUnrepairable !== wasUnrepairable) {
    await recordUnrepairableChange(isUnrepairable ? 1 : -1)
  }
}

/** ปิดงาน/ส่งมอบคืน — บันทึกรูป+ผู้รับคืน แล้วเปลี่ยนสถานะเป็น "ส่งมอบ" (8) */
export async function closeRepair(repairId, { itemPhoto, personPhoto, receiverName, receiverRelation, staffUid, staffName }) {
  await updateDoc(doc(db, REPAIRS, repairId), {
    closure: {
      itemPhoto,
      personPhoto,
      receiverName,
      receiverRelation: receiverRelation || null,
      closedByUid: staffUid,
      closedByName: staffName,
      closedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  })
  await changeRepairStatus(repairId, {
    newStatus: 8,
    note: 'ปิดงาน/ส่งมอบคืนเรียบร้อย',
    unrepairable: undefined,
    staffUid,
    staffName,
  })
}

/** ลบรายการลงทะเบียน (แก้ไขข้อมูลผิดพลาด) — ลบเอกสาร, log, รูปใน Storage, และปรับสถิติ */
export async function deleteRepair(repairId) {
  const ref = doc(db, REPAIRS, repairId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()

  const logsSnap = await getDocs(collection(db, REPAIRS, repairId, 'statusLogs'))
  await Promise.all(logsSnap.docs.map((d) => deleteDoc(d.ref)))

  await deleteRepairPhotos(repairId)
  await deleteDoc(ref)
  await deleteDoc(doc(db, PUBLIC_REPAIRS, repairId))

  await recordDeleteRepair({
    category: data.item?.category,
    statusCode: data.status,
    unrepairable: !!data.unrepairable,
  })
}
