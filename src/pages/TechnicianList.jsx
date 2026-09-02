import { useEffect, useState } from 'react'
import { listDepts, listPositions } from '../lib/lookups'
import { createTechnician, deleteTechnician, subscribeTechnicians, updateTechnician } from '../lib/technicians'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary'

const emptyForm = { fullName: '', phone: '', nationalId: '', positionId: '', deptId: '' }

/** จัดการโปรไฟล์ช่างซ่อม (ผู้ลงมือซ่อมจริง — นักเรียน/นักศึกษา) ใช้เลือกในหน้าอัปเดตสถานะขั้น
 * "ตรวจสอบคุณภาพ" แทนการพิมพ์ชื่อ/สาขาวิชาเอง (ดู technicians.js, RepairStatus.jsx) */
export default function TechnicianList() {
  const [technicians, setTechnicians] = useState(null)
  const [positions, setPositions] = useState([])
  const [depts, setDepts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => subscribeTechnicians(setTechnicians), [])
  useEffect(() => {
    listPositions().then(setPositions).catch(() => setError('โหลดรายการตำแหน่งไม่สำเร็จ'))
    listDepts().then(setDepts).catch(() => setError('โหลดรายการสาขาวิชาไม่สำเร็จ'))
  }, [])

  function startEdit(tech) {
    setEditingId(tech.id)
    setForm({
      fullName: tech.fullName,
      phone: tech.phone,
      nationalId: tech.nationalId || '',
      positionId: tech.position,
      deptId: tech.dept,
    })
    setError('')
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.fullName.trim() || !form.phone.trim() || !form.positionId || !form.deptId) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง')
      return
    }
    setSaving(true)
    try {
      const position = positions.find((p) => p.id === form.positionId)
      const dept = depts.find((d) => d.id === form.deptId)
      const payload = {
        fullName: form.fullName,
        phone: form.phone,
        nationalId: form.nationalId || null,
        position: form.positionId,
        positionName: position?.name ?? '',
        dept: form.deptId,
        deptName: dept?.name ?? '',
      }
      if (editingId) {
        await updateTechnician(editingId, payload)
      } else {
        await createTechnician(payload)
      }
      cancelEdit()
    } catch (err) {
      setError(err.message || 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(tech) {
    if (!window.confirm(`ยืนยันลบ "${tech.fullName}" ออกจากรายชื่อช่างซ่อม?`)) return
    try {
      await deleteTechnician(tech.id)
      if (editingId === tech.id) cancelEdit()
    } catch (err) {
      window.alert(err.message || 'ลบไม่สำเร็จ')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-slate-800">จัดการช่างซ่อม</h1>
      <p className="text-sm text-slate-500">
        รายชื่อผู้ลงมือซ่อมจริง (เช่น นักเรียน/นักศึกษา) ใช้เลือกตอนอัปเดตสถานะขั้น "ตรวจสอบคุณภาพ"
      </p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">{editingId ? 'แก้ไขข้อมูลช่างซ่อม' : 'เพิ่มช่างซ่อม'}</h2>
        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อ-นามสกุล</label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">เบอร์โทรศัพท์</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              เลขบัตรประชาชน <span className="text-slate-400 font-normal">(ไม่บังคับ)</span>
            </label>
            <input
              value={form.nationalId}
              onChange={(e) => setForm({ ...form, nationalId: e.target.value.replace(/\D/g, '') })}
              inputMode="numeric"
              maxLength={13}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">ตำแหน่ง</label>
            <select
              value={form.positionId}
              onChange={(e) => setForm({ ...form, positionId: e.target.value })}
              className={inputClass}
            >
              <option value="">เลือกตำแหน่ง</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">สาขาวิชา</label>
            <select
              value={form.deptId}
              onChange={(e) => setForm({ ...form, deptId: e.target.value })}
              className={inputClass}
            >
              <option value="">เลือกสาขาวิชา</option>
              {depts.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-primary hover:bg-primary-hover text-white px-4 py-2 text-sm font-medium disabled:opacity-60"
          >
            {saving ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : '+ เพิ่มช่างซ่อม'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      {technicians === null && <p className="text-slate-400 text-center py-6">กำลังโหลด...</p>}
      {technicians !== null && technicians.length === 0 && (
        <p className="text-slate-400 text-center py-6">ยังไม่มีรายชื่อช่างซ่อม</p>
      )}

      <div className="space-y-2">
        {technicians?.map((tech) => (
          <div
            key={tech.id}
            className="bg-white rounded-xl shadow-sm border border-orange-100 p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div>
              <p className="font-semibold text-slate-800">{tech.fullName}</p>
              <p className="text-xs text-slate-500">
                {tech.positionName} · {tech.deptName} · โทร {tech.phone}
                {tech.nationalId && ` · เลขบัตรประชาชน ${tech.nationalId}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(tech)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                แก้ไข
              </button>
              <button
                type="button"
                onClick={() => handleDelete(tech)}
                className="rounded-md border border-danger text-danger px-3 py-1.5 text-sm hover:bg-red-50"
              >
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
