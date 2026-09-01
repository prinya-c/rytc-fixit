// ตั้งค่าจริงผ่าน env var VITE_APP_VERSION ตอน build (ดู vite.config.js — Cloudflare Pages ไม่มี
// env var ให้ตั้งเอง จึงใช้ CF_PAGES_COMMIT_SHA ที่ Cloudflare ฉีดให้อัตโนมัติเป็น fallback แทน)
// ตอนรัน `npm run dev` ในเครื่อง จะไม่มีค่านี้ เลย fallback เป็น "dev"
export const APP_VERSION = import.meta.env.VITE_APP_VERSION || 'dev'
