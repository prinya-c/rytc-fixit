import { deleteObject, getDownloadURL, listAll, ref, uploadBytes } from 'firebase/storage'
import imageCompression from 'browser-image-compression'
import { storage } from './firebase'

/**
 * เช็คว่าเบราว์เซอร์นี้เข้ารหัส (encode) ภาพเป็น WebP ผ่าน canvas ได้จริงหรือไม่ — วิธีมาตรฐาน:
 * ถ้าไม่รองรับ toDataURL('image/webp') จะคืนค่าเป็น image/png แทนโดยอัตโนมัติแทนที่จะ error
 * เช็คครั้งเดียวตอนโหลดไฟล์นี้แล้วจำผลไว้ใช้ซ้ำ (เป็น sync ล้วน ไม่ต้องรอ)
 */
function supportsWebPEncoding() {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1
    return canvas.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}

const CAN_ENCODE_WEBP = supportsWebPEncoding()
// เผื่อต้องตรวจสอบย้อนหลังว่าทำไมรูปที่อัปโหลดจากเครื่องไหนไม่เป็น WebP — เปิด console ของเบราว์เซอร์
// เครื่องนั้นดูข้อความนี้ได้ (ไม่รองรับ WebP เป็นเรื่องปกติของบางเบราว์เซอร์/WebView ในแอปแชท ไม่ใช่บั๊ก)
console.info(`[fixit] เข้ารหัสรูปเป็น WebP ได้: ${CAN_ENCODE_WEBP} (ไม่ได้จะใช้ JPEG แทน)`)

// เป้าหมาย 250KB/รูป — ใช้ WebP ก่อนเสมอถ้าเบราว์เซอร์เข้ารหัสได้ (เล็กกว่า JPEG ที่คุณภาพเท่ากัน
// ~25-35%) ไม่รองรับค่อยตกไปใช้ JPEG แทน — maxWidthOrHeight ลดจาก 1600 เหลือ 1280 ด้วย เพราะถ้า
// ปล่อยความละเอียดสูงไว้แล้วบีบให้เหลือ 250KB จะต้องกดคุณภาพ JPEG/WebP ต่ำมากจนเห็นรอยบีบอัดชัด
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.25,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  fileType: CAN_ENCODE_WEBP ? 'image/webp' : 'image/jpeg',
}

/**
 * บีบอัดรูปให้ไม่เกิน ~250KB (ดู COMPRESSION_OPTIONS) เรียกจาก offlineQueue.js ก่อนตัดสินใจว่าจะ
 * อัปโหลดทันทีหรือเก็บคิวไว้ในเครื่อง — ทำให้ทั้ง 2 เส้นทางได้ไฟล์ที่บีบอัดแล้วเหมือนกัน (คิว
 * ออฟไลน์จึงไม่เปลืองพื้นที่เก็บในเครื่องด้วยไฟล์เต็มขนาดจากกล้อง) คืนไฟล์ต้นฉบับถ้าบีบอัดไม่สำเร็จ
 * (เช่น ไฟล์ HEIC ที่ถอดรหัสผ่าน canvas ไม่ได้, รูปใหญ่เกินข้อจำกัดของ canvas, Web Worker ใช้ไม่ได้)
 */
export async function compressPhoto(file) {
  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS)
    console.info(
      `[fixit] บีบอัดรูปสำเร็จ: ${file.type} ${(file.size / 1024).toFixed(0)}KB → ${compressed.type} ${(compressed.size / 1024).toFixed(0)}KB`,
    )
    return compressed
  } catch (err) {
    // บีบอัดไม่สำเร็จ — ใช้ไฟล์ต้นฉบับแทน (มักเป็น JPEG/HEIC เต็มขนาดจากกล้อง ไม่ใช่ WebP) log ไว้
    // เพื่อตรวจสอบย้อนหลังได้ว่าทำไมรูปจากเครื่องนี้ไม่ถูกบีบอัด/แปลงเป็น WebP ตามที่ตั้งใจไว้
    console.warn('[fixit] บีบอัดรูปไม่สำเร็จ ใช้ไฟล์ต้นฉบับแทน:', err)
    return file
  }
}

/** อัปโหลดรูปถ่าย 1 ไฟล์ไปที่ fixit/{repairId}/{subPath} (ต้องบีบอัดมาก่อนแล้วด้วย compressPhoto)
 * คืนค่า download URL */
export async function uploadRepairPhoto(repairId, subPath, file) {
  const fileRef = ref(storage, `fixit/${repairId}/${subPath}`)
  await uploadBytes(fileRef, file)
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
