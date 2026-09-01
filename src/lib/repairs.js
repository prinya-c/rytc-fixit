import {
  addDoc,
  arrayRemove,
  arrayUnion,
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
import {
  recordCategoryChange,
  recordDeleteRepair,
  recordNewRepair,
  recordStatusChange,
  recordUnrepairableChange,
} from './stats'

const REPAIRS = 'repairs'
const PUBLIC_REPAIRS = 'publicRepairs'

/**
 * publicRepairs/{repairId} คือสำเนาแบบ "ปลอดข้อมูลส่วนบุคคล" ของ repairs/{repairId}
 * เก็บเฉพาะ category, vehicleType, status, unrepairable, รูปสิ่งของ 1 รูป, วันที่, และ hash
 * ของ repairId (ดู repairIdHash ด้านล่าง) — ไม่มีชื่อ/เบอร์โทร/เลขบัตรประชาชน/รูปคน เพื่อให้
 * Dashboard สาธารณะ query แสดงรายการจริง (ไม่ใช่แค่ตัวเลขสรุป) ได้โดยไม่ต้องล็อกอิน — ดู
 * firestore.rules ที่เปิด read สาธารณะไว้เฉพาะ collection นี้ (นอกเหนือจาก stats/summary)
 */
function publicRepairFields({ repairIdHash, item, status, unrepairable, itemPhoto, createdAt, updatedAt }) {
  return {
    repairIdHash,
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

/**
 * แฮชทางเดียวของ repairId — repairId ขึ้นต้นด้วยเลขบัตรประชาชนของผู้ขอรับบริการ (ดู
 * buildRepairId) จึงห้ามเก็บค่าดิบไว้ใน publicRepairs ที่เปิดอ่านสาธารณะโดยตรง แต่ยังต้องมีทาง
 * ให้หน้า /repairs/:id (ที่คนไม่ได้ล็อกอินก็เข้าได้จาก QR ใบเดียวกับที่เจ้าหน้าที่ใช้) ค้นหา
 * เอกสารสาธารณะของรายการนั้นจาก repairId ใน URL ได้ — ใช้ SHA-256 ผ่าน Web Crypto (มีในทุก
 * เบราว์เซอร์สมัยใหม่บน HTTPS/localhost) แล้ว query ด้วยค่า hash แทนค่าดิบ
 */
async function sha256Hex(text) {
  const data = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

/**
 * สร้าง repair id จาก "เลขบัตรประชาชน-dd-mm-yyyy-HH-mm-ss" (เวลาเครื่อง ณ ตอนกดบันทึก)
 * ใช้เป็นทั้ง Firestore doc id, path รูปใน Storage (fixit/{repairId}/...), และเนื้อหาใน QR Code
 * ต้องเรียกก่อนอัปโหลดรูป/สร้างเอกสารจริง เพื่อให้ path สอดคล้องกันทั้งหมด
 */
export function buildRepairId(nationalId) {
  const d = new Date()
  const stamp = [
    pad2(d.getDate()),
    pad2(d.getMonth() + 1),
    d.getFullYear(),
    pad2(d.getHours()),
    pad2(d.getMinutes()),
    pad2(d.getSeconds()),
  ].join('-')
  return `${nationalId}-${stamp}`
}

/** สร้างรายการลงทะเบียนซ่อมใหม่ พร้อมสถานะเริ่มต้น "รับลงทะเบียน" และ log แรก */
export async function createRepair(
  repairId,
  { requester, item, intakeCondition, photosIntake, staffUid, staffName, staffPhone },
) {
  const ref = doc(db, REPAIRS, repairId)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    throw new Error('รหัสรายการนี้ถูกใช้ไปแล้ว (อาจกดบันทึกซ้ำในวินาทีเดียวกัน) กรุณาลองใหม่อีกครั้ง')
  }
  const now = serverTimestamp()
  // publicId เป็นคนละค่ากับ repairId โดยตั้งใจ — repairId ตอนนี้ขึ้นต้นด้วยเลขบัตรประชาชน
  // ผู้ขอรับบริการ ถ้าใช้ค่าเดียวกันเป็น doc id ของ publicRepairs (ซึ่งเปิดอ่านสาธารณะ) เลขบัตร
  // ประชาชนจะรั่วออกไปทาง document id แม้ในตัวฟิลด์จะไม่มีข้อมูลนี้อยู่ก็ตาม
  const publicId = doc(collection(db, PUBLIC_REPAIRS)).id
  const repairIdHash = await sha256Hex(repairId)

  // ช่องรูปที่เป็น null คือยังอัปโหลดไม่สำเร็จ (คิวไว้ในเครื่องตอนออฟไลน์ — ดู offlineQueue.js)
  // pendingPhotos เก็บ slot ที่ยังรอไว้ ให้ resolvePendingIntakePhoto() รู้ว่าต้องแก้ฟิลด์ไหน
  // เมื่ออัปโหลดสำเร็จภายหลัง
  const pendingPhotos = []
  if (!photosIntake?.itemPhotos?.[0]) pendingPhotos.push('intake:item1')
  if (!photosIntake?.itemPhotos?.[1]) pendingPhotos.push('intake:item2')
  if (!photosIntake?.personPhoto) pendingPhotos.push('intake:person')

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
    publicId,
    pendingPhotos,
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
    doc(db, PUBLIC_REPAIRS, publicId),
    publicRepairFields({
      repairIdHash,
      item,
      status: 1,
      unrepairable: false,
      // ใช้รูปเครื่องใช้ (index 1) เป็นรูปแทนสาธารณะ ไม่ใช่รูปบัตรประชาชน (index 0)
      itemPhoto: photosIntake?.itemPhotos?.[1],
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

/**
 * ใช้โดยหน้า /repairs/:id ตอนที่คนดูยังไม่ได้ล็อกอิน (สแกน QR เดียวกับที่เจ้าหน้าที่ใช้) —
 * หา publicRepairs ที่ตรงกับ repairId นี้ผ่าน hash (ดู sha256Hex) แทนการอ่าน repairs/{repairId}
 * ตรงๆ ซึ่งกฎความปลอดภัยเปิดให้เฉพาะเจ้าหน้าที่ที่ล็อกอินแล้วเท่านั้น
 */
export function subscribePublicRepairByRepairId(repairId, callback) {
  let unsub = null
  let cancelled = false
  sha256Hex(repairId).then((repairIdHash) => {
    if (cancelled) return
    const q = query(collection(db, PUBLIC_REPAIRS), where('repairIdHash', '==', repairIdHash))
    unsub = onSnapshot(q, (snap) => {
      callback(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })
    })
  })
  return () => {
    cancelled = true
    if (unsub) unsub()
  }
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
export function subscribePublicRepairs({ category, status } = {}, callback, onError) {
  const constraints = []
  if (category) constraints.push(where('category', '==', category))
  if (status) constraints.push(where('status', '==', status))
  const q = query(collection(db, PUBLIC_REPAIRS), ...constraints)
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      callback(items)
    },
    onError,
  )
}

/**
 * เติม publicRepairs ให้รายการเก่าที่สร้างไว้ก่อนฟีเจอร์นี้จะมีอยู่ (เลยไม่เคยมีคู่ใน
 * publicRepairs) เรียกใช้ครั้งเดียวพอ ทำซ้ำได้เรื่อยๆ อย่างปลอดภัย (setDoc ทับด้วยข้อมูลปัจจุบัน
 * จาก repairs เสมอ) คืนค่าจำนวนรายการที่เติมให้
 */
export async function backfillPublicRepairs() {
  const snap = await getDocs(collection(db, REPAIRS))
  let count = 0
  await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data()
      // รายการเก่าก่อนมีฟิลด์ publicId — สุ่มให้ใหม่แล้วบันทึกกลับเข้า repairs ให้ครบ
      // (repairId เดิมของรายการเก่าไม่มีเลขบัตรประชาชนปนอยู่ ใช้แทนกันชั่วคราวได้ แต่ใส่
      // publicId จริงให้ครบไปเลยจะได้สอดคล้องกับรายการใหม่ในระยะยาว)
      let publicId = data.publicId
      if (!publicId) {
        publicId = doc(collection(db, PUBLIC_REPAIRS)).id
        await updateDoc(d.ref, { publicId })
        // เดิมไม่มี publicId แปลว่าสำเนาเก่า (ถ้ามี) ถูกเก็บไว้ที่ publicRepairs/{repairId}
        // (doc id เดียวกับ repairs) — ลบทิ้งกันซ้ำซ้อนกับสำเนาใหม่ที่กำลังจะสร้างที่ publicId
        await deleteDoc(doc(db, PUBLIC_REPAIRS, d.id)).catch(() => {})
      }
      const repairIdHash = await sha256Hex(d.id)
      await setDoc(
        doc(db, PUBLIC_REPAIRS, publicId),
        publicRepairFields({
          repairIdHash,
          item: data.item,
          status: data.status,
          unrepairable: data.unrepairable,
          itemPhoto: data.photosIntake?.itemPhotos?.[1],
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        }),
      )
      count += 1
    }),
  )
  return count
}

/**
 * แก้ไขข้อมูลเริ่มต้น (ผู้ขอรับบริการ/สิ่งของ/อาการ) ของรายการที่ลงทะเบียนไปแล้ว — ใช้แก้ข้อมูล
 * กรอกผิดพลาดตอนรับลงทะเบียน ไม่แตะสถานะ/รูป/ประวัติงานซ่อม ถ้าประเภทเปลี่ยน จะปรับ
 * stats.byCategory และ publicRepairs.category/vehicleType ให้ตรงกับของใหม่ด้วย
 */
export async function updateRepairIntake(repairId, { requester, item, intakeCondition }) {
  const ref = doc(db, REPAIRS, repairId)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('ไม่พบรายการนี้')
  const current = snap.data()

  await updateDoc(ref, {
    requester,
    item,
    intakeCondition,
    updatedAt: serverTimestamp(),
  })

  if (current.publicId) {
    await updateDoc(doc(db, PUBLIC_REPAIRS, current.publicId), {
      category: item.category,
      vehicleType: item.vehicleType ?? null,
      updatedAt: serverTimestamp(),
    })
  }

  if (item.category !== current.item?.category) {
    await recordCategoryChange(current.item?.category, item.category, current.status)
  }
}

/** บันทึกผลคัดแยก/ประเมิน (ไม่เปลี่ยนสถานะเอง — เรียก changeRepairStatus ต่อจากหน้าฟอร์ม) */
export async function saveAssessment(repairId, { inspectionNotes, damageLevel, causeNote, staffUid, staffName }) {
  await updateDoc(doc(db, REPAIRS, repairId), {
    assessment: {
      inspectionNotes,
      damageLevel,
      causeNote: causeNote || null,
      assessedByUid: staffUid,
      assessedByName: staffName,
      assessedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  })
}

/**
 * บันทึกข้อมูลผู้ดำเนินการซ่อม/ตรวจเช็ค — กรอกตอนอัปเดตสถานะเป็น "ตรวจสอบคุณภาพ" (7)
 * เก็บแยกต่างหากจาก staff/{uid} เพราะเป็นข้อมูลเฉพาะรายการนี้ (ช่างที่ลงมือซ่อมจริง
 * อาจไม่ใช่คนเดียวกับที่ล็อกอินกดปุ่มอัปเดตสถานะ) ไม่ใช่ข้อมูลโปรไฟล์ถาวรของเจ้าหน้าที่
 */
export async function saveQualityCheck(
  repairId,
  { technicianName, technicianNationalId, department, supervisingTeacher, repairDetails, staffUid, staffName },
) {
  await updateDoc(doc(db, REPAIRS, repairId), {
    qualityCheck: {
      technicianName: technicianName || null,
      technicianNationalId: technicianNationalId || null,
      department: department || null,
      supervisingTeacher: supervisingTeacher || null,
      repairDetails: repairDetails || null,
      checkedByUid: staffUid,
      checkedByName: staffName,
      checkedAt: serverTimestamp(),
    },
    updatedAt: serverTimestamp(),
  })
}

/**
 * แก้ URL รูปที่ค้างอัปโหลดตอนออฟไลน์กลับเข้าไปในเอกสาร เรียกจาก offlineQueue.js เมื่ออัปโหลด
 * รูปสำเร็จภายหลัง (slot: 'item1' | 'item2' | 'person') — ถ้าเป็นรูปเครื่องใช้ (item2) จะอัปเดต
 * publicRepairs ให้ Dashboard สาธารณะเห็นรูปด้วย (item1 คือรูปบัตรประชาชน ห้ามขึ้นสาธารณะ)
 */
export async function resolvePendingIntakePhoto(repairId, slot, url) {
  const ref = doc(db, REPAIRS, repairId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const itemPhotos = [...(data.photosIntake?.itemPhotos ?? [null, null])]
  const photosIntake = { ...data.photosIntake, itemPhotos, personPhoto: data.photosIntake?.personPhoto ?? null }
  if (slot === 'item1') itemPhotos[0] = url
  else if (slot === 'item2') itemPhotos[1] = url
  else if (slot === 'person') photosIntake.personPhoto = url

  await updateDoc(ref, {
    photosIntake,
    pendingPhotos: arrayRemove(`intake:${slot}`),
    updatedAt: serverTimestamp(),
  })

  if (slot === 'item2' && data.publicId) {
    await updateDoc(doc(db, PUBLIC_REPAIRS, data.publicId), { itemPhoto: url })
  }
}

/** เหมือน resolvePendingIntakePhoto แต่สำหรับรูปตอนปิดงาน/ส่งมอบคืน (slot: 'item' | 'person') */
export async function resolvePendingClosurePhoto(repairId, slot, url) {
  const ref = doc(db, REPAIRS, repairId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data()
  const closure = { ...data.closure }
  if (slot === 'item') closure.itemPhoto = url
  else if (slot === 'person') closure.personPhoto = url

  await updateDoc(ref, {
    closure,
    pendingPhotos: arrayRemove(`closure:${slot}`),
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

  // fallback ไป repairId เองสำหรับรายการเก่าก่อนมีฟิลด์ publicId (repairId เดิมเป็นสตริง
  // สุ่มที่ไม่มีเลขบัตรประชาชนปนอยู่ จึงไม่รั่วข้อมูลถ้าใช้แทนกันชั่วคราว)
  await updateDoc(doc(db, PUBLIC_REPAIRS, current.publicId || repairId), {
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

/** ปิดงาน/ส่งมอบคืน — บันทึกรูป+ผู้รับคืน แล้วเปลี่ยนสถานะเป็น "ส่งมอบ/ส่งคืนแล้ว" (10) */
export async function closeRepair(repairId, { itemPhoto, personPhoto, receiverName, receiverRelation, staffUid, staffName }) {
  // itemPhoto/personPhoto เป็น null ได้ถ้ายังอัปโหลดไม่สำเร็จตอนออฟไลน์ — เติมเข้า pendingPhotos
  // แบบ arrayUnion เพื่อไม่ทับ slot ฝั่ง intake ที่อาจยังค้างอยู่ (ไม่น่าเกิดแต่กันไว้)
  const pendingAdditions = []
  if (!itemPhoto) pendingAdditions.push('closure:item')
  if (!personPhoto) pendingAdditions.push('closure:person')

  await updateDoc(doc(db, REPAIRS, repairId), {
    closure: {
      itemPhoto: itemPhoto ?? null,
      personPhoto: personPhoto ?? null,
      receiverName,
      receiverRelation: receiverRelation || null,
      closedByUid: staffUid,
      closedByName: staffName,
      closedAt: serverTimestamp(),
    },
    ...(pendingAdditions.length > 0 ? { pendingPhotos: arrayUnion(...pendingAdditions) } : {}),
    updatedAt: serverTimestamp(),
  })
  await changeRepairStatus(repairId, {
    newStatus: 10,
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
  await deleteDoc(doc(db, PUBLIC_REPAIRS, data.publicId || repairId))

  await recordDeleteRepair({
    category: data.item?.category,
    statusCode: data.status,
    unrepairable: !!data.unrepairable,
  })
}
