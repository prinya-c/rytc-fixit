// ตั้งค่าจริงผ่าน env var VITE_APP_VERSION ตอน build บน GitHub Actions
// (ดู .github/workflows/deploy.yml) เลขท้าย (z ใน x.y.z) คือ run number ที่ไล่ขึ้นเองทุกครั้งที่ deploy
// ตอนรัน `npm run dev` ในเครื่อง จะไม่มีค่านี้ เลย fallback เป็น "dev"
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev'
