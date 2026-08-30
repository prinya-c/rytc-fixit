import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    const from = location.state?.from || '/repairs'
    return <Navigate to={from} replace />
  }

  async function handleGoogleLogin() {
    setError('')
    setSubmitting(true)
    try {
      await login()
      navigate(location.state?.from || '/repairs', { replace: true })
    } catch (err) {
      setError(err.message || 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm space-y-4 text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white text-xl font-bold">
          F
        </span>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">เข้าสู่ระบบเจ้าหน้าที่</h1>
          <p className="text-sm text-slate-500">RYTC-Fix ศูนย์ซ่อมสร้างเพื่อชุมชน</p>
        </div>
        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2 text-left">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-md border border-slate-300 py-2.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.82Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1A12 12 0 0 0 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.28A12 12 0 0 0 0 12c0 1.94.46 3.77 1.28 5.38l3.99-3.1Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.62l3.99 3.1C6.22 6.86 8.87 4.75 12 4.75Z"
            />
          </svg>
          {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
        </button>
        <p className="text-xs text-slate-400">
          ใช้ได้เฉพาะบัญชี Google ของวิทยาลัย (@technicrayong.ac.th) เท่านั้น
        </p>
      </div>
    </div>
  )
}
