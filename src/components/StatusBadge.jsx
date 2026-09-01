import { statusLabel } from '../lib/options'

export default function StatusBadge({ status, unrepairable, className = '' }) {
  const label = statusLabel(status)
  let color = 'bg-amber-100 text-amber-800'
  if (unrepairable) color = 'bg-red-100 text-red-700'
  else if (status === 10) color = 'bg-green-100 text-green-700'
  else if (status === 1) color = 'bg-slate-100 text-slate-700'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${color} ${className}`}
    >
      {unrepairable ? `ซ่อมไม่ได้ • ${label}` : label}
    </span>
  )
}
