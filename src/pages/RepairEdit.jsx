import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { updateRepairIntake, subscribeRepair } from '../lib/repairs'
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

export default function RepairEdit() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [repair, setRepair] = useState(undefined)
  const [loaded, setLoaded] = useState(false)

  const [fullName, setFullName] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [phone, setPhone] = useState('')
  const [houseNo, setHouseNo] = useState('')
  const [moo, setMoo] = useState('')
  const [subDistrict, setSubDistrict] = useState('')
  const [district, setDistrict] = useState('')
  const [province, setProvince] = useState('')

  const [category, setCategory] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [itemName, setItemName] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [registrationNo, setRegistrationNo] = useState('')

  const [symptoms, setSymptoms] = useState([])
  const [symptomOther, setSymptomOther] = useState('')
  const [condition, setCondition] = useState([])
  const [conditionOther, setConditionOther] = useState('')
  const [accessories, setAccessories] = useState([])
  const [accessoryOther, setAccessoryOther] = useState('')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => subscribeRepair(id, setRepair), [id])

  // เติมข้อมูลลงฟอร์มแค่ครั้งแรกที่โหลดสำเร็จ — กันไม่ให้ข้อมูลที่กำลังแก้อยู่ถูกทับ
  // ถ้ามีการเปลี่ยนแปลงอื่น (เช่น สถานะ) เกิดขึ้นที่รายการนี้พร้อมกันระหว่างแก้ไข
  useEffect(() => {
    if (!repair || loaded) return
    setFullName(repair.requester?.fullName ?? '')
    setNationalId(repair.requester?.nationalId ?? '')
    setPhone(repair.requester?.phone ?? '')
    setHouseNo(repair.requester?.houseNo ?? '')
    setMoo(repair.requester?.moo ?? '')
    setSubDistrict(repair.requester?.subDistrict ?? '')
    setDistrict(repair.requester?.district ?? '')
    setProvince(repair.requester?.province ?? '')

    setCategory(repair.item?.category ?? '')
    setVehicleType(repair.item?.vehicleType ?? '')
    setItemName(repair.item?.itemName ?? '')
    setBrand(repair.item?.brand ?? '')
    setModel(repair.item?.model ?? '')
    setRegistrationNo(repair.item?.registrationNo ?? '')

    setSymptoms(repair.intakeCondition?.symptoms ?? [])
    setSymptomOther(repair.intakeCondition?.symptomOtherDetail ?? '')
    setCondition(repair.intakeCondition?.condition ?? [])
    setConditionOther(repair.intakeCondition?.conditionOtherDetail ?? '')
    setAccessories(repair.intakeCondition?.accessories ?? [])
    setAccessoryOther(repair.intakeCondition?.accessoryOtherDetail ?? '')
    setLoaded(true)
  }, [repair, loaded])

  if (repair === undefined) return <p className="text-center text-slate-400 py-10">กำลังโหลด...</p>
  if (repair === null) return <p className="text-center text-danger py-10">ไม่พบรายการนี้</p>

  function validate() {
    if (!fullName.trim()) return 'กรุณากรอกชื่อ-นามสกุลผู้ขอรับบริการ'
    if (!NATIONAL_ID_RE.test(nationalId.trim())) return 'เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก'
    if (!phone.trim()) return 'กรุณากรอกหมายเลขโทรศัพท์'
    if (!category) return 'กรุณาเลือกประเภทของสิ่งที่นำมาซ่อม'
    if (category === 'vehicle' && !vehicleType) return 'กรุณาเลือกชนิดยานพาหนะ'
    if (category !== 'vehicle' && !itemName.trim()) return 'กรุณาระบุชื่อของสิ่งของ'
    if (category === 'vehicle' && !registrationNo.trim()) return 'กรุณากรอกเลขทะเบียนรถ'
    if (!brand.trim()) return 'กรุณากรอกยี่ห้อ (หากไม่มีให้ใส่เครื่องหมาย -)'
    if (!model.trim()) return 'กรุณากรอกรุ่น (หากไม่มีให้ใส่เครื่องหมาย -)'
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
      await updateRepairIntake(id, {
        requester: {
          fullName: fullName.trim(),
          nationalId: nationalId.trim(),
          phone: phone.trim(),
          houseNo: houseNo.trim() || null,
          moo: moo.trim() || null,
          subDistrict: subDistrict.trim() || null,
          district: district.trim() || null,
          province: province.trim() || null,
        },
        item: {
          category,
          vehicleType: category === 'vehicle' ? vehicleType : null,
          itemName: category !== 'vehicle' ? itemName.trim() : null,
          brand: brand.trim() || null,
          model: model.trim() || null,
          registrationNo: category === 'vehicle' ? registrationNo.trim() : null,
        },
        intakeCondition: {
          symptoms,
          symptomOtherDetail: symptoms.includes(OTHER_VALUE) ? symptomOther.trim() : null,
          condition,
          conditionOtherDetail: condition.includes(OTHER_VALUE) ? conditionOther.trim() : null,
          accessories,
          accessoryOtherDetail: accessories.includes(OTHER_VALUE) ? accessoryOther.trim() : null,
        },
      })
      navigate(`/repairs/${id}`)
    } catch (err) {
      setError(err.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-xl font-bold text-slate-800">แก้ไขข้อมูลเริ่มต้น</h1>
      <p className="text-sm text-slate-500">รหัสรายการ: {repair.id}</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-sm text-danger bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <Section title="ข้อมูลผู้ขอรับบริการ">
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">บ้านเลขที่</label>
              <input value={houseNo} onChange={(e) => setHouseNo(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">หมู่ที่</label>
              <input value={moo} onChange={(e) => setMoo(e.target.value)} className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">ตำบล</label>
              <input value={subDistrict} onChange={(e) => setSubDistrict(e.target.value)} className={inputClass} />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">อำเภอ</label>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">จังหวัด</label>
            <input value={province} onChange={(e) => setProvince(e.target.value)} className={inputClass} />
          </div>
        </Section>

        <Section title="ประเภทของสิ่งที่นำมาซ่อม">
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
          {category && category !== 'vehicle' && (
            <input
              placeholder="โปรดระบุชื่อของสิ่งของ"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className={inputClass}
            />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ยี่ห้อ *</label>
              <input
                placeholder="หากไม่มีให้ใส่เครื่องหมาย -"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รุ่น *</label>
              <input
                placeholder="หากไม่มีให้ใส่เครื่องหมาย -"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {category === 'vehicle' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เลขทะเบียนรถ *</label>
              <input
                value={registrationNo}
                onChange={(e) => setRegistrationNo(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </Section>

        <Section title="อาการ สภาพ และอุปกรณ์ที่ติดมาด้วย">
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
          <p className="text-xs text-slate-400">
            รูปถ่ายตอนรับลงทะเบียนไม่สามารถแก้ไขจากหน้านี้ได้
          </p>
        </Section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-md py-2.5 font-medium disabled:opacity-60"
          >
            {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/repairs/${id}`)}
            className="rounded-md border border-slate-300 px-5 py-2.5 text-slate-600 hover:bg-slate-50"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  )
}
