import { APP_VERSION } from '../lib/version'

export default function Footer() {
  return (
    <footer className="no-print py-4 text-center text-xs text-slate-400">
      RYTC-Fix v{APP_VERSION}
    </footer>
  )
}
