import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// The ISP QA backend lives at http://172.16.0.2 (reachable only on their network/VPN).
// To avoid browser CORS/mixed-content when wiring the real API, proxy it through the dev
// server: set VITE_PORTAL_ORIGIN and the app calls same-origin /portal/* and /udm/*.
const PORTAL_ORIGIN = process.env.VITE_PORTAL_ORIGIN || 'http://172.16.0.2';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Gigantic Router Manager',
        short_name: 'Router',
        description: 'Manage your WiFi modem/router — WiFi settings, connected devices, reboot & status.',
        theme_color: '#3f51b5',
        background_color: '#faf2f2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: '/index.html',
        // Never cache API calls — router state must be live.
        navigateFallbackDenylist: [/^\/portal/, /^\/udm/],
      },
      devOptions: { enabled: true },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/portal': { target: PORTAL_ORIGIN, changeOrigin: true, secure: false, rewrite: (p) => p.replace(/^\/portal/, '') },
      '/udm': { target: PORTAL_ORIGIN, changeOrigin: true, secure: false, rewrite: (p) => p.replace(/^\/udm/, '') },
    },
  },
});
