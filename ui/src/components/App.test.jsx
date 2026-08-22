import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HashRouter } from 'react-router'
import AppProviders from '../AppProviders'

// Alle Netzwerkaufrufe stilllegen. Es geht hier um die Shell - Kopfzeile,
// Navigation, Rollenfilter - nicht um die Inhalte der einzelnen Seiten.
const checkTokenResponse = vi.fn()

vi.mock('../helper/RequestHelper', () => ({
  doGetRequestAuth: (path) =>
    path === 'checkToken'
      ? Promise.resolve({ data: checkTokenResponse() })
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

function renderApp(functionNo) {
  checkTokenResponse.mockReturnValue({
    username: 'Max Muster',
    persNo: 7,
    functionNo,
  })
  return render(
    <AppProviders>
      <HashRouter>
        <App token="test-token" removeToken={vi.fn()} />
      </HashRouter>
    </AppProviders>,
  )
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
})
