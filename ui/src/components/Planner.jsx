import { Button, Collapse, DatePicker, Divider, Form, Input, InputNumber, Modal, Select, Space, theme } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import locale from 'antd/es/date-picker/locale/de_DE';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { doGetRequestAuth, doPutRequestAuth } from '../helper/RequestHelper';
import { myToastError, myToastSuccess } from '../helper/ToastHelper';
import { WORK_TYPES } from '../helper/auftrag';
import { getCityToID, getUserToID, isAdmin, isExternal } from '../helper/helpFunctions';
import NummernPicker from './NummernPicker';

const { TextArea } = Input;
const DATE_FORMAT = 'DD.MM.YYYY';

// Die vier Gruppen der Erfassungsmaske. Die Arbeitsarten selbst kommen aus
// helper/auftrag.js, damit Beschriftungen und Schlüssel an einer Stelle stehen.
const GROUPS = [
  { title: 'Flaschen', keys: ['ff', 'ft'] },
  { title: 'Masken', keys: ['mp', 'mr'] },
  { title: 'Lungenautomat', keys: ['lp', 'lr'] },
  { title: 'Gerät', keys: ['gp', 'gr'] },
];

// Das Backend erwartet weiterhin BEIDE Angaben - Anzahl und Nummernliste. Die
// Anzahl ist aber nichts anderes als die Länge der Liste, deshalb gibt es dafür
// kein Eingabefeld mehr und der Wert wird abgeleitet. Damit ist die alte
// Abgleichprüfung ("Anzahl der eingegebenen Nummern passt nicht") strukturell
// unmöglich geworden.
const WORK_TYPE_BY_KEY = Object.fromEntries(WORK_TYPES.map((t) => [t.key, t]));

function emptyNumbers() {
  return Object.fromEntries(WORK_TYPES.map((t) => [t.key, []]));
}

function buildWorkPayload(numbers) {
  const payload = {};
  for (const type of WORK_TYPES) {
    const list = numbers[type.key] ?? [];
    payload[type.countField] = list.length;
    payload[type.field] = list.join(',');
  }
  return payload;
}

