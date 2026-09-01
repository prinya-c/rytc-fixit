import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://<owner>.github.io/rytc-fixit/ via GitHub Pages.
export default defineConfig({
  base: '/rytc-fixit/',
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (ไม่ใช่ 'autoUpdate') เพราะต้องการให้แอปโชว์ปุ่ม "มีเวอร์ชันใหม่" ให้เจ้าหน้าที่
      // กดยืนยันเองก่อนสลับไปใช้ไฟล์ชุดใหม่ (ดู src/components/PwaUpdatePrompt.jsx) — กันไม่ให้
      // สลับเวอร์ชันกลางคันตอนกำลังกรอกฟอร์มอยู่โดยไม่รู้ตัว
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'fixit-logo.png', 'rytc-logo01.png'],
      manifest: {
        name: 'RYTC-Fix | ศูนย์ซ่อมสร้างเพื่อชุมชน',
        short_name: 'RYTC-Fix',
        description:
          'ระบบติดตามงานซ่อม โครงการอาชีวะอาสา! ศูนย์ซ่อมสร้างเพื่อชุมชน วิทยาลัยเทคนิคระยอง',
        lang: 'th',
        start_url: '/rytc-fixit/',
        scope: '/rytc-fixit/',
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
        ],
      },
    }),
  ],
})
