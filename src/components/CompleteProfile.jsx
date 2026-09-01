import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listDepts, listPositions } from '../lib/lookups'

const selectClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'

export default function CompleteProfile() {
  const { user, completeProfile, logout } = useAuth()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [positionId, setPositionId] = useState('')
  const [deptId, setDeptId] = useState('')
  const [positions, setPositions] = useState([])
  const [depts, setDepts] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listPositions().then(setPositions).catch(() => setError('โหลดรายการตำแหน่งไม่สำเร็จ'))
    listDepts().then(setDepts).catch(() => setError('โหลดรายการสาขาวิชาไม่สำเร็จ'))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!fullName.trim() || !phone.trim() || !positionId || !deptId) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      return
    }
    setSaving(true)
    try {
      const position = positions.find((p) => p.id === positionId)
      const dept = depts.find((d) => d.id === deptId)
      await completeProfile({
        fullName,
        phone,
        position: positionId,
        positionName: position?.name ?? '',
        dept: deptId,
        deptName: dept?.name ?? '',
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-light px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-md p-6 w-full max-w-sm space-y-4"
      >
        <div>
          <h1 className="text-lg font-semibold text-slate-800">ตั้งค่าโปรไฟล์เจ้าหน้าที่</h1>
          <p className="text-sm text-slate-500 mt-1">
            เข้าสู่ระบบด้วย {user?.email} ครั้งแรก กรุณากรอกข้อมูลของคุณ
          </p>
        </div>
        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทรศัพท์</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่ง</label>
          <select value={positionId} onChange={(e) => setPositionId(e.target.value)} className={selectClass}>
            <option value="">เลือกตำแหน่ง</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">สาขาวิชา</label>
          <select value={deptId} onChange={(e) => setDeptId(e.target.value)} className={selectClass}>
            <option value="">เลือกสาขาวิชา</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-md py-2 font-medium disabled:opacity-60"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกและเริ่มใช้งาน'}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-600 hover:bg-slate-50"
          >
            ออกจากระบบ
          </button>
        </div>
      </form>
    </div>
  )
}
