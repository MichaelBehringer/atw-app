import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router'
import AppProviders from '../AppProviders'

// Alle Netzwerkaufrufe stilllegen. Es geht hier um die Shell - Kopfzeile,
// Navigation, Rollenfilter - nicht um die Inhalte der einzelnen Seiten.
const checkTokenResponse = vi.fn()

vi.mock('../helper/RequestHelper', () => ({
  doGetRequestAuth: (path) =>
    path === 'checkToken'
      ? checkTokenResponse()
      : Promise.resolve({ data: [] }),
  doPostRequestAuth: () => Promise.resolve({ data: [] }),
  doPostRequest: () => Promise.resolve({ data: {} }),
  doPutRequestAuth: () => Promise.resolve({ status: 200, data: {} }),
  doDeleteRequestAuth: () => Promise.resolve({ data: {} }),
  doGetRequestBlob: () => Promise.resolve({ data: new Blob() }),
}))

const { default: App } = await import('./App')

const ATW = 1
const ADMIN = 2
const EXTERN = 3

function renderApp(functionNo, removeToken = vi.fn()) {
  checkTokenResponse.mockResolvedValue({
    data: { username: 'Max Muster', persNo: 7, functionNo },
  })
  return {
    removeToken,
    ...render(
      <AppProviders>
        <HashRouter>
          <App token="test-token" removeToken={removeToken} />
        </HashRouter>
      </AppProviders>,
    ),
  }
}

describe('App-Shell', () => {
  beforeEach(() => {
    checkTokenResponse.mockReset()
  })

  it('zeigt Externen genau zwei Navigationspunkte', async () => {
    renderApp(EXTERN)

    expect(await screen.findByRole('button', { name: 'Aufträge' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anliefern' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Suche' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mehr' })).not.toBeInTheDocument()
  })

  it('gibt Gerätewarten die Suche, aber keine Verwaltung', async () => {
    renderApp(ATW)

    expect(await screen.findByRole('button', { name: 'Suche' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Erfassung' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mehr' })).not.toBeInTheDocument()
  })

  it('gibt Admins alle vier Punkte', async () => {
    renderApp(ADMIN)

    expect(await screen.findByRole('button', { name: 'Mehr' })).toBeInTheDocument()
    for (const label of ['Aufträge', 'Erfassung', 'Suche']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('markiert den aktiven Punkt für Screenreader', async () => {
    renderApp(ATW)

    const auftraege = await screen.findByRole('button', { name: 'Aufträge' })
    expect(auftraege).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Suche' })).not.toHaveAttribute('aria-current')
  })

  it('zeigt die Initialen des angemeldeten Nutzers', async () => {
    renderApp(ATW)

    expect(await screen.findByText('MM')).toBeInTheDocument()
  })

  it('verwirft ein ungültiges Token und zeigt die Anmeldung', async () => {
    const removeToken = vi.fn()
    // So antwortet der Server auf ein Token aus einer älteren Installation
    // oder nach einem Wechsel des Signaturschlüssels.
    checkTokenResponse.mockRejectedValue({ response: { status: 405 } })

    render(
      <AppProviders>
        <HashRouter>
          <App token="altes-token" removeToken={removeToken} />
        </HashRouter>
      </AppProviders>,
    )

    // Ohne diese Behandlung blieb die App für immer im Ladezustand.
    await vi.waitFor(() => expect(removeToken).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Bitte neu anmelden')).toBeInTheDocument()
  })

  it('behält das Token bei einem Netzwerkfehler und bietet einen neuen Versuch', async () => {
    const removeToken = vi.fn()
    // Kein response heißt Funkloch, nicht ungültiges Token.
    checkTokenResponse.mockRejectedValue(new Error('Network Error'))

    render(
      <AppProviders>
        <HashRouter>
          <App token="gutes-token" removeToken={removeToken} />
        </HashRouter>
      </AppProviders>,
    )

    expect(await screen.findByText('Keine Verbindung zum Server')).toBeInTheDocument()
    // Sonst würde ein kurzer Verbindungsabbruch alle abmelden.
    expect(removeToken).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Erneut versuchen' })).toBeInTheDocument()
  })

  it('lädt nach "Erneut versuchen" die Anmeldedaten', async () => {
    const user = userEvent.setup()
    // Erster Aufruf scheitert, jeder weitere gelingt.
    checkTokenResponse.mockRejectedValueOnce(new Error('Network Error'))
    checkTokenResponse.mockResolvedValue({
      data: { username: 'Max Muster', persNo: 7, functionNo: ATW },
    })

    render(
      <AppProviders>
        <HashRouter>
          <App token="gutes-token" removeToken={vi.fn()} />
        </HashRouter>
      </AppProviders>,
    )

    await user.click(await screen.findByRole('button', { name: 'Erneut versuchen' }))

    expect(await screen.findByRole('button', { name: 'Aufträge' })).toBeInTheDocument()
  })
})