// Eine Zeile pro Arbeitsart: Beschriftung sichtbar (vorher steckte sie in
// einem Tooltip, den es auf Touch nicht gibt), rechts die abgeleitete Anzahl.
// Bewusst auf Modulebene - innerhalb von Planner definiert waere sie bei jedem
// Render ein neuer Komponententyp und React wuerde den Teilbaum neu aufbauen.
function WorkTypeRow({ type, count, disabled, last, token, onOpen }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        width: '100%',
        minHeight: 52,
        padding: '0 4px',
        background: 'transparent',
        border: 'none',
        borderBottom: last ? 'none' : `1px solid ${token.colorBorderSecondary}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        color: token.colorText,
        fontSize: 16,
        textAlign: 'left',
      }}
    >
      <span>{type.label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontWeight: count ? 600 : 400,
            color: count ? token.colorPrimary : token.colorTextSecondary,
          }}
        >
          {count || '–'}
        </span>
        <RightOutlined aria-hidden style={{ fontSize: 12, color: token.colorTextTertiary }} />
      </span>
    </button>
  );
}

function Planner(props) {
  const { editId } = useParams();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedUser, setSelectedUser] = useState();
  const [selectedCity, setSelectedCity] = useState();

  const [numbers, setNumbers] = useState(emptyNumbers);
  const [picker, setPicker] = useState(null);

  const [arbeitszeit, setArbeitszeit] = useState();
  const [datum, setDatum] = useState(dayjs());
  const [saving, setSaving] = useState(false);

  const [extraOpen, setExtraOpen] = useState(false);
  const [extraNotice, setExtraNotice] = useState('Monatliche Kurzprüfung');

  const readOnlyExtern = isExternal(props.loggedFunctionNo);
  const fieldsLocked = readOnlyExtern && Boolean(editId);

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.persNo, label: `${u.firstname} ${u.lastname}` })),
    [users]
  );
  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c.cityNo, label: c.name })),
    [cities]
  );

  useEffect(() => {
    doGetRequestAuth('pers', props.token).then((res) => setUsers(res.data ?? []));
    doGetRequestAuth('cities', props.token).then((res) => setCities(res.data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Vorbelegung: der angemeldete Gerätewart, bei Externen zusätzlich die
  // eigene Feuerwehr.
  useEffect(() => {
    if (users.length === 0) return;
    const me = getUserToID(props.loggedPersNo, users);
    setSelectedUser(me?.persNo);
    if (readOnlyExtern && cities.length > 0 && me) {
      setSelectedCity(getCityToID(me.cityNo, cities)?.cityNo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, cities]);

  // Bearbeiten: bestehenden Auftrag laden.
  useEffect(() => {
    if (!editId) return;
    doGetRequestAuth('entry/' + editId, props.token).then((res) => {
      const entry = res.data;
      setSelectedCity(entry.city);
      setArbeitszeit(entry.arbeitszeit);
      setDatum(entry.dateWork ? dayjs(entry.dateWork, DATE_FORMAT) : dayjs());
      setNumbers(
        Object.fromEntries(
          WORK_TYPES.map((t) => [t.key, (entry[t.field] ?? '').split(',').filter(Boolean)])
        )
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  function resetFields(resetCity = true) {
    if (resetCity) setSelectedCity(undefined);
    setNumbers(emptyNumbers());
    setArbeitszeit(undefined);
    setDatum(dayjs());
  }

  const totalItems = Object.values(numbers).reduce((sum, list) => sum + list.length, 0);

  function handleSave() {
    if (!selectedUser || !selectedCity) {
      myToastError('Bitte Atemschutzgerätewart und Feuerwehr wählen');
      return;
    }
    if (datum === null) {
      myToastError('Bitte ein Datum wählen');
      return;
    }
    if (!readOnlyExtern && (arbeitszeit === undefined || arbeitszeit === null)) {
      myToastError('Bitte die Arbeitszeit angeben');
      return;
    }
    if (totalItems === 0) {
      myToastError('Bitte mindestens eine Gerätenummer wählen');
      return;
    }

    const params = {
      user: selectedUser,
      city: selectedCity,
      ...buildWorkPayload(numbers),
      arbeitszeit: readOnlyExtern ? 0 : arbeitszeit,
      dateWork: datum.format('YYYY-MM-DD'),
      editId,
    };

    // Externe melden eine Anlieferung an (Auftrag entsteht), Gerätewarte
    // erfassen erledigte Arbeit.
    const path = readOnlyExtern ? 'createEntryProposal' : editId ? 'saveEntry' : 'createEntry';

    setSaving(true);
    doPutRequestAuth(path, params, props.token)
      .then(() => {
        myToastSuccess('Speichern erfolgreich');
        resetFields(!readOnlyExtern);
        if (editId) navigate('/home');
      })
      .catch(() => myToastError('Fehler beim Speichern'))
      .finally(() => setSaving(false));
  }

  function handleExtraSave() {
    if (!selectedUser || arbeitszeit === undefined || arbeitszeit === null || datum === null || extraNotice === '') {
      myToastError('Bitte alle Felder füllen');
      return;
    }
    const params = {
      user: selectedUser,
      arbeitszeit,
      dateWork: datum.format('YYYY-MM-DD'),
      bemerkung: extraNotice,
    };
    doPutRequestAuth('createExtraEntry', params, props.token)
      .then(() => {
        myToastSuccess('Speichern erfolgreich');
        setExtraOpen(false);
        setExtraNotice('Monatliche Kurzprüfung');
        setArbeitszeit(undefined);
        setDatum(dayjs());
      })
      .catch(() => myToastError('Fehler beim Speichern'));
  }

  const groupItems = GROUPS.map((group) => {
    const groupCount = group.keys.reduce((sum, k) => sum + (numbers[k]?.length ?? 0), 0);
    return {
      key: group.title,
      label: (
        <span style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingRight: 4 }}>
          <span style={{ fontWeight: 600 }}>{group.title}</span>
          {groupCount > 0 && (
            <span style={{ color: token.colorPrimary, fontVariantNumeric: 'tabular-nums' }}>
              {groupCount}
            </span>
          )}
        </span>
      ),
      children: group.keys.map((k, i) => (
        <WorkTypeRow
          key={k}
          type={WORK_TYPE_BY_KEY[k]}
          count={numbers[k]?.length ?? 0}
          disabled={fieldsLocked}
          last={i === group.keys.length - 1}
          token={token}
          onOpen={() => setPicker(k)}
        />
      )),
    };
  });

  return (
    <>
      <Form layout="vertical">
        {editId && <Divider titlePlacement="left">Auftrag #{editId}</Divider>}

        {!readOnlyExtern && (
          <Form.Item label="Atemschutzgerätewart" required>
            <Select
              showSearch
              aria-label="Atemschutzgerätewart"
              optionFilterProp="label"
              disabled={!isAdmin(props.loggedFunctionNo)}
              value={selectedUser}
              options={userOptions}
              onChange={setSelectedUser}
              placeholder="Atemschutzgerätewart"
            />
          </Form.Item>
        )}

        <Form.Item label="Feuerwehr" required>
          <Select
            showSearch
            aria-label="Feuerwehr"
            optionFilterProp="label"
            disabled={readOnlyExtern || Boolean(editId)}
            value={selectedCity}
            options={cityOptions}
            onChange={setSelectedCity}
            placeholder="Feuerwehr"
          />
        </Form.Item>

        <Collapse
          items={groupItems}
          defaultActiveKey={GROUPS.map((g) => g.title)}
          ghost
          size="large"
          style={{ marginBottom: 8 }}
        />

        <Space size={12} style={{ display: 'flex' }} align="start">
          {!readOnlyExtern && (
            <Form.Item label="Arbeitszeit (h)" style={{ flex: 1 }} required>
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
          )}
          <Form.Item label="Datum" style={{ flex: 1 }} required>
            <DatePicker
              locale={locale}
              format={DATE_FORMAT}
              value={datum}
              onChange={setDatum}
              disabled={fieldsLocked}
              allowClear={false}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Space>
      </Form>

      {/* Klebende Leiste: der Speichern-Button lag vorher rund 900px unter dem
          sichtbaren Bereich. */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          paddingTop: 12,
          paddingBottom: 4,
          background: token.colorBgContainer,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          gap: 12,
        }}
      >
        {!readOnlyExtern && !editId && (
          <Button size="large" style={{ flex: 1 }} onClick={() => setExtraOpen(true)}>
            Sonstige Aufgabe
          </Button>
        )}
        <Button
          type="primary"
          size="large"
          style={{ flex: 2 }}
          loading={saving}
          disabled={fieldsLocked}
          onClick={handleSave}
        >
          {totalItems > 0
            ? `${totalItems} ${totalItems === 1 ? 'Gerät' : 'Geräte'} speichern`
            : 'Speichern'}
        </Button>
      </div>

      <NummernPicker
        open={picker !== null}
        title={picker ? WORK_TYPE_BY_KEY[picker].label : ''}
        value={picker ? numbers[picker] : []}
        onClose={() => setPicker(null)}
        onSubmit={(list) => {
          setNumbers((prev) => ({ ...prev, [picker]: list }));
          setPicker(null);
        }}
      />

      <Modal
        title="Sonstige Aufgabe"
        open={extraOpen}
        onCancel={() => setExtraOpen(false)}
        onOk={handleExtraSave}
        okText="Speichern"
        cancelText="Abbrechen"
      >
        <Form layout="vertical">
          <Form.Item label="Atemschutzgerätewart">
            <Select
              showSearch
              optionFilterProp="label"
              disabled={!isAdmin(props.loggedFunctionNo)}
              value={selectedUser}
              options={userOptions}
              onChange={setSelectedUser}
            />
          </Form.Item>
          <Form.Item label="Bemerkung">
            <TextArea rows={3} value={extraNotice} onChange={(e) => setExtraNotice(e.target.value)} />
          </Form.Item>
          <Space size={12} style={{ display: 'flex' }} align="start">
            <Form.Item label="Arbeitszeit (h)" style={{ flex: 1, marginBottom: 0 }}>
              <InputNumber
                value={arbeitszeit}
                onChange={setArbeitszeit}
                min={0}
                max={10}
                step={0.5}
                decimalSeparator=","
                inputMode="decimal"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="Datum" style={{ flex: 1, marginBottom: 0 }}>
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
      </Modal>
    </>
  );
}

export default Planner;
