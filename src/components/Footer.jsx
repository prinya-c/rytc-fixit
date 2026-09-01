import { RYTC_LOGO } from '../lib/assets'
import { APP_VERSION } from '../lib/version'

export default function Footer() {
  return (
    <footer className="no-print py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
      <img src={RYTC_LOGO} alt="Rayong Technical College" className="h-4 object-contain" />
      RYTC-FixIT v{APP_VERSION}
    </footer>
  )
}
