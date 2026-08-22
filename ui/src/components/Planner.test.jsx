import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router'
import AppProviders from '../AppProviders'

const USERS = [
  { persNo: 7, firstname: 'Max', lastname: 'Muster', cityNo: 1 },
  { persNo: 8, firstname: 'Erika', lastname: 'Beispiel', cityNo: 2 },
]
const CITIES = [
  { cityNo: 1, name: 'Wemding' },
  { cityNo: 2, name: 'Amerbach' },
]

const putAuth = vi.fn()

vi.mock('../helper/RequestHelper', () => ({
  doGetRequestAuth: (path) => {
    if (path === 'pers') return Promise.resolve({ data: USERS })
    if (path === 'cities') return Promise.resolve({ data: CITIES })
    return Promise.resolve({ data: {} })
  },
  doPutRequestAuth: (path, params, token) => putAuth(path, params, token),
  doPostRequestAuth: () => Promise.resolve({ data: {} }),
  doDeleteRequestAuth: () => Promise.resolve({ data: {} }),
  doPostRequest: () => Promise.resolve({ data: {} }),
  doGetRequestBlob: () => Promise.resolve({ data: new Blob() }),
}))

const { default: Planner } = await import('./Planner')

const ADMIN = 2
const EXTERN = 3

function renderPlanner(functionNo = ADMIN) {
  return render(
    <AppProviders>
      <HashRouter>
        <Planner token="t" loggedPersNo={7} loggedFunctionNo={functionNo} />
      </HashRouter>
    </AppProviders>,
  )
}

function letzterAufruf() {
  return putAuth.mock.calls.at(-1)
}

// Waehlt eine Feuerwehr. Fuer Geraetewarte ist das ein Pflichtfeld.
async function feuerwehrWaehlen(user, name = 'Wemding') {
  await user.click(screen.getByRole('combobox', { name: 'Feuerwehr' }))
  await user.click(await screen.findByTitle(name))
}

// Öffnet das Zahlenraster einer Arbeitsart und wählt die übergebenen Nummern.
async function nummernWaehlen(user, arbeitsart, nummern) {
  await user.click(screen.getByRole('button', { name: new RegExp(`^${arbeitsart}`) }))
  for (const nr of nummern) {
    await user.click(await screen.findByRole('button', { name: `Nummer ${nr}` }))
  }
  await user.click(screen.getByRole('button', { name: 'Übernehmen' }))
}

