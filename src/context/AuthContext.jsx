import { createContext, useContext, useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// เปิดให้ล็อกอินด้วยบัญชี Google ใดก็ได้ (ไม่จำกัดเฉพาะโดเมนวิทยาลัยอีกต่อไป) — ล็อกอินครั้งแรก
// จะพาไปกรอกโปรไฟล์เจ้าหน้าที่เอง (ดู completeProfile ด้านล่าง) แล้วได้สิทธิ์เจ้าหน้าที่ทันที
// ไม่มีขั้นตอนอนุมัติ (ยืนยันกับผู้ใช้แล้วว่าต้องการแบบนี้) — Firestore rules เปิดให้ทุกบัญชีที่
// ล็อกอินแล้วเช่นกัน (ดู isStaff() ใน firestore.rules)
const googleProvider = new GoogleAuthProvider()

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [staffProfile, setStaffProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'staff', firebaseUser.uid))
        setStaffProfile(snap.exists() ? snap.data() : null)
      } else {
        setStaffProfile(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login() {
    await signInWithPopup(auth, googleProvider)
  }

  async function logout() {
    await signOut(auth)
  }

  /** เจ้าหน้าที่กรอกชื่อ-เบอร์โทร-ตำแหน่ง-สาขาวิชาครั้งแรกหลังล็อกอิน (บัญชี Auth สร้างผ่าน Console
   * แล้วแต่ยังไม่มี profile) — position/dept เก็บทั้ง id (อ้างอิงกลับไป collection ต้นทาง) และ
   * ชื่อที่ denormalize ไว้แสดงผลเร็วโดยไม่ต้อง join เพิ่ม (รูปแบบเดียวกับ statusLabel ใน repairs.js) */
  async function completeProfile({ fullName, phone, position, positionName, dept, deptName }) {
    if (!user) throw new Error('ยังไม่ได้เข้าสู่ระบบ')
    const profile = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      position,
      positionName,
      dept,
      deptName,
      email: user.email,
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'staff', user.uid), profile)
    setStaffProfile(profile)
  }

  const value = { user, staffProfile, loading, login, logout, completeProfile }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
