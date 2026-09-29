import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Hintergrund im App-Rot statt Weiss: sonst zeigt Android das maskable-Icon
// als weissen Kreis mit rotem Quadrat darin (iOS entsprechend weiss umrandet).
// 10 % Rand halten das Motiv in der sicheren Zone der Kreismaske.
const iconBackground = { padding: 0.1, resizeOptions: { background: '#c8102e' } }

// Erzeugt aus public/app-icon.svg die PNG-Groessen fuer Android, iOS und
// Browser-Tab. Wird nur benoetigt, wenn sich das Icon aendert - siehe README.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, ...iconBackground },
    apple: { ...minimal2023Preset.apple, ...iconBackground },
  },
  images: ['public/app-icon.svg'],
})
