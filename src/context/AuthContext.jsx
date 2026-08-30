import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'

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

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email.trim(), password)
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
