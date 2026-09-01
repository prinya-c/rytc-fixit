import { Component } from 'react'

/**
 * กันไม่ให้ error ที่ไม่ได้ดักไว้ (เช่น จากไลบรารีนอก React อย่าง html5-qrcode ที่แก้ไข DOM
 * เองนอกเหนือการควบคุมของ React) ทำให้แอปขึ้นหน้าขาวเปล่าแบบกู้คืนเองไม่ได้ — ต้องกดรีเฟรชเอง
 * ถึงจะกลับมาใช้งานได้ ที่นี่มีปุ่มรีเฟรชให้กดในหน้าแทน
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('Unhandled error caught by ErrorBoundary:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-slate-700 font-medium">เกิดข้อผิดพลาดที่ไม่คาดคิด</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-primary hover:bg-primary-hover text-white px-4 py-2 text-sm font-medium"
          >
            รีเฟรชหน้านี้
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
