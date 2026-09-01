import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FIXIT_LOGO } from '../lib/assets'

const navLinkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium ${
    isActive ? 'bg-white/20 text-white' : 'text-white/85 hover:bg-white/10'
  }`

export default function Navbar() {
  const { staffProfile, logout } = useAuth()

  return (
    <header className="no-print bg-primary">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 font-semibold text-white">
          <img src={FIXIT_LOGO} alt="Fix it Center" className="h-9 w-9 object-contain" />
          <span className="leading-tight">
            RYTC-Fix
            <span className="block text-xs font-normal text-white/80">
              ศูนย์ซ่อมสร้างเพื่อชุมชน
            </span>
          </span>
        </Link>

        {staffProfile && (
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/repairs" className={navLinkClass} end>
              รายการงานซ่อม
            </NavLink>
            <NavLink to="/repairs/new" className={navLinkClass}>
              ลงทะเบียนใหม่
            </NavLink>
            <NavLink to="/scan" className={navLinkClass}>
              สแกน QR
            </NavLink>
          </nav>
        )}

        {staffProfile && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/90 hidden sm:inline">{staffProfile.fullName}</span>
            <button
              onClick={logout}
              className="rounded-md border border-white/30 px-3 py-1.5 text-white hover:bg-white/10"
            >
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
