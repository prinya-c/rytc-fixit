import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { storage } from './firebase'

const COMPRESSION_OPTIONS = { maxSizeMB: 1, maxWidthOrHeight: 1600, useWebWorker: true }

/** อัปโหลดรูปถ่าย 1 ไฟล์ไปที่ fixit/{repairId}/{subPath} พร้อมบีบอัดก่อนอัปโหลด คืนค่า download URL */
export async function uploadRepairPhoto(repairId, subPath, file) {
  let toUpload = file
  try {
    toUpload = await imageCompression(file, COMPRESSION_OPTIONS)
  } catch {
    // บีบอัดไม่สำเร็จ (เช่นไฟล์ที่ไม่รองรับ) ใช้ไฟล์ต้นฉบับแทน
  }
  const fileRef = ref(storage, `fixit/${repairId}/${subPath}`)
  await uploadBytes(fileRef, toUpload)
  return getDownloadURL(fileRef)
}

async function deleteFolderRecursive(folderRef) {
  const { items, prefixes } = await listAll(folderRef)
  await Promise.all(items.map((item) => deleteObject(item)))
  await Promise.all(prefixes.map((prefix) => deleteFolderRecursive(prefix)))
}

/** ลบรูปทั้งหมดของงานซ่อมนี้ (ใช้ตอนลบรายการ) */
export async function deleteRepairPhotos(repairId) {
  await deleteFolderRecursive(ref(storage, `fixit/${repairId}`))
}
