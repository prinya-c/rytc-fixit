import { createContext, useContext, useEffect, useState } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

// จำกัดให้เฉพาะบัญชี Google ของวิทยาลัยเท่านั้นที่ล็อกอินเข้าระบบเจ้าหน้าที่ได้
// (บังคับใช้จริงอีกชั้นใน firestore.rules ด้วย เพราะฝั่ง client เลี่ยงได้)
const ALLOWED_EMAIL_DOMAIN = 'technicrayong.ac.th'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ hd: ALLOWED_EMAIL_DOMAIN })

function isAllowedEmail(email) {
  return !!email && email.toLowerCase().endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [staffProfile, setStaffProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // บังคับโดเมนอีเมลซ้ำที่นี่ด้วย (ไม่ใช่แค่ตอน login()) เผื่อ session เก่าค้างอยู่
      // หรือ hd hint ถูกเลี่ยงตอนเลือกบัญชีใน popup
      if (firebaseUser && !isAllowedEmail(firebaseUser.email)) {
        await signOut(auth)
        setUser(null)
        setStaffProfile(null)
        setLoading(false)
        return
      }
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
    const result = await signInWithPopup(auth, googleProvider)
    if (!isAllowedEmail(result.user.email)) {
      await signOut(auth)
      throw new Error(`ใช้ได้เฉพาะบัญชี Google ของวิทยาลัย (@${ALLOWED_EMAIL_DOMAIN}) เท่านั้น`)
    }
  }

  async function logout() {
    await signOut(auth)
  }

  /** เจ้าหน้าที่กรอกชื่อ-เบอร์โทรครั้งแรกหลังล็อกอิน (บัญชี Auth สร้างผ่าน Console แล้วแต่ยังไม่มี profile) */
  async function completeProfile({ fullName, phone }) {
    if (!user) throw new Error('ยังไม่ได้เข้าสู่ระบบ')
    const profile = {
      fullName: fullName.trim(),
      phone: phone.trim(),
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
