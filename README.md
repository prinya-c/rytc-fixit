# RYTC-Fix

แอประบบลงทะเบียนและติดตามงานซ่อม สำหรับโครงการ **"อาชีวะอาสา! ศูนย์ซ่อมสร้างเพื่อชุมชน
(Fix it Center)"** วิทยาลัยเทคนิคระยอง — โครงการของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.)
ที่ระดมนักเรียน นักศึกษา และครูอาชีวะ ออกให้บริการซ่อมเครื่องมือ เครื่องใช้ไฟฟ้า
เครื่องจักรกลการเกษตร และยานพาหนะให้ประชาชนโดยไม่คิดค่าใช้จ่าย พร้อมถ่ายทอดความรู้การดูแล
รักษาเบื้องต้น

สร้างด้วย Vite + React + Tailwind CSS เก็บข้อมูลใน Firebase Firestore (database `fixit`)
และรูปถ่ายใน Firebase Storage ใช้ Firebase Auth (Google Sign-In จำกัดเฉพาะบัญชี
`@technicrayong.ac.th`) สำหรับเจ้าหน้าที่

## การทำงานของแอป

1. **ลงทะเบียนรับซ่อม** (`/repairs/new`, ต้องล็อกอิน) — เจ้าหน้าที่กรอกข้อมูลผู้ขอรับบริการ,
   ประเภทสิ่งของ, อาการ/สภาพ/อุปกรณ์ที่ติดมา, ถ่ายรูป 3 รูป (เครื่องใช้ 2 + คนคู่กับเครื่องใช้ 1)
   บันทึกแล้วระบบพาไปหน้าพิมพ์ใบลงทะเบียนทันที
2. **พิมพ์ใบลงทะเบียน** (`/repairs/:id/print`) — A4 แบ่ง 4 ช่องเท่ากัน แต่ละช่องมีข้อมูลผู้ขอรับ
   บริการ/สิ่งของ/เจ้าหน้าที่ และ QR Code (เก็บลิงก์ไปหน้ารายละเอียดของรายการนี้)
3. **สแกน QR** (`/scan`) — เจ้าหน้าที่สแกน QR บนใบลงทะเบียนด้วยกล้องอุปกรณ์ที่ศูนย์
   ระบบพาไปหน้าขั้นตอนที่เหมาะกับสถานะปัจจุบันอัตโนมัติ (คัดแยก/ประเมิน หรืออัปเดตสถานะ)
4. **คัดแยก/ประเมิน** (`/repairs/:id/assess`) — บันทึกระดับความเสียหาย ผลตรวจสภาพเบื้องต้น
   และส่งต่อสถานะถัดไป (หรือ mark ว่าซ่อมไม่ได้พร้อมเหตุผล)
5. **อัปเดตสถานะ** (`/repairs/:id/status`) — ไล่สถานะงานซ่อมทั้ง 8 ขั้น พร้อมบันทึกละเอียด และ
   สวิตช์ "ไม่สามารถซ่อมได้" พร้อมเหตุผลได้ทุกขั้นตอน
6. **ปิดงาน/ส่งมอบคืน** (`/repairs/:id/close`) — ถ่ายรูปสิ่งของและผู้รับคืน บันทึกชื่อผู้รับคืน
   แล้วปิดงานเป็นสถานะ "ส่งมอบ"
7. **Dashboard** (`/`, **หน้าสาธารณะ ไม่ต้องล็อกอิน**) — สรุปจำนวนงานซ่อมแยกตามประเภทและสถานะ
   ทั้ง 8 ขั้น อ่านจาก `stats/summary` เท่านั้น (ไม่มีข้อมูลส่วนบุคคล)

หน้าล็อกอินเจ้าหน้าที่อยู่ที่ `/staff/login` — **ไม่มีลิงก์จากหน้าไหนไปหาโดยตรง** ต้องพิมพ์ URL เอง
ตามที่ตกลงกันไว้ว่าไม่ต้องการให้ Dashboard ที่เปิดสาธารณะโชว์ลิงก์ล็อกอิน

