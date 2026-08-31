import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import RepairReportSheet from '../components/RepairReportSheet'
import { subscribeRepair, subscribeStatusLogs } from '../lib/repairs'

export default function RepairReport() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [repair, setRepair] = useState(undefined)
  const [logs, setLogs] = useState([])

  useEffect(() => subscribeRepair(id, setRepair), [id])
  useEffect(() => subscribeStatusLogs(id, setLogs), [id])

  if (repair === undefined) return <p className="text-center text-slate-400 py-10">กำลังโหลด...</p>
  if (repair === null) return <p className="text-center text-danger py-10">ไม่พบรายการนี้</p>

  if (repair.status !== 8) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 text-center space-y-3">
        <p className="text-danger">
          พิมพ์ใบรายงานซ่อมได้เฉพาะรายการที่อยู่ในสถานะ "ส่งมอบ" แล้วเท่านั้น
        </p>
        <p className="text-sm text-slate-500">
          สถานะปัจจุบัน: {repair.status}. {repair.statusLabel}
        </p>
        <button
          onClick={() => navigate(`/repairs/${id}`)}
          className="rounded-md border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50"
        >
          กลับไปหน้ารายละเอียด
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="no-print max-w-3xl mx-auto px-4 py-4 flex gap-3">
        <button
          onClick={() => window.print()}
          className="bg-primary hover:bg-primary-hover text-white rounded-md px-4 py-2 font-medium"
        >
          🖨️ พิมพ์ใบรายงานซ่อม
        </button>
        <button
          onClick={() => navigate(`/repairs/${id}`)}
          className="rounded-md border border-slate-300 px-4 py-2 text-slate-600 hover:bg-slate-50"
        >
          ไปหน้ารายละเอียด
        </button>
      </div>

      <div className="mx-auto w-[210mm] min-h-[297mm] bg-white">
        <RepairReportSheet repair={repair} logs={logs} />
      </div>
    </div>
  )
}
