import { App as AntApp, ConfigProvider } from 'antd'
import deDE from 'antd/locale/de_DE'
import dayjs from 'dayjs'
import 'dayjs/locale/de'
import { useEffect } from 'react'
import { ColorSchemeContext } from './colorScheme'
import { registerMessageInstance } from './helper/ToastHelper'
import useColorScheme from './hooks/useColorScheme'
import { THEME_COLOR_DARK, THEME_COLOR_LIGHT, buildTheme } from './theme'

// Die Locale-Datei zu importieren registriert sie nur - aktiv wird sie erst
// hier. Ohne diese Zeile formatiert dayjs auf Englisch, obwohl 'dayjs/locale/de'
// an mehreren Stellen importiert wird.
dayjs.locale('de')

// Hält die theme-color-Angabe im Dokument mit dem aktiven Schema synchron.
// Sie färbt bei der installierten App die Statusleiste - bliebe sie fest,
// hätte man im Dunkelmodus einen roten Balken über schwarzem Inhalt.
function useThemeColorMeta(isDark) {
  useEffect(() => {
    const color = isDark ? THEME_COLOR_DARK : THEME_COLOR_LIGHT
    for (const el of document.querySelectorAll('meta[name="theme-color"]')) {
      el.setAttribute('content', color)
    }
  }, [isDark])
}

// Stellt die message-Instanz für ToastHelper bereit, damit Toasts Theme und
// Sprache sehen.
function ToastBridge({ children }) {
  const { message } = AntApp.useApp()

  useEffect(() => {
    registerMessageInstance(message)
    return () => registerMessageInstance(null)
  }, [message])

  return children
}

export default function AppProviders({ children }) {
  const colorScheme = useColorScheme()
  useThemeColorMeta(colorScheme.isDark)

  return (
    <ColorSchemeContext.Provider value={colorScheme}>
      <ConfigProvider locale={deDE} theme={buildTheme(colorScheme.isDark)}>
        <AntApp>
          <ToastBridge>{children}</ToastBridge>
        </AntApp>
      </ConfigProvider>
    </ColorSchemeContext.Provider>
  )
}