## สถานะงานซ่อม (8 ขั้น)

1. รับลงทะเบียน
2. คัดแยก/ประเมิน
3. ชะล้างดินโคลน
4. กำลังซ่อม ณ ศูนย์ซ่อมรถจักรยานยนต์
5. กำลังซ่อม ณ ศูนย์ซ่อมรถยนต์
6. กำลังซ่อม ณ สถานีซ่อมและบำรุงรักษาเครื่องใช้ไฟฟ้า
7. ตรวจสอบคุณภาพ
8. ส่งมอบ

รายการที่ประเมินว่า "ไม่สามารถซ่อมได้" ยังต้องผ่านสถานะ 8 เพื่อคืนของ เพียงแต่ธง
`unrepairable = true` และเหตุผลจะถูกบันทึกไว้เป็นหลักฐาน

## โครงสร้างข้อมูล Firestore (database `fixit`)

```
staff/{uid}                          // doc id = Firebase Auth uid, สร้างอัตโนมัติตอน login ครั้งแรก
  fullName, phone, email: string
  createdAt: timestamp

repairs/{repairId}                   // doc id = "{เลขบัตรประชาชนผู้ขอรับบริการ}-dd-mm-yyyy-HH-mm-ss"
                                      // (เวลาเครื่อง ณ ตอนกดบันทึก) ดู buildRepairId() ใน repairs.js
  requester: { fullName, nationalId, phone,
               houseNo?, moo?, subDistrict?, district?, province? }
  item: { category, vehicleType?, otherDetail?, registrationNo? }
  publicId: string              // doc id ของสำเนาใน publicRepairs — คนละค่ากับ repairId โดย
                                 // ตั้งใจ เพื่อไม่ให้เลขบัตรประชาชนรั่วผ่าน document id ของ
                                 // collection ที่เปิดอ่านสาธารณะ
  intakeCondition: { symptoms[], symptomOtherDetail?, condition[], conditionOtherDetail?,
                      accessories[], accessoryOtherDetail? }
  photosIntake: { itemPhotos: [url, url], personPhoto: url }
  intake: { staffUid, staffName, staffPhone, registeredAt }
  status: number (1-8)
  statusLabel: string
  unrepairable: boolean
  unrepairableReason?, unrepairableNote?: string
  assessment?: { inspectionNotes, damageLevel, causeNote?, assessedByUid, assessedByName, assessedAt }
  qualityCheck?: { technicianName, technicianNationalId?, department?, supervisingTeacher?,
                    repairDetails?, checkedByUid, checkedByName, checkedAt }
                 // กรอกตอนอัปเดตสถานะเป็น "ตรวจสอบคุณภาพ" (7) — ใช้พิมพ์ใบรายงานซ่อม
  closure?: { itemPhoto, personPhoto, receiverName, receiverRelation?, closedByUid,
              closedByName, closedAt }
  createdAt, updatedAt: timestamp

repairs/{repairId}/statusLogs/{logId}   // ประวัติการเปลี่ยนสถานะทุกครั้ง
  status, statusLabel, note?, reasonNote?, changedByUid, changedByName, changedAt
  // log แรกที่ status อยู่ใน 4/5/6 ใช้เป็น "วันที่เริ่มซ่อม" ในใบรายงานซ่อม (ไม่มีฟิลด์แยก)

publicRepairs/{publicId}             // สำเนาไม่มี PII ของ repairs/{repairId} (doc id = publicId
                                      // ของรายการนั้น ไม่ใช่ repairId), อ่านสาธารณะได้
  category, vehicleType?, status, statusLabel, unrepairable, itemPhoto, createdAt, updatedAt

stats/summary                        // doc เดียว, อ่านได้แบบสาธารณะ (ไม่มีข้อมูลส่วนบุคคล)
  total, byCategory: { tool_machine, appliance, vehicle, other },
  byStatus: { '1': n, ..., '8': n },
  byCategoryStatus: { [category]: { '1': n, ..., '8': n } },  // ใช้ทำ drilldown แบบไขว้กัน
  unrepairableCount, updatedAt
```

