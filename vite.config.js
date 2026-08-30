import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Served from https://<owner>.github.io/rytc-fixit/ via GitHub Pages.
export default defineConfig({
  base: '/rytc-fixit/',
  plugins: [react()],
})
