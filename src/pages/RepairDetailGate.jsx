import CompleteProfile from '../components/CompleteProfile'
import { useAuth } from '../context/AuthContext'
import RepairDetail from './RepairDetail'
import RepairPublicStatus from './RepairPublicStatus'

/**
 * หน้า /repairs/:id ใช้ QR อันบนใบลงทะเบียนใบเดียวกันทั้งเจ้าหน้าที่และคนทั่วไป (ตั้งใจไม่แยก
 * ลิงก์) จึงต้องแยกพฤติกรรมตาม auth state ตรงนี้แทนการ redirect ไปหน้าล็อกอินเหมือน PrivateRoute
 * ทั่วไป: ล็อกอินแล้ว (และตั้งค่าโปรไฟล์เจ้าหน้าที่ครบแล้ว) เห็นหน้ารายละเอียดเต็ม ยังไม่ล็อกอิน
 * เห็นแค่สถานะงานซ่อม (RepairPublicStatus, ไม่มีข้อมูลส่วนบุคคล)
 */
export default function RepairDetailGate() {
  const { user, staffProfile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        กำลังโหลด...
      </div>
    )
  }

  if (!user) {
    return <RepairPublicStatus />
  }

  if (!staffProfile) {
    return <CompleteProfile />
  }

  return <RepairDetail />
}