## ใบรายงานซ่อม (`/repairs/:id/report`)

ปุ่ม "พิมพ์ใบรายงานซ่อม" จะโผล่ในหน้ารายละเอียดเฉพาะเมื่อสถานะ = **ส่งมอบ (8)** เท่านั้น
ออกแบบตามฟอร์มกระดาษเดิมของศูนย์ (A4 แนวตั้ง หน้าเดียว) — ฟิลด์ที่ derive จากข้อมูลอื่นแทนที่จะ
เก็บแยก: ปีงบประมาณ (คำนวณจากวันที่ลงทะเบียน), วันที่เริ่มซ่อม (จาก `statusLogs` log แรกที่เข้า
สถานะซ่อม 4/5/6), วันที่ซ่อมเสร็จ (จาก `qualityCheck.checkedAt`)

**Storage** (`fixit/{repairId}/...`): `intake/item-1.jpg`, `intake/item-2.jpg`,
`intake/person.jpg`, `closure/item.jpg`, `closure/person.jpg`

## ⚙️ การตั้งค่า Firebase ก่อนใช้งานจริง (ต้องทำผ่าน Firebase Console)

แอปนี้ใช้ Firebase project เดิม `rytc-app` (โปรเจกต์เดียวกับ `rytc-behavior-score`) แต่ต้องเปิด
ทรัพยากรใหม่ก่อนใช้งานจริง:

1. **สร้าง Firestore database ชื่อ `fixit`** (แยกจาก `(default)`/`out-of`/`behavior-score` ที่มี
   อยู่แล้ว) ผ่าน Firebase Console หรือคำสั่ง:
   ```bash
   firebase firestore:databases:create fixit --project rytc-app --location <region>
   ```
2. **เปิด Firebase Authentication → Sign-in method → Google** (โปรเจกต์นี้ยังไม่เคยเปิด
   Auth มาก่อน) — ไม่ต้องสร้างบัญชีเจ้าหน้าที่ทีละคนใน Console เพราะแอปจำกัดสิทธิ์ด้วย
   โดเมนอีเมลแทน (ดูข้อ 3)
3. **การจำกัดสิทธิ์เจ้าหน้าที่**: แอปอนุญาตเฉพาะบัญชี Google ที่ลงท้ายด้วย
   `@technicrayong.ac.th` เท่านั้น (เช็คทั้งฝั่ง client ใน `src/context/AuthContext.jsx`
   และบังคับจริงอีกชั้นใน `firestore.rules`/`storage.rules` ผ่าน
   `request.auth.token.email.matches(...)`) ใครก็ตามที่มีบัญชีโดเมนนี้ล็อกอินเข้าระบบได้ทันที
   โดยไม่ต้องให้แอดมินสร้างบัญชีล่วงหน้า — ถ้าต้องการจำกัดเฉพาะบุคคลที่คัดเลือกไว้ (ไม่ใช่ทั้งโดเมน)
   ต้องปรับ `isStaff()` ใน `firestore.rules` และเงื่อนไขใน `storage.rules` เพิ่มเป็น allow-list
   รายอีเมลแทน
4. **Deploy Security Rules** (Firestore + Storage):
   ```bash
   firebase deploy --only firestore:rules,storage --project rytc-app
   ```

## การพัฒนา

```bash
npm install
npm run dev
```

## Deploy

Push ขึ้น branch `main` แล้ว GitHub Actions (`.github/workflows/deploy.yml`) จะ build และ
deploy ให้อัตโนมัติผ่าน GitHub Pages

**ก่อนใช้งานครั้งแรก** ต้องเปิดใช้ GitHub Pages แบบ "GitHub Actions" source ที่
Settings → Pages → Build and deployment → Source ของ repository นี้ก่อน ไม่เช่นนั้น workflow
จะรันผ่านแต่ deploy step จะ fail

แอปจะถูก serve ที่ `https://<owner>.github.io/rytc-fixit/`
(ตั้งค่า `base` ใน `vite.config.js` ไว้ตรงกับ path นี้แล้ว)
