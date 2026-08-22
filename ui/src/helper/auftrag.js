// Fachlogik rund um einen Auftrag: welche Arbeitsarten es gibt, wie aus den
// offenen Gerätenummern eine Checkliste wird und was beim Abhaken an das
// Backend geht.
//
// Die Schlüsselkürzel (ff, ft, mp, ...) sind ein Vertrag mit dem Backend:
// UpdateEntryTree in server/controller/dataController.go ordnet sie über ein
// switch der jeweiligen Spalte zu. Sie dürfen nicht umbenannt werden.
export const WORK_TYPES = [
  { key: 'ff', field: 'flaschenFuellenNr', label: 'Flaschen füllen', item: 'Flasche' },
  { key: 'ft', field: 'flaschenTUEVNr', label: 'Flaschen TÜV', item: 'Flasche' },
  { key: 'mp', field: 'maskenPruefenNr', label: 'Masken prüfen', item: 'Maske' },
  { key: 'mr', field: 'maskenReinigenNr', label: 'Masken reinigen', item: 'Maske' },
  { key: 'lp', field: 'laPruefenNr', label: 'LA prüfen', item: 'Lungenautomat' },
  { key: 'lr', field: 'laReinigenNr', label: 'LA reinigen', item: 'Lungenautomat' },
  { key: 'gp', field: 'geraetePruefenNr', label: 'Geräte prüfen', item: 'Gerät' },
  { key: 'gr', field: 'geraeteReinigenNr', label: 'Geräte reinigen', item: 'Gerät' },
]

// Der Schlüssel, der einen Auftrag komplett abschließt. Enthält workingPoints
// ihn, setzt das Backend STATE='saved'; andernfalls werden nur die einzelnen
// "kürzel#nummer"-Einträge verbucht und der Auftrag bleibt offen.
export const ROOT_KEY = 'root'

// Die Nummern kommen als kommaseparierter String. Nach einer Teilerledigung
// kann der String leere Abschnitte enthalten, deshalb wird gefiltert.
export function parseNumbers(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n !== '')
}

// Baut die Abschnitte der Checkliste. Arbeitsarten ohne offene Nummern
// entfallen - im Auftrag steht nur, was tatsächlich zu tun ist.
export function buildSections(entry) {
  if (!entry) return []

  return WORK_TYPES.flatMap((type) => {
    const numbers = parseNumbers(entry[type.field])
    if (numbers.length === 0) return []

    return [
      {
        key: type.key,
        label: type.label,
        items: numbers.map((nr) => ({
          key: `${type.key}#${nr}`,
          nr,
          label: `${type.item} ${nr}`,
        })),
      },
    ]
  })
}

export function allItemKeys(sections) {
  return sections.flatMap((section) => section.items.map((item) => item.key))
}

// Kurzfassung für die Auftragskarte: "4× Flaschen füllen · 2× Masken prüfen".
export function summarize(entry) {
  return buildSections(entry).map((section) => ({
    key: section.key,
    label: section.label,
    count: section.items.length,
  }))
}

// Was beim Abhaken gesendet wird.
//
// Sind ALLE Punkte angehakt, muss ROOT_KEY dabei sein - sonst würde ein
// vollständig erledigter Auftrag nur teilweise verbucht und bliebe offen.
// Bei Teilerledigung darf er auf keinen Fall dabei sein, weil das Backend dann
// den ganzen Auftrag schließt, obwohl noch Arbeit offen ist.
export function buildWorkingPoints(checkedKeys, sections) {
  const all = allItemKeys(sections)
  const checked = all.filter((key) => checkedKeys.includes(key))

  if (all.length > 0 && checked.length === all.length) {
    return [ROOT_KEY, ...checked]
  }
  return checked
}

export function isComplete(checkedKeys, sections) {
  const all = allItemKeys(sections)
  return all.length > 0 && all.every((key) => checkedKeys.includes(key))
}
