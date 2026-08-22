import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router'
import AppProviders from '../AppProviders'

const getBlob = vi.fn()

vi.mock('../helper/RequestHelper', () => ({
  doGetRequestBlob: (path) => getBlob(path),
  doGetRequestAuth: () => Promise.resolve({ data: [] }),
  doPostRequestAuth: () => Promise.resolve({ status: 200, data: {} }),
  doPutRequestAuth: () => Promise.resolve({ status: 200, data: {} }),
  doDeleteRequestAuth: () => Promise.resolve({ status: 200, data: {} }),
  doPostRequest: () => Promise.resolve({ data: {} }),
}))

const { default: Evaluation } = await import('./Evaluation')

const AKTUELLES_JAHR = new Date().getFullYear()

function renderEvaluation() {
  return render(
    <AppProviders>
      <HashRouter>
        <Evaluation token="t" loggedFunctionNo={2} loggedPersNo={7} />
      </HashRouter>
    </AppProviders>,
  )
}

describe('Evaluation', () => {
  beforeEach(() => {
    getBlob.mockReset()
    getBlob.mockResolvedValue({ data: new Blob(['x']), headers: {} })
    // window.URL.createObjectURL fehlt in jsdom.
    window.URL.createObjectURL = vi.fn(() => 'blob:test')
    window.URL.revokeObjectURL = vi.fn()
  })

  it('ist mit dem laufenden Jahr vorbelegt', async () => {
    renderEvaluation()

    expect(
      await screen.findByRole('button', { name: `Jahresauswertung ${AKTUELLES_JAHR} herunterladen` }),
    ).toBeInTheDocument()
  })

  it('gibt das gewählte Jahr an das Backend weiter', async () => {
    const user = userEvent.setup()
    renderEvaluation()

    await user.click(await screen.findByRole('combobox', { name: 'Jahr' }))
    await user.click(await screen.findByTitle('2024'))

    // Die Beschriftung nennt das Jahr, damit man vor dem Download sieht, was
    // man bekommt.
    await user.click(screen.getByRole('button', { name: 'Jahresauswertung 2024 herunterladen' }))

    expect(getBlob).toHaveBeenCalledWith('file?year=2024')
  })

  it('bietet die Jahre absteigend ab 2020 an', async () => {
    const user = userEvent.setup()
    renderEvaluation()

    await user.click(await screen.findByRole('combobox', { name: 'Jahr' }))

    expect(await screen.findByTitle('2020')).toBeInTheDocument()
    // Das laufende Jahr steht zweimal im DOM: im Feld und in der Liste.
    expect(screen.getAllByTitle(String(AKTUELLES_JAHR)).length).toBeGreaterThan(0)
    expect(screen.queryByTitle('2019')).not.toBeInTheDocument()
  })

  it('zeigt während der Erzeugung einen Ladezustand', async () => {
    const user = userEvent.setup()
    // Antwort offen lassen, damit der Zwischenzustand sichtbar bleibt.
    getBlob.mockReturnValue(new Promise(() => {}))
    renderEvaluation()

    await user.click(
      await screen.findByRole('button', { name: `Jahresauswertung ${AKTUELLES_JAHR} herunterladen` }),
    )

    // Die ZIP-Erzeugung dauert gut eine Sekunde - ohne Rückmeldung wirkt der
    // Knopf kaputt.
    expect(await screen.findByRole('button', { name: /Auswertung wird erstellt/ })).toBeInTheDocument()
  })

  it('blendet die nicht implementierte AGW-Auswertung aus', async () => {
    renderEvaluation()

    await screen.findByRole('button', { name: /Jahresauswertung/ })
    expect(screen.queryByRole('button', { name: /Jahresauswertung AGW/ })).not.toBeInTheDocument()
  })
})
