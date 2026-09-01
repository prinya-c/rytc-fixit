import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const TABS = [
  { to: '/repairs', label: 'รายการงานซ่อม', icon: '📋', end: true },
  { to: '/repairs/new', label: 'ลงทะเบียนใหม่', icon: '📝', end: false },
  { to: '/scan', label: 'สแกน QR', icon: '📷', end: false },
]

const tabClass = ({ isActive }) =>
  `flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium ${
    isActive ? 'text-primary' : 'text-slate-400'
  }`

/**
 * แถบเมนูล่างจอ เฉพาะจอมือถือ (sm:hidden) — แทนเมนูแนวนอนในหัวจอที่เดิม wrap ไม่แน่นอนบนจอแคบ
 * (ดู Navbar.jsx ที่ซ่อนเมนูเดิมไว้ด้วย hidden sm:flex คู่กัน) จอใหญ่ยังใช้เมนูในหัวจอตามปกติ
 * ใช้ position: fixed ตรึงล่างจอเสมอ — App.jsx เผื่อ padding-bottom ให้เนื้อหาไม่โดนบัง
 */
export default function BottomTabBar() {
  const { staffProfile } = useAuth()
  if (!staffProfile) return null

  return (
    <nav
      className="no-print sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-orange-100 flex"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={tabClass}>
          <span className="text-lg leading-none">{tab.icon}</span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
