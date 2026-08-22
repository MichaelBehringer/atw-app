import { Button, Checkbox, Collapse, DatePicker, Drawer, Empty, Form, InputNumber, Space, theme } from 'antd'
import locale from 'antd/es/date-picker/locale/de_DE'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { buildSections, buildWorkingPoints, isComplete } from '../helper/auftrag'
import useIsMobile from '../hooks/useIsMobile'

const DATE_FORMAT = 'DD.MM.YYYY'

// Eine Zeile der Checkliste. Die Trefferfläche ist die ganze Breite und
// mindestens 48px hoch - abgehakt wird das mit einem Finger, oft im Stehen
// und mit dem Gerät in der anderen Hand.
function ItemRow({ item, checked, onToggle, borderColor }) {
  return (
    <Checkbox
      checked={checked}
      onChange={(e) => onToggle(item.key, e.target.checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        minHeight: 48,
        margin: 0,
        paddingInline: 4,
        borderBottom: `1px solid ${borderColor}`,
      }}
    >
      <span style={{ fontSize: 16 }}>{item.label}</span>
    </Checkbox>
  )
}

export default function AuftragSheet({ entry, open, onClose, onSubmit, saving }) {
  const isMobile = useIsMobile()
  const { token } = theme.useToken()

  const [checkedKeys, setCheckedKeys] = useState([])
  const [arbeitszeit, setArbeitszeit] = useState()
  const [datum, setDatum] = useState(dayjs())

  const sections = useMemo(() => buildSections(entry), [entry])

  // Bei jedem neu geöffneten Auftrag von vorn anfangen.
  useEffect(() => {
    if (open) {
      setCheckedKeys([])
      setArbeitszeit(undefined)
      setDatum(dayjs())
    }
  }, [open, entry?.key])

  const complete = isComplete(checkedKeys, sections)
  const checkedCount = buildWorkingPoints(checkedKeys, sections).filter((k) => k.includes('#')).length

  function toggle(key, checked) {
    setCheckedKeys((prev) => (checked ? [...prev, key] : prev.filter((k) => k !== key)))
  }

  function toggleSection(section, selectAll) {
    const keys = section.items.map((i) => i.key)
    setCheckedKeys((prev) =>
      selectAll
        ? [...new Set([...prev, ...keys])]
        : prev.filter((k) => !keys.includes(k))
    )
  }

  function handleSubmit() {
    onSubmit({
      workingPoints: buildWorkingPoints(checkedKeys, sections),
      dateWork: datum,
      timeWork: arbeitszeit,
      complete,
    })
  }

  const collapseItems = sections.map((section) => {
    const keys = section.items.map((i) => i.key)
    const done = keys.filter((k) => checkedKeys.includes(k)).length
    const allDone = done === keys.length

    return {
      key: section.key,
      label: (
        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingRight: 4 }}>
          <span style={{ fontWeight: 600 }}>{section.label}</span>
          <span style={{ color: allDone ? token.colorSuccess : token.colorTextSecondary, fontVariantNumeric: 'tabular-nums' }}>
            {done}/{keys.length}
          </span>
        </span>
      ),
      children: (
        <>
          {section.items.map((item) => (
            <ItemRow
              key={item.key}
              item={item}
              checked={checkedKeys.includes(item.key)}
              onToggle={toggle}
              borderColor={token.colorBorderSecondary}
            />
          ))}
          <div style={{ textAlign: 'right', paddingTop: 8 }}>
            <Button type="link" onClick={() => toggleSection(section, !allDone)}>
              {allDone ? 'Auswahl aufheben' : 'Alle wählen'}
            </Button>
          </div>
        </>
      ),
    }
  })

  // Abschnitte mit offenen Punkten sind aufgeklappt, fertige zugeklappt.
  const activeKeys = sections
    .filter((s) => !s.items.every((i) => checkedKeys.includes(i.key)))
    .map((s) => s.key)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      placement="bottom"
      height={isMobile ? '100%' : '85%'}
      title={entry ? `Auftrag #${entry.key} · ${entry.city}` : 'Auftrag'}
      styles={{ body: { paddingTop: 8 } }}
      footer={
        <div style={{ paddingBottom: 'var(--safe-bottom)' }}>
          <Form layout="vertical" style={{ marginBottom: 12 }}>
            <Space size={12} style={{ display: 'flex' }} align="start">
              <Form.Item label="Arbeitszeit (h)" style={{ marginBottom: 0, flex: 1 }} required>
                <InputNumber
                  value={arbeitszeit}
                  onChange={setArbeitszeit}
                  min={0}
                  max={10}
                  step={0.5}
                  decimalSeparator=","
                  inputMode="decimal"
                  placeholder="z. B. 1,5"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="Datum" style={{ marginBottom: 0, flex: 1 }} required>
                <DatePicker
                  locale={locale}
                  format={DATE_FORMAT}
                  value={datum}
                  onChange={setDatum}
                  allowClear={false}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Space>
          </Form>
          {/* Die Beschriftung sagt, was passiert: bei Teilerledigung bleibt der
              Auftrag offen, bei Vollerledigung wird er geschlossen. Diesen
              Unterschied konnte man vorher nirgends sehen. */}
          <Button
            type="primary"
            size="large"
            block
            loading={saving}
            disabled={checkedCount === 0}
            onClick={handleSubmit}
          >
            {checkedCount === 0
              ? 'Nichts ausgewählt'
              : complete
                ? 'Auftrag abschließen'
                : `${checkedCount} ${checkedCount === 1 ? 'Punkt' : 'Punkte'} fertig melden`}
          </Button>
        </div>
      }
    >
      {sections.length === 0 ? (
        <Empty description="Für diesen Auftrag sind keine Arbeitspunkte hinterlegt." />
      ) : (
        <Collapse items={collapseItems} defaultActiveKey={activeKeys} ghost size="large" />
      )}
    </Drawer>
  )
}
