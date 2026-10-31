import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves a project site under /<repo>/, so the build needs a base path.
// Set VITE_BASE in CI (e.g. "/gigantic-router-pwa/"); defaults to "/" for dev and other hosts.
const BASE = process.env.VITE_BASE || '/';

// Dev-only proxy: forwards same-origin /portal and /udm to a backend so you can test against a
// QA box without CORS. Set VITE_PORTAL_ORIGIN to your backend. Production (Pages) is static —
// the app calls the live portal directly (no proxy).
const PORTAL_ORIGIN = process.env.VITE_PORTAL_ORIGIN || 'http://localhost:8080';

export default defineConfig({
  base: BASE,
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
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: `${BASE}index.html`,
        // Never cache API calls — router state must be live.
        navigateFallbackDenylist: [/\/portal/, /\/udm/],
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
