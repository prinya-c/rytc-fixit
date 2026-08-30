import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    const from = location.state?.from || '/repairs'
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(location.state?.from || '/repairs', { replace: true })
    } catch {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm space-y-4"
      >
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-xl font-bold">
            F
          </span>
          <h1 className="text-lg font-semibold text-slate-800 mt-2">เข้าสู่ระบบเจ้าหน้าที่</h1>
          <p className="text-sm text-slate-500">RYTC-Fix ศูนย์ซ่อมสร้างเพื่อชุมชน</p>
        </div>
        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary hover:bg-primary-hover text-white rounded-md py-2 font-medium disabled:opacity-60"
        >
          {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
        <p className="text-xs text-slate-400 text-center">
          บัญชีเจ้าหน้าที่สร้างโดยผู้ดูแลระบบผ่าน Firebase Console เท่านั้น
        </p>
      </form>
    </div>
  )
}
