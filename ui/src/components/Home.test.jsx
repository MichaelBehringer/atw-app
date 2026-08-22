import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router'
import AppProviders from '../AppProviders'

// Ein offener Auftrag mit 2 Flaschen und 1 Maske - drei Punkte insgesamt.
const OFFENER_AUFTRAG = {
  key: 142,
  city: 'Amerbach',
  cityNo: 2,
  dateWork: '22.08.2026',
  state: 'open',
  flaschenFuellenNr: '12,15',
  flaschenTUEVNr: '',
  maskenPruefenNr: '3',
  maskenReinigenNr: '',
  laPruefenNr: '',
  laReinigenNr: '',
  geraetePruefenNr: '',
  geraeteReinigenNr: '',
}

const postAuth = vi.fn()

vi.mock('../helper/RequestHelper', () => ({
  doPostRequestAuth: (path, params, token) => postAuth(path, params, token),
  doGetRequestAuth: () => Promise.resolve({ data: [] }),
  doPutRequestAuth: () => Promise.resolve({ status: 200, data: {} }),
  doDeleteRequestAuth: () => Promise.resolve({ data: {} }),
  doPostRequest: () => Promise.resolve({ data: {} }),
  doGetRequestBlob: () => Promise.resolve({ data: new Blob() }),
}))

const { default: Home } = await import('./Home')

const ATW = 1
const EXTERN = 3

function renderHome(functionNo = ATW) {
  return render(
    <AppProviders>
      <HashRouter>
        <Home token="t" loggedPersNo={7} loggedFunctionNo={functionNo} />
      </HashRouter>
    </AppProviders>,
  )
}

// Liefert die params des letzten updateEntryTree-Aufrufs.
function letzteMeldung() {
  const call = postAuth.mock.calls.filter((c) => c[0] === 'updateEntryTree').at(-1)
  return call?.[1]
}

async function sheetOeffnenUndZeitEintragen(user) {
  await user.click(await screen.findByRole('button', { name: 'Abarbeiten' }))
  const zeit = await screen.findByPlaceholderText('z. B. 1,5')
  await user.type(zeit, '1,5')
}

