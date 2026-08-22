import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import AppProviders from '../AppProviders'

const USERS = [{ persNo: 7, firstname: 'Max', lastname: 'Muster', cityNo: 2 }]
const CITIES = [
  { cityNo: 1, name: 'Wemding' },
  { cityNo: 2, name: 'Amerbach' },
]

// So liefert /entry/:id einen bestehenden Auftrag. Das Datum kommt als
// DD.MM.YYYY - genau die Schreibweise, die dayjs ohne customParseFormat
// nicht lesen kann.
const ENTRY = {
  dataNo: 142,
  city: 2,
  dateWork: '20.05.2024',
  arbeitszeit: 1.5,
  flaschenFuellenNr: '12,15,22',
  flaschenTUEVNr: '',
  maskenPruefenNr: '3',
  maskenReinigenNr: '',
  laPruefenNr: '',
  laReinigenNr: '',
  geraetePruefenNr: '',
  geraeteReinigenNr: '',
}

const putAuth = vi.fn()

vi.mock('../helper/RequestHelper', () => ({
  doGetRequestAuth: (path) => {
    if (path === 'pers') return Promise.resolve({ data: USERS })
    if (path === 'cities') return Promise.resolve({ data: CITIES })
    if (path === 'entry/142') return Promise.resolve({ data: ENTRY })
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

function renderEdit(functionNo) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={['/planner/142']}>
        <Routes>
          <Route
            path="/planner/:editId"
            element={<Planner token="t" loggedPersNo={7} loggedFunctionNo={functionNo} />}
          />
        </Routes>
      </MemoryRouter>
    </AppProviders>,
  )
}

describe('Planner im Bearbeiten-Modus', () => {
  beforeEach(() => {
    putAuth.mockReset()
    putAuth.mockResolvedValue({ status: 200, data: {} })
  })

  it('zeigt die Nummern des bestehenden Auftrags in der Zeile', async () => {
    renderEdit(ADMIN)

    // Genau das ist der Zweck: die Nummern einer alten Anlieferung ansehen,
    // ohne etwas antippen zu muessen.
    expect(
      await screen.findByRole('button', { name: /^Flaschen füllen 12 · 15 · 22 3/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Masken prüfen 3 1/ })).toBeInTheDocument()
    // Arbeitsarten ohne Nummern bleiben leer.
    expect(screen.getByRole('button', { name: /^Flaschen TÜV –/ })).toBeInTheDocument()
  })

  it('uebernimmt das Datum aus dem Auftrag', async () => {
    renderEdit(ADMIN)

    // Ohne dayjs-Plugin customParseFormat stand hier "Invalid Date".
    const datum = await screen.findByDisplayValue('20.05.2024')
    expect(datum).toBeInTheDocument()
  })

  it('laesst Externe die Nummern ansehen, aber nicht aendern', async () => {
    const user = userEvent.setup()
    renderEdit(EXTERN)

    await user.click(await screen.findByRole('button', { name: /^Flaschen füllen/ }))

    // Das Sheet oeffnet sich zum Ansehen: die belegten Nummern sind sichtbar,
    // aber es gibt kein Uebernehmen.
    expect(await screen.findByRole('button', { name: 'Fertig' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Übernehmen' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nummer 12' })).toBeInTheDocument()
    // Und keine freien Nummern zum Anhaken.
    expect(screen.queryByRole('button', { name: 'Nummer 1' })).not.toBeInTheDocument()
  })

  it('speichert eine Aenderung ueber saveEntry', async () => {
    const user = userEvent.setup()
    renderEdit(ADMIN)

    await user.click(await screen.findByRole('button', { name: 'Speichern' }))

    const [path, params] = putAuth.mock.calls.at(-1)
    expect(path).toBe('saveEntry')
    expect(params.editId).toBe('142')
    expect(params.flaschenFuellenNr).toBe('12,15,22')
    expect(params.flaschenFuellen).toBe(3)
    expect(params.dateWork).toBe('2024-05-20')
  })
})
