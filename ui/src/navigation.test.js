import { describe, expect, it } from 'vitest'
import { activePath, navItemsFor, titleFor } from './navigation'

// FunctionNo laut helper/helpFunctions.js
const ATW = 1
const ADMIN = 2
const EXTERN = 3

describe('navItemsFor', () => {
  it('zeigt Externen nur Aufträge und Anliefern', () => {
    const paths = navItemsFor(EXTERN).map((i) => i.path)
    expect(paths).toEqual(['/home', '/planner'])
  })

  it('gibt Gerätewarten zusätzlich die Suche', () => {
    const paths = navItemsFor(ATW).map((i) => i.path)
    expect(paths).toEqual(['/home', '/planner', '/search'])
  })

  it('gibt Admins zusätzlich die Verwaltung', () => {
    const paths = navItemsFor(ADMIN).map((i) => i.path)
    expect(paths).toEqual(['/home', '/planner', '/search', '/evaluation'])
  })

  it('beschriftet die Erfassung rollenabhängig', () => {
    const labelFor = (fn) => navItemsFor(fn).find((i) => i.path === '/planner').label
    expect(labelFor(EXTERN)).toBe('Anliefern')
    expect(labelFor(ATW)).toBe('Erfassung')
    expect(labelFor(ADMIN)).toBe('Erfassung')
  })

  it('löst die Beschriftung immer zu einem String auf', () => {
    for (const fn of [ATW, ADMIN, EXTERN]) {
      for (const item of navItemsFor(fn)) {
        expect(typeof item.label).toBe('string')
      }
    }
  })

  it('zeigt bei unbekannter Rolle nur die für alle sichtbaren Punkte', () => {
    // Kommt vor, solange checkToken noch nicht geantwortet hat.
    expect(navItemsFor(undefined).map((i) => i.path)).toEqual(['/home', '/planner'])
  })
})

describe('activePath', () => {
  it('markiert den Punkt anhand des ersten Pfadsegments', () => {
    expect(activePath('/search')).toBe('/search')
    // Bearbeiten-Route: /planner/42 muss den Punkt /planner markieren.
    expect(activePath('/planner/42')).toBe('/planner')
  })

  it('behandelt Wurzel und leeren Pfad als Aufträge', () => {
    expect(activePath('/')).toBe('/home')
    expect(activePath('')).toBe('/home')
  })
})

describe('titleFor', () => {
  it('nimmt den Titel aus der Navigation', () => {
    expect(titleFor('/search', ATW)).toBe('Suche')
    expect(titleFor('/planner/42', EXTERN)).toBe('Anliefern')
  })

  it('kennt auch Seiten ohne eigenen Navigationspunkt', () => {
    expect(titleFor('/userManagement', ADMIN)).toBe('Benutzerverwaltung')
    expect(titleFor('/account', EXTERN)).toBe('Konto')
  })

  it('fällt bei unbekanntem Pfad auf den App-Namen zurück', () => {
    expect(titleFor('/gibtesnicht', ATW)).toBe('Atemschutzpflegestelle')
  })

  it('nennt keine Seite, die die Rolle nicht sehen darf, beim Navigationsnamen', () => {
    // Ein Externer, der /evaluation aufruft, bekommt keinen Verwaltungstitel.
    expect(titleFor('/evaluation', EXTERN)).toBe('Atemschutzpflegestelle')
  })
})
