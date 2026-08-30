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
    return <Navigate to="/staff/login" replace state={{ from: location.pathname }} />
  }

  if (!staffProfile) {
    return <CompleteProfile />
  }

  return children
}
