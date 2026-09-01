import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://rytc-fixit.pages.dev (Cloudflare Pages, root of the domain — not a
// subpath like GitHub Pages was) — auto-deploys on every push to `main`.
//
// เลขเวอร์ชันที่ footer (APP_VERSION, ดู src/lib/version.js) ปกติมาจาก env var VITE_APP_VERSION
// ที่ตั้งเองตอน build — Cloudflare Pages ไม่มีให้ตั้งในโค้ดแบบ GitHub Actions เดิม จึงใช้
// CF_PAGES_COMMIT_SHA ที่ Cloudflare ฉีดให้อัตโนมัติทุก build เป็น fallback แทน ไม่ต้องไปตั้งค่า
// อะไรเพิ่มใน Cloudflare Pages dashboard
const appVersion =
  process.env.VITE_APP_VERSION ||
  (process.env.CF_PAGES_COMMIT_SHA ? `cf.${process.env.CF_PAGES_COMMIT_SHA.slice(0, 7)}` : 'dev')

export default defineConfig({
  base: '/',
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (ไม่ใช่ 'autoUpdate') เพราะต้องการให้แอปโชว์ปุ่ม "มีเวอร์ชันใหม่" ให้เจ้าหน้าที่
      // กดยืนยันเองก่อนสลับไปใช้ไฟล์ชุดใหม่ (ดู src/components/PwaUpdatePrompt.jsx) — กันไม่ให้
      // สลับเวอร์ชันกลางคันตอนกำลังกรอกฟอร์มอยู่โดยไม่รู้ตัว
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'fixit-logo.png', 'rytc-logo01.png'],
      manifest: {
        name: 'RYTC-FixIT | ศูนย์ซ่อมสร้างเพื่อชุมชน',
        short_name: 'RYTC-FixIT',
        description:
          'ระบบติดตามงานซ่อม โครงการอาชีวะอาสา! ศูนย์ซ่อมสร้างเพื่อชุมชน วิทยาลัยเทคนิคระยอง',
        lang: 'th',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#f5821f',
        background_color: '#fffaf5',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // precache เฉพาะไฟล์ "app shell" (JS/CSS/HTML/ไอคอน/ฟอนต์) ที่ build ออกมา — ไม่แตะ
        // Firestore/Storage/Auth ซึ่งมีกลไกออฟไลน์ของตัวเองอยู่แล้ว (เฟส 1-2) ผลคือเปิดแอปขึ้นมา
        // ได้ทันทีแม้ไม่มีสัญญาณเลยตั้งแต่ก่อนโหลดหน้าด้วยซ้ำ (ไม่ใช่แค่ระหว่างใช้งานอยู่)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          // รูปถ่ายงานซ่อม (intake/closure) จาก Firebase Storage — ไม่มีจุดไหนในแอปที่แก้ไข/
          // อัปโหลดทับรูปเดิม (หน้าแก้ไขข้อมูลเริ่มต้นก็ตั้งใจไม่ให้แก้รูป) URL ของแต่ละรูปจึงคงที่
          // ตลอดไป ใช้ CacheFirst ได้เต็มที่ — เปิดดูครั้งแรกค่อยโหลดจากเน็ต ครั้งต่อไป (รวมถึง
          // ตอนออฟไลน์) ใช้จากเครื่องเลยไม่ยิงเน็ตซ้ำ
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'repair-photos',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 180 },
            },
          },
        ],
      },
    }),
  ],
})
