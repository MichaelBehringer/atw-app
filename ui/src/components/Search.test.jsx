import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router'
import AppProviders from '../AppProviders'

const USERS = [{ persNo: 7, firstname: 'Max', lastname: 'Muster', cityNo: 1 }]

// So liefert /search einen Treffer - beachte die verschriebenen Geraete-Felder.
const TREFFER = {
  key: 501,
  city: 'Amerbach',
  dateWork: '20.08.2026',
  timeWork: 1.5,
  flaschenFuellen: 3,
  flaschenTUEV: 0,
  maskenPruefen: 1,
  maskenReinigen: 0,
  laPruefen: 0,
  laReinigen: 0,
  gereatPruefen: 2,
  gereatReinigen: 0,
  bemerkung: 'Alles in Ordnung',
}

const postAuth = vi.fn()
const deleteAuth = vi.fn()

vi.mock('../helper/RequestHelper', () => ({
  doGetRequestAuth: (path) =>
    path === 'pers' ? Promise.resolve({ data: USERS }) : Promise.resolve({ data: [] }),
  doPostRequestAuth: (path, params, token) => postAuth(path, params, token),
  doDeleteRequestAuth: (path, params, token) => deleteAuth(path, params, token),
  doPutRequestAuth: () => Promise.resolve({ status: 200, data: {} }),
  doPostRequest: () => Promise.resolve({ data: {} }),
  doGetRequestBlob: () => Promise.resolve({ data: new Blob() }),
}))

const { default: Search } = await import('./Search')

const ADMIN = 2
const ATW = 1

function renderSearch(functionNo = ADMIN) {
  return render(
    <AppProviders>
      <HashRouter>
        <Search token="t" loggedPersNo={7} loggedFunctionNo={functionNo} />
      </HashRouter>
    </AppProviders>,
  )
}

function letzteAenderung() {
  return postAuth.mock.calls.filter((c) => c[0] === 'updateEntry').at(-1)?.[1]
}

describe('Search', () => {
  beforeEach(() => {
    postAuth.mockReset()
    deleteAuth.mockReset()
    postAuth.mockImplementation((path) =>
      path === 'search'
        ? Promise.resolve({ data: [TREFFER] })
        : Promise.resolve({ status: 200, data: {} }),
    )
    deleteAuth.mockResolvedValue({ status: 200, data: {} })
  })

  it('zeigt den Treffer mit den erfassten Arbeiten', async () => {
    renderSearch()

    expect(await screen.findByText('Amerbach')).toBeInTheDocument()
    expect(screen.getByText('3× Flaschen füllen')).toBeInTheDocument()
    expect(screen.getByText('1× Masken prüfen')).toBeInTheDocument()
    // Aus gereatPruefen: 2 - das Feld heisst im Backend verschrieben.
    expect(screen.getByText('2× Geräte prüfen')).toBeInTheDocument()
    // Nullwerte tauchen nicht auf.
    expect(screen.queryByText(/Flaschen TÜV/)).not.toBeInTheDocument()
  })

  it('übersetzt die Feldnamen beim Speichern korrekt', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.click(await screen.findByRole('button', { name: 'Bearbeiten' }))
    await user.click(await screen.findByRole('button', { name: 'Speichern' }))

    const params = letzteAenderung()
    expect(params.dataNo).toBe(501)
    // updateEntry erwartet die korrekt geschriebenen Namen, /search liefert
    // die verschriebenen. Genau diese Übersetzung wird hier geprüft.
    expect(params.geraetePruefen).toBe(2)
    expect(params.flaschenFuellen).toBe(3)
    expect(params.maskenPruefen).toBe(1)
    expect(params.arbeitszeit).toBe(1.5)
    expect(params.bemerkung).toBe('Alles in Ordnung')
  })

  it('übernimmt Änderungen an einer Arbeitsart', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.click(await screen.findByRole('button', { name: 'Bearbeiten' }))

    const feld = await screen.findByRole('spinbutton', { name: 'Geräte prüfen' })
    await user.clear(feld)
    await user.type(feld, '5')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(letzteAenderung().geraetePruefen).toBe(5)
  })

  it('verlangt vor dem Löschen eine Bestätigung', async () => {
    const user = userEvent.setup()
    renderSearch()

    await user.click(await screen.findByRole('button', { name: 'Bearbeiten' }))
    await user.click(screen.getByRole('button', { name: 'Löschen' }))

    // Noch nichts gelöscht - erst die Rückfrage.
    expect(deleteAuth).not.toHaveBeenCalled()
    expect(await screen.findByText('Eintrag löschen?')).toBeInTheDocument()
  })

  it('lässt Gerätewarte nicht bearbeiten', async () => {
    renderSearch(ATW)

    expect(await screen.findByText('Amerbach')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument()
  })
})
