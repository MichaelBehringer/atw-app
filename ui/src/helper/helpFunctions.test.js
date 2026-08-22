import { describe, expect, it } from 'vitest'
import {
  getCityToID,
  getUserToID,
  getWemding,
  isATW,
  isAdmin,
  isExternal,
} from './helpFunctions'

describe('Rollenpruefung', () => {
  it('ordnet die Funktionsnummern den Rollen zu', () => {
    expect(isATW(1)).toBe(true)
    expect(isAdmin(2)).toBe(true)
    expect(isExternal(3)).toBe(true)
  })

  it('meldet keine Rolle fuer fremde Funktionsnummern', () => {
    for (const fn of [isATW, isAdmin, isExternal]) {
      expect(fn(0)).toBe(false)
      expect(fn(99)).toBe(false)
      expect(fn(undefined)).toBe(false)
    }
  })

  it('vergleicht strikt, damit "2" nicht als Admin durchgeht', () => {
    expect(isAdmin('2')).toBe(false)
  })
})

describe('Nachschlagen per ID', () => {
  const users = [
    { persNo: 1, name: 'Muster' },
    { persNo: 2, name: 'Beispiel' },
  ]
  const cities = [
    { cityNo: 1, city: 'Wemding' },
    { cityNo: 5, city: 'Amerbach' },
  ]

  it('findet Person und Feuerwehr', () => {
    expect(getUserToID(2, users)).toBe(users[1])
    expect(getCityToID(5, cities)).toBe(cities[1])
  })

  it('gibt undefined zurueck, wenn die ID unbekannt ist', () => {
    expect(getUserToID(3, users)).toBeUndefined()
    expect(getCityToID(3, cities)).toBeUndefined()
  })
})

describe('getWemding', () => {
  it('liefert die Default-Auswahl fuer Selects', () => {
    expect(getWemding()).toEqual({ value: 1, label: 'Wemding' })
  })
})
