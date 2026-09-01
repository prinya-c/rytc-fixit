# RYTC-FixIT

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
   บริการ/สิ่งของ/เจ้าหน้าที่ และ QR Code 2 อัน: อันบน (ใหญ่) สำหรับเจ้าหน้าที่สแกนด้วยแอปเพื่อ
   เข้าหน้ารายละเอียด/ทำงานต่อ (ต้องล็อกอิน) อันล่าง (เล็ก) สำหรับประชาชนสแกนติดตามสถานะ
   (`/track/:publicId`, ไม่ต้องล็อกอิน)
3. **แก้ไขข้อมูลเริ่มต้น** (`/repairs/:id/edit`) — แก้ไขข้อมูลผู้ขอรับบริการ/สิ่งของ/อาการ-สภาพ-
   อุปกรณ์ที่กรอกผิดพลาดตอนรับลงทะเบียนได้ (ไม่รวมรูปถ่าย) ไม่แตะสถานะ/ประวัติงานซ่อม — ถ้าแก้
   ประเภทสิ่งของ ระบบจะปรับ `stats.byCategory` และรูปตัวแทนใน `publicRepairs` ให้ตรงกับของใหม่
4. **สแกน QR** (`/scan`) — เจ้าหน้าที่สแกน QR บนใบลงทะเบียนด้วยกล้องอุปกรณ์ที่ศูนย์
   ระบบพาไปหน้าขั้นตอนที่เหมาะกับสถานะปัจจุบันอัตโนมัติ (คัดแยก/ประเมิน หรืออัปเดตสถานะ)
5. **คัดแยก/ประเมิน** (`/repairs/:id/assess`) — บันทึกระดับความเสียหาย ผลตรวจสภาพเบื้องต้น
   และส่งต่อสถานะถัดไป (หรือ mark ว่าซ่อมไม่ได้พร้อมเหตุผล)
6. **อัปเดตสถานะ** (`/repairs/:id/status`) — ไล่สถานะงานซ่อมที่เลือกเองได้ (ดูหัวข้อสถานะงานซ่อม
   ด้านล่าง — ไม่รวมสถานะ 10 ซึ่งตั้งอัตโนมัติจากหน้าปิดงานเท่านั้น) พร้อมบันทึกละเอียด และ
   สวิตช์ "ไม่สามารถซ่อมได้" พร้อมเหตุผลได้ทุกขั้นตอน
7. **ปิดงาน/ส่งมอบคืน** (`/repairs/:id/close`) — ถ่ายรูปสิ่งของและผู้รับคืน บันทึกชื่อผู้รับคืน
   แล้วปิดงานเป็นสถานะ "ส่งมอบ/ส่งคืนแล้ว" (10) — เป็นทางเดียวที่จะไปสถานะนี้ได้
8. **Dashboard** (`/`, **หน้าสาธารณะ ไม่ต้องล็อกอิน**) — สรุปจำนวนงานซ่อมแยกตามประเภทและสถานะ
   ทั้งหมด อ่านจาก `stats/summary` เท่านั้น (ไม่มีข้อมูลส่วนบุคคล) มีปุ่ม "สแกน QR เพื่อติดตาม
   สถานะ" ให้ประชาชนทั่วไปกดสแกนได้เองโดยไม่ต้องล็อกอิน
9. **สแกน QR เพื่อติดตามสถานะ** (`/track`, **หน้าสาธารณะ**) — ประชาชนสแกน QR อันล่างบนใบ
   ลงทะเบียน (คนละอันกับ QR บนที่เจ้าหน้าที่ใช้) ด้วยกล้องมือถือทั่วไปหรือปุ่มนี้ในแอปก็ได้
   จะพาไปหน้า `/track/:publicId` แสดงประเภท/ชื่อ/ยี่ห้อสิ่งของ รูป และสถานะปัจจุบัน — อ่านจาก
   `publicRepairs` เท่านั้น (ไม่มีชื่อ/เบอร์โทร/เลขบัตรประชาชนของผู้ขอรับบริการ)

หน้าล็อกอินเจ้าหน้าที่อยู่ที่ `/staff/login` — **ไม่มีลิงก์จากหน้าไหนไปหาโดยตรง** ต้องพิมพ์ URL เอง
ตามที่ตกลงกันไว้ว่าไม่ต้องการให้ Dashboard ที่เปิดสาธารณะโชว์ลิงก์ล็อกอิน

## สถานะงานซ่อม

