import { describe, expect, it, vi } from 'vitest'
import { act, render } from '@testing-library/react'
import { useState } from 'react'
import useCloseOnBack from './useCloseOnBack'

// Minimalbeispiel: ein Overlay, das sich per Knopf oder per Zurück-Geste
// schließen lässt.
function Overlay({ onClose }) {
  const [open, setOpen] = useState(false)

  function close() {
    setOpen(false)
    onClose?.()
  }

  useCloseOnBack(open, close)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        öffnen
      </button>
      <button type="button" onClick={close}>
        schließen
      </button>
      <span>{open ? 'offen' : 'zu'}</span>
    </>
  )
}

// Die Zurück-Geste des Browsers auslösen. jsdom führt history.back() nicht
// synchron aus, deshalb der Umweg über das Ereignis.
function zurueckGeste() {
  act(() => {
    window.dispatchEvent(new PopStateEvent('popstate'))
  })
}

describe('useCloseOnBack', () => {
  it('legt beim Öffnen einen Verlaufseintrag an', () => {
    const push = vi.spyOn(window.history, 'pushState')
    const { getByText } = render(<Overlay />)

    expect(push).not.toHaveBeenCalled()

    act(() => getByText('öffnen').click())

    // Ohne diesen Eintrag wirkt die Zurück-Geste auf die App selbst.
    expect(push).toHaveBeenCalledTimes(1)
    expect(push.mock.calls[0][0]).toEqual({ atwOverlay: true })
    push.mockRestore()
  })

  it('schließt das Overlay bei der Zurück-Geste', () => {
    const onClose = vi.fn()
    const { getByText } = render(<Overlay onClose={onClose} />)

    act(() => getByText('öffnen').click())
    expect(getByText('offen')).toBeInTheDocument()

    zurueckGeste()

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(getByText('zu')).toBeInTheDocument()
  })

  it('räumt den eigenen Eintrag ab, wenn per Knopf geschlossen wird', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { getByText } = render(<Overlay />)

    act(() => getByText('öffnen').click())
    act(() => getByText('schließen').click())

    // Sonst bräuchte man danach zwei Zurück-Gesten für einen Schritt.
    expect(back).toHaveBeenCalledTimes(1)
    back.mockRestore()
  })

  it('räumt nach der Zurück-Geste nichts zusätzlich ab', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { getByText } = render(<Overlay />)

    act(() => getByText('öffnen').click())
    zurueckGeste()

    // Der Eintrag ist durch die Geste schon weg - ein weiteres back() würde
    // einen Schritt zu viel zurückgehen.
    expect(back).not.toHaveBeenCalled()
    back.mockRestore()
  })

  it('legt bei erneutem Öffnen wieder genau einen Eintrag an', () => {
    const push = vi.spyOn(window.history, 'pushState')
    vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { getByText } = render(<Overlay />)

    act(() => getByText('öffnen').click())
    act(() => getByText('schließen').click())
    act(() => getByText('öffnen').click())

    expect(push).toHaveBeenCalledTimes(2)
    vi.restoreAllMocks()
  })

  it('reagiert nicht, solange das Overlay zu ist', () => {
    const onClose = vi.fn()
    render(<Overlay onClose={onClose} />)

    zurueckGeste()

    // Sonst würde ein normaler Zurück-Schritt einen onClose auslösen.
    expect(onClose).not.toHaveBeenCalled()
  })
})
