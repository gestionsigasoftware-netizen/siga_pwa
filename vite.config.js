import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'SIGAP — Móvil',
        short_name: 'SIGAP',
        description: 'Registro de asistencia — SIGAP',
        theme_color: '#FCFCFB',
        background_color: '#FCFCFB',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // Sin caché offline de datos — se decidió que no es necesario (ver
      // especificación maestra). Solo lo mínimo para que "instale" bien.
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico}'] },
    }),
  ],
  // strictPort: falla en vez de derivar en silencio a otro puerto si
  // 5174 ya esta ocupado (evita confundir un servidor en el puerto
  // equivocado con uno que no arranco).
  server: { port: 5174, strictPort: true, open: true },
})
