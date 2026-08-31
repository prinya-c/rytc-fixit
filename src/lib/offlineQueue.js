import { openDB } from 'idb'
import { uploadRepairPhoto } from './storageUpload'
import { resolvePendingClosurePhoto, resolvePendingIntakePhoto } from './repairs'

const DB_NAME = 'rytc-fixit-offline'
const STORE = 'pendingPhotoUploads'

/**
 * คิวอัปโหลดรูปที่ค้างไว้ในเครื่อง (IndexedDB) ตอนขาดสัญญาณอินเทอร์เน็ต
 * ต่างจาก Firestore offline persistence (เฟส 1) ตรงที่ Firebase Storage SDK ไม่มีกลไก
 * คิวออฟไลน์ในตัว — ต้องเก็บไฟล์รูปไว้เองแล้วอัปโหลดซ้ำตอนกลับมาออนไลน์
 *
 * record: { id, repairId, kind: 'intake'|'closure', slot, subPath, file, createdAt, attempts, lastError }
 */
function dbPromise() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true })
    },
  })
}

const listeners = new Set()

function notify() {
  getPendingCount().then((count) => listeners.forEach((fn) => fn(count)))
}

/** สมัครรับการแจ้งเตือนจำนวนรูปที่ค้างคิว (สำหรับ badge บนหน้าจอ) คืนค่าฟังก์ชันยกเลิกสมัคร */
export function subscribePendingCount(callback) {
  listeners.add(callback)
  notify()
  return () => listeners.delete(callback)
}

export async function getPendingCount() {
  const db = await dbPromise()
  return db.count(STORE)
}

/** เก็บไฟล์รูปไว้ในคิวออฟไลน์ (แทนการอัปโหลดทันที) คืนค่า queue id */
export async function enqueuePhotoUpload({ repairId, kind, slot, subPath, file }) {
  const db = await dbPromise()
  const id = await db.add(STORE, {
    repairId,
    kind,
    slot,
    subPath,
    file,
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
  })
  notify()
  return id
}

/**
 * พยายามอัปโหลดรูปทันที ใช้ตอนกดบันทึกฟอร์ม (ลงทะเบียน/ปิดงาน) — ถ้าออฟไลน์อยู่แล้วจะข้ามไปเก็บ
 * ไว้ในคิวเลยโดยไม่เสียเวลารอ timeout, ถ้าออนไลน์แต่อัปโหลดไม่สำเร็จกลางคัน (เช่น หลุดสัญญาณ)
 * ก็ตกไปเก็บไว้ในคิวเช่นกัน คืนค่า download URL ถ้าสำเร็จ หรือ null ถ้าต้องรอซิงก์ภายหลัง
 */
export async function uploadOrQueuePhoto({ repairId, kind, slot, subPath, file }) {
  if (navigator.onLine) {
    try {
      return await uploadRepairPhoto(repairId, subPath, file)
    } catch {
      // อัปโหลดไม่สำเร็จ (เช่นหลุดสัญญาณกลางคัน) — ตกไปเก็บคิวไว้ด้านล่างแทน
    }
  }
  await enqueuePhotoUpload({ repairId, kind, slot, subPath, file })
  return null
}

async function resolveOne(record) {
  const url = await uploadRepairPhoto(record.repairId, record.subPath, record.file)
  if (record.kind === 'intake') {
    await resolvePendingIntakePhoto(record.repairId, record.slot, url)
  } else {
    await resolvePendingClosurePhoto(record.repairId, record.slot, url)
  }
}

/** ล้างรูปที่ค้างคิวของรายการซ่อมที่ถูกลบไปแล้ว กันไม่ให้คิวพยายามอัปโหลดรูปของรายการที่ไม่มีแล้ว */
export async function clearPendingForRepair(repairId) {
  const db = await dbPromise()
  const all = await db.getAll(STORE)
  const toDelete = all.filter((r) => r.repairId === repairId)
  await Promise.all(toDelete.map((r) => db.delete(STORE, r.id)))
  if (toDelete.length > 0) notify()
}

let processing = false

/**
 * ไล่อัปโหลดรูปที่ค้างคิวทั้งหมดทีละรายการ เรียกตอนแอปเริ่มทำงานและตอนเบราว์เซอร์กลับมาออนไลน์
 * รายการที่อัปโหลดไม่สำเร็จ (เช่น หลุดสัญญาณกลางคัน) จะถูกเก็บไว้ในคิวต่อ รอรอบถัดไป
 * ไม่ทำให้รายการอื่นในคิวหยุดตาม เผื่อเป็นปัญหาเฉพาะรายการนั้น (เช่น repair ถูกลบไปแล้ว)
 */
export async function processQueue() {
  if (processing) return
  if (!navigator.onLine) return
  processing = true
  try {
    const db = await dbPromise()
    const records = await db.getAll(STORE)
    for (const record of records) {
      try {
        await resolveOne(record)
        await db.delete(STORE, record.id)
        notify()
      } catch (err) {
        await db.put(STORE, {
          ...record,
          attempts: (record.attempts ?? 0) + 1,
          lastError: err.message || 'อัปโหลดไม่สำเร็จ',
        })
      }
    }
  } finally {
    processing = false
  }
}

let initialized = false

/** ตั้งค่าให้คิวไล่อัปโหลดอัตโนมัติตอนกลับมาออนไลน์ — เรียกครั้งเดียวตอนแอปเริ่มทำงาน */
export function initOfflineQueue() {
  if (initialized) return
  initialized = true
  window.addEventListener('online', () => processQueue())
  processQueue()
}
