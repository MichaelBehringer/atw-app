import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Erzeugt aus public/app-icon.svg die PNG-Groessen fuer Android, iOS und
// Browser-Tab. Wird nur benoetigt, wenn sich das Icon aendert - siehe README.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: minimal2023Preset,
  images: ['public/app-icon.svg'],
})
