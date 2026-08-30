import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CompleteProfile from './CompleteProfile'

export default function PrivateRoute({ children }) {
  const { user, staffProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        กำลังโหลด...
      </div>
    )
  }

  if (!user) {
    // รวม query string ไปด้วย (ไม่ใช่แค่ pathname) เพื่อให้ลิงก์ drilldown จาก Dashboard
    // (เช่น /repairs?status=3) ยังคงตัวกรองไว้ได้หลังล็อกอินเสร็จ
    const from = location.pathname + location.search
    return <Navigate to="/staff/login" replace state={{ from }} />
  }

  if (!staffProfile) {
    return <CompleteProfile />
  }

  return children
}
