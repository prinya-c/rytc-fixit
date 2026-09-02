import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from './firebase'

const TECHNICIANS = 'technicians'

/**
 * โปรไฟล์ช่างซ่อม (ผู้ลงมือซ่อมจริง เช่น นักเรียน/นักศึกษา) — คนละ collection กับ staff/{uid}
 * (เจ้าหน้าที่ที่ล็อกอินเข้าระบบด้วย Google) ไม่ผูกกับบัญชี Auth ใดๆ จัดการผ่านหน้า /technicians
 * เอาไปใช้ตอนอัปเดตสถานะขั้น "ตรวจสอบคุณภาพ" (ดู RepairStatus.jsx) แทนการพิมพ์ชื่อ/สาขาวิชาเอง
 * ทุกครั้ง — position/dept เก็บทั้ง id (อ้างอิงกลับไป collection ต้นทาง) และชื่อที่ denormalize
 * ไว้แสดงผลเร็ว (รูปแบบเดียวกับ staff profile ใน AuthContext.jsx)
 */
export function subscribeTechnicians(callback) {
  const q = query(collection(db, TECHNICIANS), orderBy('fullName'))
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
}

export async function createTechnician({ fullName, phone, position, positionName, dept, deptName }) {
  await addDoc(collection(db, TECHNICIANS), {
    fullName: fullName.trim(),
    phone: phone.trim(),
    position,
    positionName,
    dept,
    deptName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateTechnician(id, { fullName, phone, position, positionName, dept, deptName }) {
  await updateDoc(doc(db, TECHNICIANS, id), {
    fullName: fullName.trim(),
    phone: phone.trim(),
    position,
    positionName,
    dept,
    deptName,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteTechnician(id) {
  await deleteDoc(doc(db, TECHNICIANS, id))
}
