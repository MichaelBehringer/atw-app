import { theme as antdTheme } from 'antd'

// Feuerwehr-Rot als Markenfarbe. antd leitet daraus die restlichen
// Farbabstufungen (hover, active, border, bg) selbst ab.
const BRAND = '#c8102e'

// Die Statusleiste der installierten App bekommt diese Farbe (index.html +
// manifest). Hier definiert, damit Theme und PWA nicht auseinanderlaufen.
export const THEME_COLOR_LIGHT = BRAND
export const THEME_COLOR_DARK = '#141414'

// Gemeinsame Tokens fuer hell und dunkel. Die beiden wichtigsten Werte:
//
// controlHeight 44 - antd liefert 32px. Das iOS-Minimum fuer Trefferflaechen
//   liegt bei 44px, und die App wird ueberwiegend am Handy bedient.
// fontSize 16 - unter 16px zoomt Safari beim Fokussieren eines Eingabefeldes
//   die ganze Seite hinein und wieder heraus. Die Erfassungsmaske hat viele
//   Felder hintereinander, das waere ein Zoom-Karussell.
const sharedToken = {
  colorPrimary: BRAND,
  colorLink: BRAND,
  controlHeight: 44,
  controlHeightSM: 36,
  controlHeightLG: 52,
  fontSize: 16,
  borderRadius: 8,
  // Etwas mehr Luft als antd-Default, damit gestapelte Elemente am Handy
  // nicht aneinanderkleben.
  marginXS: 10,
  paddingContentVerticalSM: 12,
}

const sharedComponents = {
  Button: {
    // Buttons sind am Handy oft die einzige Aktion einer Karte.
    fontWeight: 500,
    paddingInline: 20,
  },
  Card: {
    paddingLG: 16,
  },
  Checkbox: {
    // Groessere Kaestchen fuer die Abarbeiten-Checkliste.
    controlInteractiveSize: 22,
  },
  Table: {
    cellPaddingBlock: 14,
  },
  Segmented: {
    controlHeight: 44,
  },
}

export function buildTheme(isDark) {
  return {
    algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      ...sharedToken,
      ...(isDark
        ? {
            // Im Dunkelmodus ist das satte Rot auf schwarzem Grund zu hart;
            // eine Stufe heller bleibt lesbar und trifft den Kontrast.
            colorPrimary: '#ff4d5e',
            colorLink: '#ff4d5e',
          }
        : {}),
    },
    components: sharedComponents,
  }
}
