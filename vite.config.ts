import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'q/*.webp'],
      manifest: {
        name: 'DriverLearn — Rwanda driving test prep',
        short_name: 'DriverLearn',
        description: 'Learn every question of the Rwanda provisional driving licence theory test.',
        theme_color: '#0b7dc1',
        background_color: '#f4f8fb',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
        // Kinyarwanda and English only need the Latin font subsets; the browser still
        // fetches any other subset on demand thanks to unicode-range.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,vietnamese,latin-ext}-wght-*.woff2'],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // Keep the question bank and third-party code in their own long-lived cache entries.
        codeSplitting: {
          groups: [
            { name: 'questions', test: /src[\\/]data[\\/]questions\.json/ },
            { name: 'vendor', test: /node_modules/ },
          ],
        },
      },
    },
  },
})