1. รับลงทะเบียน
2. คัดแยก/ประเมิน
3. ชะล้างดินโคลน
4. กำลังซ่อม ณ ศูนย์ซ่อมรถจักรยานยนต์
5. กำลังซ่อม ณ ศูนย์ซ่อมรถยนต์
6. กำลังซ่อม ณ สถานีซ่อมและบำรุงรักษาเครื่องใช้ไฟฟ้า
7. ตรวจสอบคุณภาพ
8. ซ่อมเสร็จแล้ว/รอส่งมอบ
9. ไม่สามารถซ่อมได้/รอส่งคืน
10. ส่งมอบ/ส่งคืนแล้ว

สถานะ 1-9 เลือกได้เองจากดรอปดาวน์ "ส่งต่อไปสถานะ" ในหน้าคัดแยก/ประเมินและอัปเดตสถานะ
(`STATUSES_SELECTABLE` ใน `src/lib/options.js`) ส่วนสถานะ **10 ตั้งอัตโนมัติได้ทางเดียว
จากปุ่ม "ปิดงาน/ส่งมอบ" เท่านั้น** (`closeRepair()`) — ไม่ให้เลือกเองเพื่อกันสับสนกับปุ่มปิดงาน
ที่ทำหน้าที่นี้อยู่แล้ว รายการที่ประเมินว่า "ไม่สามารถซ่อมได้" จะไปสถานะ 9 (รอส่งคืน) ก่อน แล้วต้อง
ผ่านหน้าปิดงานเพื่อบันทึกผู้รับคืน+รูปจึงจะเป็นสถานะ 10 ได้เหมือนกัน โดยธง `unrepairable = true`
และเหตุผลจะถูกบันทึกไว้เป็นหลักฐานตลอด ปุ่ม "พิมพ์ใบรายงานซ่อม" ใช้ได้เฉพาะรายการที่ซ่อมสำเร็จ
(`!unrepairable`) และอยู่ในสถานะ 8 หรือ 10 เท่านั้น

## โครงสร้างข้อมูล Firestore (database `fixit`)

```
staff/{uid}                          // doc id = Firebase Auth uid, สร้างอัตโนมัติตอน login ครั้งแรก
  fullName, phone, email: string
  position: string             // doc id จาก collection position (denormalize positionName ไว้ด้วย)
  positionName: string
  dept: string                 // doc id จาก collection dept (denormalize deptName ไว้ด้วย)
  deptName: string
  createdAt: timestamp

dept/{id}                            // ข้อมูลอ้างอิงคงที่ แอดมินเพิ่ม/แก้ผ่าน Firebase Console
  "dept-name": string                // เท่านั้น (อ่านอย่างเดียวจากแอป — ดู src/lib/lookups.js)

position/{id}                        // เช่นเดียวกับ dept — doc id เป็นรหัสตำแหน่ง เช่น "1001"
  "staff-position": string

repairs/{repairId}                   // doc id = "{เลขบัตรประชาชนผู้ขอรับบริการ}-dd-mm-yyyy-HH-mm-ss"
                                      // (เวลาเครื่อง ณ ตอนกดบันทึก) ดู buildRepairId() ใน repairs.js
  requester: { fullName, nationalId, phone,
               houseNo?, moo?, subDistrict?, district?, province? }
  item: { category, vehicleType?, itemName?, brand?, model?, registrationNo? }
                                 // itemName บังคับกรอกทุก category ยกเว้น "vehicle"
                                 // registrationNo บังคับกรอกเฉพาะ category = "vehicle" เท่านั้น
  publicId: string              // doc id ของสำเนาใน publicRepairs — คนละค่ากับ repairId โดย
                                 // ตั้งใจ เพื่อไม่ให้เลขบัตรประชาชนรั่วผ่าน document id ของ
                                 // collection ที่เปิดอ่านสาธารณะ
  intakeCondition: { symptoms[], symptomOtherDetail?, condition[], conditionOtherDetail?,
                      accessories[], accessoryOtherDetail? }
  photosIntake: { itemPhotos: [url, url], personPhoto: url }
  intake: { staffUid, staffName, staffPhone, registeredAt }
  status: number (1-10, ดูหัวข้อสถานะงานซ่อม)
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
                                      // ใช้โดย Dashboard drilldown และหน้าติดตามสถานะ /track/:publicId
  category, vehicleType?, itemName?, brand?, model?, status, statusLabel, unrepairable,
  itemPhoto, createdAt, updatedAt

stats/summary                        // doc เดียว, อ่านได้แบบสาธารณะ (ไม่มีข้อมูลส่วนบุคคล)
  total, byCategory: { tool_machine, appliance, vehicle, other },
  byStatus: { '1': n, ..., '10': n },
  byCategoryStatus: { [category]: { '1': n, ..., '10': n } },  // ใช้ทำ drilldown แบบไขว้กัน
  unrepairableCount, updatedAt
```

