import { Button, Drawer, theme } from 'antd'
import { useEffect, useState } from 'react'
import useIsMobile from '../hooks/useIsMobile'

export const MAX_NUMMER = 99

// Auswahl der Gerätenummern als antippbares Raster.
//
// Vorher war das ein Multi-Select mit 99 Optionen in einer 115px breiten
// Spalte. Hier ist jede Nummer eine eigene Fläche von ~44px, die Auswahl
// braucht keine Tastatur und man sieht auf einen Blick, was gewählt ist.
export default function NummernPicker({
  open,
  title,
  value = [],
  onClose,
  onSubmit,
  // Nur ansehen: fuer Externe, die eine bereits gemeldete Anlieferung
  // aufrufen. Die Nummern sollen sichtbar, aber nicht aenderbar sein.
  readOnly = false,
}) {
  const { token } = theme.useToken()
  const isMobile = useIsMobile()
  const [selected, setSelected] = useState([])

  // Beim Öffnen den aktuellen Stand übernehmen, damit Abbrechen wirklich
  // nichts verändert.
  useEffect(() => {
    if (open) setSelected(value.map(Number))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function toggle(nr) {
    if (readOnly) return
    setSelected((prev) => (prev.includes(nr) ? prev.filter((n) => n !== nr) : [...prev, nr]))
  }

  const sortiert = [...selected].sort((a, b) => a - b)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      height={isMobile ? '100dvh' : '80%'}
      title={title}
      styles={{ body: { paddingTop: 12 } }}
      footer={
        <div style={{ display: 'flex', gap: 12, paddingBottom: 'var(--safe-bottom)' }}>
          {/* Beschriftung nicht "Schliessen": so heisst schon das X des Sheets. */}
          {readOnly ? (
            <Button type="primary" size="large" block onClick={onClose}>
              Fertig
            </Button>
          ) : (
            <>
              <Button size="large" style={{ flex: 1 }} onClick={onClose}>
                Abbrechen
              </Button>
              <Button
                type="primary"
                size="large"
                style={{ flex: 2 }}
                onClick={() => onSubmit(sortiert.map(String))}
              >
                Übernehmen
              </Button>
            </>
          )}
        </div>
      }
    >
      <div
        style={{
          marginBottom: 16,
          minHeight: 24,
          color: sortiert.length ? token.colorText : token.colorTextSecondary,
        }}
      >
        {sortiert.length === 0 ? (
          'Noch keine Nummer gewählt'
        ) : (
          <>
            <strong>{sortiert.length} gewählt:</strong> {sortiert.join(' · ')}
          </>
        )}
      </div>

      {/* auto-fill statt fester Spaltenzahl: am Handy passen rund sieben
          Nummern pro Reihe, am PC entsprechend mehr. Beim reinen Ansehen nur
          die belegten Nummern - ein Raster ohne Tippmoeglichkeit hilft nicht. */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
          gap: 8,
        }}
      >
        {(readOnly
          ? sortiert
          : Array.from({ length: MAX_NUMMER }, (_, i) => i + 1)
        ).map((nr) => {
          const aktiv = selected.includes(nr)
          return (
            <button
              key={nr}
              type="button"
              onClick={() => toggle(nr)}
              aria-pressed={readOnly ? undefined : aktiv}
              aria-label={`Nummer ${nr}`}
              style={{
                minHeight: 44,
                borderRadius: token.borderRadius,
                cursor: readOnly ? 'default' : 'pointer',
                fontSize: 16,
                fontVariantNumeric: 'tabular-nums',
                border: `1px solid ${aktiv ? token.colorPrimary : token.colorBorder}`,
                background: aktiv ? token.colorPrimary : token.colorBgContainer,
                color: aktiv ? token.colorTextLightSolid : token.colorText,
                fontWeight: aktiv ? 600 : 400,
              }}
            >
              {nr}
            </button>
          )
        })}
      </div>
    </Drawer>
  )
}
