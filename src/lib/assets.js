// Path จาก public/ ต้องต่อกับ import.meta.env.BASE_URL เอง (ไม่ใช่ path สัมบูรณ์ "/...") เพราะ
// แอปนี้ deploy อยู่ใต้ "/rytc-fixit/" บน GitHub Pages ไม่ใช่ root ของโดเมน — ต่างจาก index.html
// ที่ Vite รู้จักและ rewrite href/src ให้อัตโนมัติ แต่ path ที่เขียนในโค้ด React เป็นแค่ string
// เฉยๆ ต้องต่อ base เองเสมอ (รูปแบบเดียวกับที่ RepairPrint.jsx ใช้สร้างลิงก์ QR)
export const FIXIT_LOGO = `${import.meta.env.BASE_URL}fixit-logo.png`
export const RYTC_LOGO = `${import.meta.env.BASE_URL}rytc-logo01.png`