## ใบรายงานซ่อม (`/repairs/:id/report`)

ปุ่ม "พิมพ์ใบรายงานซ่อม" จะโผล่ในหน้ารายละเอียดเฉพาะรายการที่ซ่อมสำเร็จ (`!unrepairable`)
และอยู่ในสถานะ **8 (ซ่อมเสร็จแล้ว/รอส่งมอบ) หรือ 10 (ส่งมอบ/ส่งคืนแล้ว)** เท่านั้น
ออกแบบตามฟอร์มกระดาษเดิมของศูนย์ (A4 แนวตั้ง หน้าเดียว) — ฟิลด์ที่ derive จากข้อมูลอื่นแทนที่จะ
เก็บแยก: ปีงบประมาณ (คำนวณจากวันที่ลงทะเบียน), วันที่เริ่มซ่อม (จาก `statusLogs` log แรกที่เข้า
สถานะซ่อม 4/5/6), วันที่ซ่อมเสร็จ (จาก `qualityCheck.checkedAt`)

**Storage** (`fixit/{repairId}/...`): `intake/item-1.jpg`, `intake/item-2.jpg`,
`intake/person.jpg`, `closure/item.jpg`, `closure/person.jpg`

## การใช้งานช่วงสัญญาณอินเทอร์เน็ตขาดหาย

หน่วยออกให้บริการมักไปตั้งศูนย์ในพื้นที่ที่สัญญาณอินเทอร์เน็ตไม่เสถียร แอปจึงรองรับการทำงาน
"ต่อเนื่องชั่วคราว" ระหว่างขาดสัญญาณ:

- **ข้อมูลฟอร์ม (ลงทะเบียน/ประเมิน/อัปเดตสถานะ/ปิดงาน)**: Firestore SDK เปิด offline persistence
  ไว้ (`src/lib/firebase.js` — `persistentLocalCache` + `persistentMultipleTabManager`) ข้อมูล
  ที่บันทึกช่วงออฟไลน์จะถูกเก็บไว้ใน IndexedDB ของเบราว์เซอร์ก่อน แล้ว sync ขึ้น Firebase
  อัตโนมัติทันทีที่สัญญาณกลับมา ไม่ต้องกดซิงก์เอง
- **ตัวเลขสถิติ** (`stats/summary`): ใช้ `increment()` แทน `runTransaction()` เพราะ transaction
  ต้องอ่านค่าจาก server ก่อนเขียนเสมอ ใช้ตอนออฟไลน์ไม่ได้ ส่วน `increment()` เป็นคำสั่งเดลต้าที่
  SDK คิวไว้ในเครื่องแล้วส่งไป apply ที่ server เอง
- **รูปภาพ (ลงทะเบียน/ปิดงาน)**: Firebase Storage SDK ไม่มีคิวออฟไลน์ในตัว จึงเก็บไฟล์รูปที่
  อัปโหลดไม่สำเร็จไว้ใน IndexedDB ของเบราว์เซอร์เอง (`src/lib/offlineQueue.js`) — ตอนกดบันทึก
  ถ้าออฟไลน์อยู่หรืออัปโหลดไม่สำเร็จกลางคัน จะข้ามไปเก็บคิวไว้ทันทีโดยไม่บล็อกการบันทึกฟอร์ม
  แล้วไล่อัปโหลดอัตโนมัติทันทีที่เบราว์เซอร์กลับมาออนไลน์ (หรือเปิดแอปขึ้นมาใหม่ขณะมีสัญญาณ)
  รูปที่ยังรอคิวจะแสดงเป็นช่อง "🕒 รอซิงก์รูป" แทนรูปจริงในหน้ารายละเอียด/รายการ/Dashboard
  จนกว่าจะอัปโหลดสำเร็จ (ไม่ต้องรีเฟรชหน้าเอง)
- **แถบแจ้งเตือน**: เมื่อเบราว์เซอร์ตรวจพบว่าออฟไลน์ (`navigator.onLine`) จะมีแถบสีเหลืองด้านบนแจ้ง
  เตือนเจ้าหน้าที่ และเมื่อกลับมาออนไลน์แล้วแต่ยังมีรูปค้างคิวอยู่ จะมีแถบสีฟ้าแจ้งว่ากำลังซิงก์ให้
  อัตโนมัติ (`src/components/OnlineStatusBanner.jsx`)
