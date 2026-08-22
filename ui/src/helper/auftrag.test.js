import { describe, expect, it } from 'vitest'
import {
  ROOT_KEY,
  WORK_TYPES,
  allItemKeys,
  buildSections,
  buildWorkingPoints,
  isComplete,
  parseNumbers,
  summarize,
} from './auftrag'

// Wie searchOpen einen Auftrag liefert: 3 Flaschen füllen, 2 Masken prüfen.
const entry = {
  key: 142,
  city: 'Amerbach',
  flaschenFuellenNr: '12,15,22',
  flaschenTUEVNr: '',
  maskenPruefenNr: '3,7',
  maskenReinigenNr: '',
  laPruefenNr: '',
  laReinigenNr: '',
  geraetePruefenNr: '',
  geraeteReinigenNr: '',
}

describe('parseNumbers', () => {
  it('zerlegt die kommaseparierte Liste', () => {
    expect(parseNumbers('12,15,22')).toEqual(['12', '15', '22'])
  })

  it('behandelt leere Angaben als keine Nummern', () => {
    expect(parseNumbers('')).toEqual([])
    expect(parseNumbers(null)).toEqual([])
    expect(parseNumbers(undefined)).toEqual([])
  })

  it('wirft leere Abschnitte weg, die nach einer Teilerledigung entstehen', () => {
    // Das Backend fügt die Restliste per strings.Join zusammen, dabei können
    // leere Elemente übrig bleiben.
    expect(parseNumbers('12,,15')).toEqual(['12', '15'])
    expect(parseNumbers(',')).toEqual([])
  })

  it('toleriert Leerzeichen', () => {
    expect(parseNumbers(' 12 , 15 ')).toEqual(['12', '15'])
  })
})

describe('buildSections', () => {
  it('führt nur Arbeitsarten mit offenen Nummern auf', () => {
    const sections = buildSections(entry)
    expect(sections.map((s) => s.key)).toEqual(['ff', 'mp'])
  })

  it('erzeugt pro Nummer einen Punkt mit sprechender Beschriftung', () => {
    const [flaschen] = buildSections(entry)
    expect(flaschen.label).toBe('Flaschen füllen')
    expect(flaschen.items).toEqual([
      { key: 'ff#12', nr: '12', label: 'Flasche 12' },
      { key: 'ff#15', nr: '15', label: 'Flasche 15' },
      { key: 'ff#22', nr: '22', label: 'Flasche 22' },
    ])
  })

  it('bildet die Schlüssel genau so, wie das Backend sie erwartet', () => {
    // UpdateEntryTree trennt an '#': davor das Kürzel, danach die Nummer.
    for (const key of allItemKeys(buildSections(entry))) {
      const [prefix, nr] = key.split('#')
      expect(WORK_TYPES.map((t) => t.key)).toContain(prefix)
      expect(nr).toMatch(/^\d+$/)
    }
  })

  it('kommt mit einem leeren Auftrag klar', () => {
    expect(buildSections(null)).toEqual([])
    expect(buildSections({})).toEqual([])
  })
})

describe('summarize', () => {
  it('zählt pro Arbeitsart für die Auftragskarte', () => {
    expect(summarize(entry)).toEqual([
      { key: 'ff', label: 'Flaschen füllen', count: 3 },
      { key: 'mp', label: 'Masken prüfen', count: 2 },
    ])
  })
})

describe('buildWorkingPoints', () => {
  const sections = buildSections(entry)

  it('sendet bei Teilerledigung nur die angehakten Punkte', () => {
    const points = buildWorkingPoints(['ff#12', 'ff#15'], sections)
    expect(points).toEqual(['ff#12', 'ff#15'])
    // Entscheidend: ohne root, sonst schliesst das Backend den ganzen Auftrag.
    expect(points).not.toContain(ROOT_KEY)
  })

  it('sendet root, sobald alle Punkte angehakt sind', () => {
    const points = buildWorkingPoints(allItemKeys(sections), sections)
    expect(points[0]).toBe(ROOT_KEY)
    expect(points).toHaveLength(6)
  })

  it('erkennt Vollstaendigkeit auch ueber mehrere Arbeitsarten hinweg', () => {
    // Alle Flaschen, aber eine Maske fehlt: noch keine Vollerledigung.
    const fast = ['ff#12', 'ff#15', 'ff#22', 'mp#3']
    expect(buildWorkingPoints(fast, sections)).not.toContain(ROOT_KEY)

    const komplett = [...fast, 'mp#7']
    expect(buildWorkingPoints(komplett, sections)).toContain(ROOT_KEY)
  })

  it('ignoriert Schluessel, die nicht zum Auftrag gehoeren', () => {
    // Etwa Gruppenschluessel oder Reste aus einem vorher geoeffneten Auftrag.
    const points = buildWorkingPoints(['ff', 'ff#12', 'gr#99', ROOT_KEY], sections)
    expect(points).toEqual(['ff#12'])
  })

  it('sendet bei nichts Angehaktem nichts', () => {
    expect(buildWorkingPoints([], sections)).toEqual([])
  })

  it('meldet einen Auftrag ohne Punkte nicht als vollstaendig', () => {
    // Sonst wuerde ein leerer Auftrag beim Oeffnen sofort als erledigt gelten.
    expect(buildWorkingPoints([], [])).toEqual([])
    expect(buildWorkingPoints([], [])).not.toContain(ROOT_KEY)
  })
})

describe('isComplete', () => {
  const sections = buildSections(entry)

  it('unterscheidet Teil- und Vollerledigung', () => {
    expect(isComplete(['ff#12'], sections)).toBe(false)
    expect(isComplete(allItemKeys(sections), sections)).toBe(true)
  })

  it('ist bei einem Auftrag ohne Punkte nicht vollstaendig', () => {
    expect(isComplete([], [])).toBe(false)
  })
})
