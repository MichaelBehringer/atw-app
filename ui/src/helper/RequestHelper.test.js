import { describe, expect, it } from 'vitest'
import { istTokenUngueltig } from './RequestHelper'

// Vorlage einer axios-Fehlerantwort.
function fehler(status, mitToken = true) {
  return {
    response: { status },
    config: { headers: mitToken ? { Authorization: 'Bearer abc' } : {} },
  }
}

describe('istTokenUngueltig', () => {
  it('erkennt 405 als ungültiges Token', () => {
    // Das schickt die AuthUser-Middleware bei ungültigem Token.
    expect(istTokenUngueltig(fehler(405))).toBe(true)
  })

  it('behandelt 400 nicht als abgelaufene Sitzung', () => {
    // 400 kommt bei fehlendem Token - aber auch von createUser, wenn der
    // Benutzername schon vergeben ist. Ein Abmelden wäre dort falsch.
    expect(istTokenUngueltig(fehler(400))).toBe(false)
  })

  it('behandelt 401 nicht als abgelaufene Sitzung', () => {
    // 401 kommt nur von der Anmeldung selbst - dort gibt es keine Sitzung zu
    // beenden, und der rote Hinweis "Passwort falsch" soll stehen bleiben.
    expect(istTokenUngueltig(fehler(401))).toBe(false)
  })

  it('ignoriert Anfragen ohne Token', () => {
    expect(istTokenUngueltig(fehler(405, false))).toBe(false)
  })

  it('ignoriert Netzwerkfehler', () => {
    // Ohne response ist die Verbindung das Problem, nicht das Token. Hier
    // abzumelden würde bei jedem Funkloch alle hinauswerfen.
    expect(istTokenUngueltig(new Error('Network Error'))).toBe(false)
    expect(istTokenUngueltig({ config: { headers: {} } })).toBe(false)
  })

  it('kommt mit unvollständigen Fehlerobjekten klar', () => {
    expect(istTokenUngueltig(undefined)).toBe(false)
    expect(istTokenUngueltig(null)).toBe(false)
    expect(istTokenUngueltig({})).toBe(false)
    expect(istTokenUngueltig({ response: { status: 405 } })).toBe(false)
  })

  it('reagiert nicht auf Erfolgsantworten', () => {
    for (const status of [200, 201, 204, 302, 404, 500]) {
      expect(istTokenUngueltig(fehler(status))).toBe(false)
    }
  })
})