- **ข้อจำกัด**: คิวรูปภาพเก็บไว้เฉพาะในเบราว์เซอร์/อุปกรณ์เครื่องที่บันทึกไว้เท่านั้น ถ้าล้างข้อมูล
  เว็บไซต์ (clear site data) หรือเปลี่ยนไปใช้อุปกรณ์อื่นก่อนสัญญาณกลับมา รูปที่ค้างคิวจะหายไปและ
  ต้องอัปโหลดใหม่ด้วยตนเอง (ข้อมูลฟอร์มอื่นๆ ที่ Firestore ไม่ได้รับผลกระทบส่วนนี้)
- **ตัวแอปเอง (PWA/Service Worker)**: เฟส 1-2 ด้านบนทำให้ "ข้อมูล" ใช้งานต่อได้ตอนออฟไลน์ แต่ถ้า
  เบราว์เซอร์ยังไม่เคยโหลดไฟล์ของแอป (JS/CSS/HTML) มาก่อนเลย ก็ยังเปิดแอปตอนไม่มีสัญญาณไม่ได้อยู่ดี
  จึงเพิ่ม Service Worker ผ่าน `vite-plugin-pwa` (`vite.config.js`) ให้แคช "app shell" (ไฟล์ JS/
  CSS/HTML/ไอคอน) ไว้ในเครื่องตั้งแต่เปิดใช้งานครั้งแรกที่มีสัญญาณ ครั้งต่อไปเปิดแอปได้ทันทีแม้
  ไม่มีสัญญาณเลยตั้งแต่ก่อนโหลดหน้าด้วยซ้ำ (ทดสอบแล้วด้วย Playwright: ตัดเน็ตทั้งหมดแล้ว reload
  หน้ายังขึ้นปกติ) รองรับ "ติดตั้งเป็นแอป" บนมือถือ/เดสก์ท็อป (Add to Home Screen) ด้วย — เมื่อมี
  ไฟล์ชุดใหม่หลัง deploy จะมีแถบสีส้มด้านบนแจ้งให้กด "อัปเดตตอนนี้" เอง (ไม่สลับเวอร์ชันกลางคันตอน
  กำลังกรอกฟอร์มอยู่โดยไม่รู้ตัว — ดู `src/components/PwaUpdatePrompt.jsx`) ส่วนการเชื่อมต่อ
  Firestore/Storage/Auth เอง Service Worker จะไม่เข้าไปยุ่งด้วย ปล่อยให้ SDK จัดการตามเฟส 1-2

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

Host บน **Cloudflare Pages** (ไม่ใช่ GitHub Pages อีกต่อไป) — เชื่อมต่อ repo นี้กับ Cloudflare
Pages ไว้แล้ว (Build command: `npm run build`, Output directory: `dist`) push ขึ้น branch `main`
แล้ว Cloudflare จะ build และ deploy ให้อัตโนมัติ ไม่ต้องมี GitHub Actions workflow ใดๆ

แอปถูก serve ที่ root ของโดเมน (ตั้งค่า `base: '/'` ใน `vite.config.js` ไว้ตรงกับการ host แบบนี้
แล้ว — **ถ้าเปลี่ยนไป host แบบอื่นที่อยู่ใต้ subpath (เช่น GitHub Pages เดิม) ต้องกลับมาแก้ `base`
ตรงนี้ให้ตรงกับ path จริงด้วยเสมอ** ไม่งั้นไฟล์ JS/CSS/รูปภาพจะโหลดไม่ขึ้นทั้งหมด) เข้าถึงได้ 2 ทาง:

- `https://rytc-fixit.pages.dev` (โดเมนของ Cloudflare Pages เอง)
- `https://fixit-app.rytc.ac.th` (custom domain ผูกกับ Cloudflare Pages แล้ว — โดเมนนี้ใช้สร้าง
  URL เต็มของทั้ง 2 QR บนใบลงทะเบียน ดู `RepairPrint.jsx`: `window.location.origin` ตอน build
  จริงจะได้โดเมนนี้)

**ต้องเพิ่มทั้ง 2 โดเมนข้างต้นเข้า Firebase Console → Authentication → Settings → Authorized
domains** ไม่เช่นนั้นปุ่ม "เข้าสู่ระบบด้วย Google" จะ error เพราะโดเมนไม่ได้รับอนุญาต — เป็นขั้นตอน
ที่ต้องทำเองผ่าน Firebase Console เท่านั้น (ไม่มีใน repo ให้ deploy)
