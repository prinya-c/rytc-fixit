import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PhotoCaptureInput from '../components/PhotoCaptureInput'
import { createRepair, newRepairId } from '../lib/repairs'
import { uploadRepairPhoto } from '../lib/storageUpload'
import {
  ACCESSORY_OPTIONS,
  CONDITION_OPTIONS,
  ITEM_CATEGORIES,
  OTHER_VALUE,
  SYMPTOM_OPTIONS,
  VEHICLE_TYPES,
} from '../lib/options'

const NATIONAL_ID_RE = /^\d{13}$/

function toggleValue(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function MultiSelectField({ label, options, selected, onToggle, otherText, onOtherText }) {
  const hasOther = selected.includes(OTHER_VALUE)
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {[...options, OTHER_VALUE].map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              type="button"
              key={opt}
              onClick={() => onToggle(opt)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? 'bg-primary text-white border-primary'
                  : 'border-slate-300 text-slate-600 hover:bg-orange-50'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
      {hasOther && (
        <input
          type="text"
          placeholder="โปรดระบุ"
          value={otherText}
          onChange={(e) => onOtherText(e.target.value)}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-orange-100 p-5 space-y-4">
      <h2 className="font-semibold text-slate-800">{title}</h2>
      {children}
    </section>
  )
}

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary'

export default function RepairForm() {
  const { user, staffProfile } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')

  const [category, setCategory] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [otherDetail, setOtherDetail] = useState('')
  const [registrationNo, setRegistrationNo] = useState('')

  const [symptoms, setSymptoms] = useState([])
  const [symptomOther, setSymptomOther] = useState('')
  const [condition, setCondition] = useState([])
  const [conditionOther, setConditionOther] = useState('')
  const [accessories, setAccessories] = useState([])
  const [accessoryOther, setAccessoryOther] = useState('')

  const [itemPhoto1, setItemPhoto1] = useState(null)
  const [itemPhoto2, setItemPhoto2] = useState(null)
  const [personPhoto, setPersonPhoto] = useState(null)

  const [staffName, setStaffName] = useState(staffProfile?.fullName ?? '')
  const [staffPhone, setStaffPhone] = useState(staffProfile?.phone ?? '')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function validate() {
    if (!fullName.trim()) return 'กรุณากรอกชื่อ-นามสกุลผู้ขอรับบริการ'
    if (!NATIONAL_ID_RE.test(nationalId.trim())) return 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'
    if (!phone.trim()) return 'กรุณากรอกหมายเลขโทรศัพท์'
    if (!category) return 'กรุณาเลือกประเภทของสิ่งที่นำมาซ่อม'
    if (category === 'vehicle' && !vehicleType) return 'กรุณาเลือกชนิดยานพาหนะ'
    if (category === 'other' && !otherDetail.trim()) return 'กรุณาระบุประเภทสิ่งของ'
    if (!itemPhoto1 || !itemPhoto2) return 'กรุณาถ่ายรูปเครื่องใช้ที่นำมาซ่อม 2 รูป'
    if (!personPhoto) return 'กรุณาถ่ายรูปคนคู่กับเครื่องใช้ 1 รูป'
    if (!staffName.trim() || !staffPhone.trim()) return 'กรุณากรอกข้อมูลเจ้าหน้าที่รับลงทะเบียน'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const repairId = newRepairId()
      const [itemPhoto1Url, itemPhoto2Url, personPhotoUrl] = await Promise.all([
        uploadRepairPhoto(repairId, 'intake/item-1.jpg', itemPhoto1),
        uploadRepairPhoto(repairId, 'intake/item-2.jpg', itemPhoto2),
        uploadRepairPhoto(repairId, 'intake/person.jpg', personPhoto),
      ])

      await createRepair(repairId, {
        requester: { fullName: fullName.trim(), nationalId: nationalId.trim(), phone: phone.trim() },
        item: {
          category,
          vehicleType: category === 'vehicle' ? vehicleType : null,
          otherDetail: category === 'other' ? otherDetail.trim() : null,
          registrationNo: registrationNo.trim() || null,
        },
        intakeCondition: {
          symptoms,
          symptomOtherDetail: symptoms.includes(OTHER_VALUE) ? symptomOther.trim() : null,
          condition,
          conditionOtherDetail: condition.includes(OTHER_VALUE) ? conditionOther.trim() : null,
          accessories,
          accessoryOtherDetail: accessories.includes(OTHER_VALUE) ? accessoryOther.trim() : null,
        },
        photosIntake: { itemPhotos: [itemPhoto1Url, itemPhoto2Url], personPhoto: personPhotoUrl },
        staffUid: user.uid,
        staffName: staffName.trim(),
        staffPhone: staffPhone.trim(),
      })

      navigate(`/repairs/${repairId}/print`, { replace: true })
    } catch (err) {
      setError(err.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-slate-800">ลงทะเบียนรับซ่อมใหม่</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Section title="ส่วนที่ 1: ข้อมูลผู้ขอรับบริการ">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                เลขบัตรประชาชน 13 หลัก *
              </label>
              <input
                inputMode="numeric"
                maxLength={13}
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value.replace(/\D/g, ''))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">หมายเลขโทรศัพท์ *</label>
              <input
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className={inputClass}
              />
            </div>
          </div>
        </Section>

        <Section title="ส่วนที่ 2: ประเภทของสิ่งที่นำมาซ่อม">
          <div className="flex flex-wrap gap-2">
            {ITEM_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  category === c.value
                    ? 'bg-primary text-white border-primary'
                    : 'border-slate-300 text-slate-600 hover:bg-orange-50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          {category === 'vehicle' && (
            <div className="flex flex-wrap gap-2">
              {VEHICLE_TYPES.map((v) => (
                <button
                  type="button"
                  key={v.value}
                  onClick={() => setVehicleType(v.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    vehicleType === v.value
                      ? 'bg-accent text-white border-accent'
                      : 'border-slate-300 text-slate-600 hover:bg-orange-50'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}
          {category === 'other' && (
            <input
              placeholder="โปรดระบุประเภทสิ่งของ"
              value={otherDetail}
              onChange={(e) => setOtherDetail(e.target.value)}
              className={inputClass}
            />
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              เลขทะเบียนของสิ่งของที่นำมาซ่อม (ถ้ามี)
            </label>
            <input value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} className={inputClass} />
          </div>
        </Section>

        <Section title="ส่วนที่ 3: อาการ สภาพ และรูปถ่าย">
          <MultiSelectField
            label="อาการที่เสีย"
            options={SYMPTOM_OPTIONS}
            selected={symptoms}
            onToggle={(v) => setSymptoms((prev) => toggleValue(prev, v))}
            otherText={symptomOther}
            onOtherText={setSymptomOther}
          />
          <MultiSelectField
            label="สภาพของเครื่องใช้ที่นำมาซ่อม"
            options={CONDITION_OPTIONS}
            selected={condition}
            onToggle={(v) => setCondition((prev) => toggleValue(prev, v))}
            otherText={conditionOther}
            onOtherText={setConditionOther}
          />
          <MultiSelectField
            label="อุปกรณ์ที่ติดมาด้วย"
            options={ACCESSORY_OPTIONS}
            selected={accessories}
            onToggle={(v) => setAccessories((prev) => toggleValue(prev, v))}
            otherText={accessoryOther}
            onOtherText={setAccessoryOther}
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PhotoCaptureInput label="รูปเครื่องใช้ 1" file={itemPhoto1} onChange={setItemPhoto1} required />
            <PhotoCaptureInput label="รูปเครื่องใช้ 2" file={itemPhoto2} onChange={setItemPhoto2} required />
            <PhotoCaptureInput
              label="รูปคนคู่กับเครื่องใช้"
              file={personPhoto}
              onChange={setPersonPhoto}
              capture="user"
              required
            />
          </div>
        </Section>

        <Section title="ส่วนที่ 4: ข้อมูลเจ้าหน้าที่รับลงทะเบียน">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล *</label>
              <input value={staffName} onChange={(e) => setStaffName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">หมายเลขโทรศัพท์ *</label>
              <input value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} className={inputClass} />
            </div>
          </div>
        </Section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-md py-2.5 font-medium disabled:opacity-60"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/repairs')}
            className="rounded-md border border-slate-300 px-5 py-2.5 text-slate-600 hover:bg-slate-50"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  )
}
