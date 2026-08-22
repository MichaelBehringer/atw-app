import {
  CalendarOutlined,
  EllipsisOutlined,
  HomeOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { isATW, isAdmin, isExternal } from './helper/helpFunctions'

// Einzige Quelle für die Navigation. Sider (PC) und Bottom-Tabs (Handy) lesen
// beide hier, damit Reihenfolge, Beschriftung und Rollenfilter nicht an zwei
// Stellen gepflegt werden müssen.
//
// path ist gleichzeitig der Menü-Key - so bleibt der bisherige Mechanismus
// erhalten, bei dem ein Klick direkt auf den Key navigiert.
const NAV_ITEMS = [
  {
    path: '/home',
    label: 'Aufträge',
    icon: HomeOutlined,
    visible: () => true,
  },
  {
    path: '/planner',
    // Externe Feuerwehren melden eine Anlieferung an, die Gerätewarte erfassen
    // ihre Arbeit - dieselbe Maske, aber aus zwei Blickwinkeln.
    label: (functionNo) => (isExternal(functionNo) ? 'Anliefern' : 'Erfassung'),
    icon: CalendarOutlined,
    visible: () => true,
  },
  {
    path: '/search',
    label: 'Suche',
    icon: SearchOutlined,
    visible: (functionNo) => isATW(functionNo) || isAdmin(functionNo),
  },
  {
    // Evaluation ist bereits die Verwaltungsübersicht des Admins: sie verlinkt
    // Benutzerverwaltung und Feuerwehren und enthält die Auswertungen.
    path: '/evaluation',
    label: 'Verwaltung',
    labelShort: 'Mehr',
    icon: EllipsisOutlined,
    visible: (functionNo) => isAdmin(functionNo),
  },
]

export function navItemsFor(functionNo) {
  return NAV_ITEMS.filter((item) => item.visible(functionNo)).map((item) => ({
    ...item,
    label: typeof item.label === 'function' ? item.label(functionNo) : item.label,
  }))
}

// Welcher Navigationspunkt ist zum aktuellen Pfad aktiv? Vergleicht nur das
// erste Segment, damit /planner/42 den Punkt /planner markiert.
export function activePath(pathname) {
  const first = pathname.split('/').filter(Boolean)[0]
  return first ? `/${first}` : '/home'
}

// Titel für die Kopfzeile. Deckt auch Seiten ab, die keinen eigenen
// Navigationspunkt haben, aber erreichbar sind.
const EXTRA_TITLES = {
  '/userManagement': 'Benutzerverwaltung',
  '/account': 'Konto',
}

export function titleFor(pathname, functionNo) {
  const path = activePath(pathname)
  const item = navItemsFor(functionNo).find((i) => i.path === path)
  if (item) return item.label
  return EXTRA_TITLES[path] ?? 'Atemschutz-App'
}
