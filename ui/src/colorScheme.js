import { createContext, useContext } from 'react'

export const ColorSchemeContext = createContext({
  isDark: false,
  preference: 'system',
  setPreference: () => {},
})

// Für das Profil-Menü und die Kontoseite, um den Dunkelmodus umzuschalten.
// Bewusst in einer eigenen Datei: neben einer Komponente exportiert wuerde
// dieser Hook Fast Refresh aushebeln.
export function useColorSchemeSetting() {
  return useContext(ColorSchemeContext)
}
