import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HashRouter } from 'react-router'
import AppProviders from '../AppProviders'
import Authentication from './Authentication'

// Smoke-Test des Login-Screens: prueft, dass React 19, react-router 8 und die
// antd-6-Formularkomponenten zusammen tatsaechlich rendern und reagieren.
// Bewusst inklusive AppProviders, damit Theme, deutsches Locale und die
// message-Bruecke mitgetestet werden.
function renderLogin(props = {}) {
  return render(
    <AppProviders>
      <HashRouter>
        <Authentication setToken={vi.fn()} {...props} />
      </HashRouter>
    </AppProviders>,
  )
}

describe('Authentication', () => {
  it('rendert das Login-Formular', () => {
    renderLogin()
    expect(screen.getByPlaceholderText('Benutzername')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Passwort')).toBeInTheDocument()
    expect(screen.getByLabelText('Angemeldet bleiben')).not.toBeChecked()
    expect(screen.getByRole('button', { name: /anmelden/i })).toBeInTheDocument()
  })

  it('validiert leere Pflichtfelder statt abzuschicken', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /anmelden/i }))

    expect(await screen.findByText('Bitte Benutzernamen angeben!')).toBeInTheDocument()
    expect(await screen.findByText('Bitte Passwort angeben!')).toBeInTheDocument()
  })

  it('nimmt Eingaben an', async () => {
    const user = userEvent.setup()
    renderLogin()

    const username = screen.getByPlaceholderText('Benutzername')
    await user.type(username, 'testuser')

    expect(username).toHaveValue('testuser')
  })
})