describe('Planner', () => {
  beforeEach(() => {
    putAuth.mockReset()
    putAuth.mockResolvedValue({ status: 200, data: {} })
  })

  it('zeigt die Arbeitsarten mit sichtbarer Beschriftung', async () => {
    renderPlanner()

    // Vorher steckten diese Beschriftungen in Tooltips, die es auf Touch nicht gibt.
    for (const label of ['Flaschen füllen', 'Flaschen TÜV', 'Masken prüfen', 'Geräte reinigen']) {
      expect(await screen.findByRole('button', { name: new RegExp(`^${label}`) })).toBeInTheDocument()
    }
  })

  it('leitet die Anzahl aus den gewählten Nummern ab', async () => {
    const user = userEvent.setup()
    renderPlanner()

    await screen.findByRole('button', { name: /^Flaschen füllen/ })
    await feuerwehrWaehlen(user)
    await nummernWaehlen(user, 'Flaschen füllen', [12, 15, 22])

    await user.type(screen.getByPlaceholderText('z. B. 1,5'), '2')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    const [path, params] = letzterAufruf()
    expect(path).toBe('createEntry')
    // Der Kern des Umbaus: kein eigenes Anzahl-Feld mehr, der Wert ist die
    // Länge der Nummernliste - beide Angaben müssen zusammenpassen.
    expect(params.flaschenFuellenNr).toBe('12,15,22')
    expect(params.flaschenFuellen).toBe(3)
    // Nicht gewählte Arbeitsarten werden mit 0 und leerer Liste gesendet.
    expect(params.maskenPruefen).toBe(0)
    expect(params.maskenPruefenNr).toBe('')
  })

  it('sendet die Nummern aufsteigend sortiert, egal in welcher Reihenfolge getippt wurde', async () => {
    const user = userEvent.setup()
    renderPlanner()

    await screen.findByRole('button', { name: /^Masken prüfen/ })
    await feuerwehrWaehlen(user)
    await nummernWaehlen(user, 'Masken prüfen', [7, 3])

    await user.type(screen.getByPlaceholderText('z. B. 1,5'), '1')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(letzterAufruf()[1].maskenPruefenNr).toBe('3,7')
  })

  it('zeigt Anzahl und gewaehlte Nummern in der Zeile der Arbeitsart', async () => {
    const user = userEvent.setup()
    renderPlanner()

    await screen.findByRole('button', { name: /^Flaschen füllen/ })
    await nummernWaehlen(user, 'Flaschen füllen', [12, 15])

    // Die Nummern stehen in der Zeile, damit man sie ohne Antippen sieht.
    // Gezielt ueber die Zeile geprueft: das geschlossene Sheet liegt noch im
    // DOM und enthaelt denselben Text.
    expect(
      await screen.findByRole('button', { name: /^Flaschen füllen 12 · 15 2/ }),
    ).toBeInTheDocument()
    // Der Speichern-Button traegt keine Anzahl mehr.
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeInTheDocument()
  })

  it('verlangt mindestens eine Gerätenummer', async () => {
    const user = userEvent.setup()
    renderPlanner()

    await screen.findByRole('button', { name: /^Flaschen füllen/ })
    await feuerwehrWaehlen(user)
    await user.type(screen.getByPlaceholderText('z. B. 1,5'), '1')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(putAuth).not.toHaveBeenCalled()
    expect(await screen.findByText('Bitte mindestens eine Gerätenummer wählen')).toBeInTheDocument()
  })

  it('verlangt vom Gerätewart eine Arbeitszeit', async () => {
    const user = userEvent.setup()
    renderPlanner()

    await screen.findByRole('button', { name: /^Flaschen füllen/ })
    await feuerwehrWaehlen(user)
    await nummernWaehlen(user, 'Flaschen füllen', [12])
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(putAuth).not.toHaveBeenCalled()
    expect(await screen.findByText('Bitte die Arbeitszeit angeben')).toBeInTheDocument()
  })

  it('verwirft Änderungen im Zahlenraster beim Abbrechen', async () => {
    const user = userEvent.setup()
    renderPlanner()

    await screen.findByRole('button', { name: /^Flaschen füllen/ })
    await user.click(screen.getByRole('button', { name: /^Flaschen füllen/ }))
    await user.click(await screen.findByRole('button', { name: 'Nummer 12' }))
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))

    expect(await screen.findByRole('button', { name: 'Speichern' })).toBeInTheDocument()
  })

  it('meldet für Externe eine Anlieferung ohne Arbeitszeit', async () => {
    const user = userEvent.setup()
    renderPlanner(EXTERN)

    await screen.findByRole('button', { name: /^Flaschen füllen/ })
    // Externe sehen kein Arbeitszeit-Feld und keine Auswahl des Gerätewarts.
    expect(screen.queryByPlaceholderText('z. B. 1,5')).not.toBeInTheDocument()

    await nummernWaehlen(user, 'Flaschen füllen', [5])
    // Externe melden eine Anlieferung an, sie erfassen keine Arbeit.
    await user.click(screen.getByRole('button', { name: 'Anlieferung melden' }))

    const [path, params] = letzterAufruf()
    expect(path).toBe('createEntryProposal')
    expect(params.arbeitszeit).toBe(0)
    expect(params.flaschenFuellenNr).toBe('5')
    expect(params.flaschenFuellen).toBe(1)
  })

  it('verlangt eine Feuerwehr', async () => {
    const user = userEvent.setup()
    renderPlanner()

    await screen.findByRole('button', { name: /^Flaschen füllen/ })
    await nummernWaehlen(user, 'Flaschen füllen', [12])
    await user.type(screen.getByPlaceholderText('z. B. 1,5'), '1')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(putAuth).not.toHaveBeenCalled()
    expect(
      await screen.findByText('Bitte Atemschutzgerätewart und Feuerwehr wählen'),
    ).toBeInTheDocument()
  })
})