describe('Home', () => {
  beforeEach(() => {
    postAuth.mockReset()
    postAuth.mockImplementation((path) =>
      path === 'searchOpen'
        ? Promise.resolve({ data: [OFFENER_AUFTRAG] })
        : Promise.resolve({ data: {} }),
    )
  })

  it('zeigt den Auftrag als Karte mit Zusammenfassung', async () => {
    renderHome()

    expect(await screen.findByText('Amerbach')).toBeInTheDocument()
    expect(screen.getByText(/2× Flaschen füllen/)).toBeInTheDocument()
    expect(screen.getByText(/1× Masken prüfen/)).toBeInTheDocument()
  })

  it('zeigt Externen "Ansehen" statt "Abarbeiten"', async () => {
    renderHome(EXTERN)

    expect(await screen.findByRole('button', { name: /Ansehen/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Abarbeiten' })).not.toBeInTheDocument()
  })

  it('meldet nur die angehakten Punkte und schließt den Auftrag NICHT', async () => {
    const user = userEvent.setup()
    renderHome()
    await sheetOeffnenUndZeitEintragen(user)

    await user.click(screen.getByRole('checkbox', { name: 'Flasche 12' }))

    // Die Beschriftung benennt die Teilerledigung.
    const button = screen.getByRole('button', { name: '1 Punkt fertig melden' })
    await user.click(button)

    const params = letzteMeldung()
    expect(params.workingPoints).toEqual(['ff#12'])
    // Entscheidend: ohne root bleibt der Auftrag offen.
    expect(params.workingPoints).not.toContain('root')
    expect(params.dataNo).toBe(142)
    expect(params.city).toBe(2)
    expect(params.timeWork).toBe(1.5)
  })

  it('sendet root, wenn alle Punkte abgehakt sind', async () => {
    const user = userEvent.setup()
    renderHome()
    await sheetOeffnenUndZeitEintragen(user)

    for (const name of ['Flasche 12', 'Flasche 15', 'Maske 3']) {
      await user.click(screen.getByRole('checkbox', { name }))
    }

    // Der Button wechselt die Beschriftung, sobald alles erledigt ist.
    await user.click(screen.getByRole('button', { name: 'Auftrag abschließen' }))

    const params = letzteMeldung()
    expect(params.workingPoints).toContain('root')
    expect(params.workingPoints).toEqual(expect.arrayContaining(['ff#12', 'ff#15', 'mp#3']))
  })

  it('hakt mit "Alle wählen" einen ganzen Abschnitt ab, aber nicht den Auftrag', async () => {
    const user = userEvent.setup()
    renderHome()
    await sheetOeffnenUndZeitEintragen(user)

    // Der Abschnitt "Flaschen füllen" hat zwei Punkte, "Masken prüfen" einen.
    const [ersterAlle] = screen.getAllByRole('button', { name: 'Alle wählen' })
    await user.click(ersterAlle)

    await user.click(screen.getByRole('button', { name: '2 Punkte fertig melden' }))

    const params = letzteMeldung()
    expect(params.workingPoints).toEqual(['ff#12', 'ff#15'])
    expect(params.workingPoints).not.toContain('root')
  })

  it('sperrt das Melden, solange nichts ausgewählt ist', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(await screen.findByRole('button', { name: 'Abarbeiten' }))

    expect(await screen.findByRole('button', { name: 'Nichts ausgewählt' })).toBeDisabled()
  })

  it('verlangt eine Arbeitszeit', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(await screen.findByRole('button', { name: 'Abarbeiten' }))
    await user.click(await screen.findByRole('checkbox', { name: 'Flasche 12' }))
    await user.click(screen.getByRole('button', { name: '1 Punkt fertig melden' }))

    // Ohne Arbeitszeit darf nichts gesendet werden.
    expect(letzteMeldung()).toBeUndefined()
    expect(await screen.findByText('Bitte Arbeitszeit und Datum füllen')).toBeInTheDocument()
  })

  it('zeigt den Zähler je Abschnitt', async () => {
    const user = userEvent.setup()
    renderHome()

    await user.click(await screen.findByRole('button', { name: 'Abarbeiten' }))
    expect(await screen.findByText('0/2')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Flasche 12' }))
    expect(await screen.findByText('1/2')).toBeInTheDocument()
  })

  it('zeigt einen leeren Zustand ohne offene Aufträge', async () => {
    postAuth.mockImplementation(() => Promise.resolve({ data: [] }))
    renderHome()

    expect(await screen.findByText('Keine offenen Aufträge')).toBeInTheDocument()
  })

  it('hakt mit "Alles auswaehlen" den ganzen Auftrag ab', async () => {
    const user = userEvent.setup()
    renderHome()
    await sheetOeffnenUndZeitEintragen(user)

    // Der haeufigste Fall ist "alles erledigt" - ein Tipp statt drei.
    await user.click(screen.getByRole('button', { name: 'Alles auswählen' }))

    await user.click(screen.getByRole('button', { name: 'Auftrag abschließen' }))

    const params = letzteMeldung()
    expect(params.workingPoints).toContain('root')
    expect(params.workingPoints).toEqual(expect.arrayContaining(['ff#12', 'ff#15', 'mp#3']))
  })

  it('zeigt den Gesamtfortschritt und kann die Auswahl wieder aufheben', async () => {
    const user = userEvent.setup()
    renderHome()
    await sheetOeffnenUndZeitEintragen(user)

    expect(await screen.findByText('0 von 3 erledigt')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Alles auswählen' }))
    expect(await screen.findByText('3 von 3 erledigt')).toBeInTheDocument()

    // Ist alles gewaehlt, wird derselbe Knopf zum Aufheben.
    await user.click(screen.getByRole('button', { name: 'Alles abwählen' }))
    expect(await screen.findByText('0 von 3 erledigt')).toBeInTheDocument()
  })
})
