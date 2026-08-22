import { useEffect, useMemo, useState } from "react";
import { Button, Card, Drawer, Empty, Form, Input, InputNumber, Popconfirm, Select, Skeleton, Space, Table, Tag, theme } from 'antd';
import { myToastError, myToastSuccess } from "../helper/ToastHelper";
import { doDeleteRequestAuth, doGetRequestAuth, doPostRequestAuth } from "../helper/RequestHelper";
import { WORK_TYPES, summarizeSearchRow } from "../helper/auftrag";
import { getUserToID, isAdmin } from "../helper/helpFunctions";
import useIsMobile from "../hooks/useIsMobile";

// Die erfassten Arbeiten als Chips - nur was tatsächlich anfiel.
function Arbeitsarten({ row, color }) {
  const parts = summarizeSearchRow(row);
  if (parts.length === 0) {
    return <span style={{ color }}>Sonstige Aufgabe</span>;
  }
  return (
    <Space size={[4, 4]} wrap>
      {parts.map((p) => (
        <Tag key={p.key} style={{ marginInlineEnd: 0 }}>
          {p.count}× {p.label}
        </Tag>
      ))}
    </Space>
  );
}

function Search(props) {
  const [users, setUsers] = useState([]);
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState();
  const [entwurf, setEntwurf] = useState();
  const [saving, setSaving] = useState(false);

  const isMobile = useIsMobile();
  const { token } = theme.useToken();
  const darfBearbeiten = isAdmin(props.loggedFunctionNo);

  const userOptions = useMemo(
    () => users.map((u) => ({ value: u.persNo, label: `${u.firstname} ${u.lastname}` })),
    [users]
  );

  function doSearch(persNo) {
    if (!persNo) return Promise.resolve();
    setLoading(true);
    return doPostRequestAuth("search", { persNo }, props.token)
      .then((res) => setDataSource(res.data ?? []))
      .catch(() => myToastError("Einträge konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    doGetRequestAuth("pers", props.token)
      .then((res) => setUsers(res.data ?? []))
      .catch(() => myToastError("Gerätewarte konnten nicht geladen werden."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (users.length === 0) return;
    const me = getUserToID(props.loggedPersNo, users);
    setSelectedUser(me?.persNo);
    doSearch(me?.persNo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  function handleUserChange(persNo) {
    setSelectedUser(persNo);
    doSearch(persNo);
  }

  function handleSave() {
    // Die Anzahl-Felder von /search heißen teils anders als die von
    // updateEntry - deshalb die Übersetzung über WORK_TYPES.
    const params = {
      dataNo: entwurf.key,
      arbeitszeit: entwurf.timeWork,
      bemerkung: entwurf.bemerkung,
    };
    for (const type of WORK_TYPES) {
      params[type.countField] = entwurf[type.searchField] ?? 0;
    }

    setSaving(true);
    doPostRequestAuth("updateEntry", params, props.token)
      .then(() => {
        myToastSuccess('Änderung gespeichert');
        setEntwurf(undefined);
        return doSearch(selectedUser);
      })
      .catch(() => myToastError('Fehler beim Speichern'))
      .finally(() => setSaving(false));
  }

  function handleDelete() {
    setSaving(true);
    doDeleteRequestAuth("deleteEntry", { dataNo: entwurf.key }, props.token)
      .then(() => {
        myToastSuccess('Eintrag gelöscht');
        setEntwurf(undefined);
        return doSearch(selectedUser);
      })
      .catch(() => myToastError('Fehler beim Löschen'))
      .finally(() => setSaving(false));
  }

  const columns = [
    { title: 'Feuerwehr', dataIndex: 'city', key: 'city' },
    { title: 'Datum', dataIndex: 'dateWork', key: 'dateWork', width: 120 },
    { title: 'Zeit (h)', dataIndex: 'timeWork', key: 'timeWork', width: 100 },
    {
      title: 'Arbeiten',
      key: 'arbeiten',
      render: (_, row) => <Arbeitsarten row={row} color={token.colorTextSecondary} />,
    },
    { title: 'Bemerkung', dataIndex: 'bemerkung', key: 'bemerkung' },
    {
      title: '',
      key: 'action',
      width: 140,
      // Vorher stand die Aktionsspalte am Ende einer ~1100px breiten Tabelle
      // und war ohne langes Scrollen nicht erreichbar.
      fixed: 'right',
      render: (_, row) =>
        darfBearbeiten ? (
          <Button onClick={() => setEntwurf({ ...row })}>Bearbeiten</Button>
        ) : null,
    },
  ];

  const filter = (
    <Form layout="vertical" style={{ marginBottom: isMobile ? 12 : 16 }}>
      <Form.Item label="Atemschutzgerätewart" style={{ marginBottom: 0 }}>
        <Select
          showSearch
          aria-label="Atemschutzgerätewart"
          optionFilterProp="label"
          disabled={!darfBearbeiten}
          value={selectedUser}
          options={userOptions}
          onChange={handleUserChange}
          placeholder="Atemschutzgerätewart"
        />
      </Form.Item>
    </Form>
  );

  let inhalt;
  if (loading) {
    inhalt = <Skeleton active paragraph={{ rows: 5 }} />;
  } else if (dataSource.length === 0) {
    inhalt = <Empty description="Keine Einträge gefunden" />;
  } else if (isMobile) {
    inhalt = (
      <Space direction="vertical" size={12} style={{ display: 'flex' }}>
        {dataSource.map((row) => (
          <Card key={row.key} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
              <strong style={{ fontSize: 17 }}>{row.city || 'Ohne Feuerwehr'}</strong>
              <span style={{ color: token.colorTextSecondary, whiteSpace: 'nowrap' }}>
                {row.dateWork}
              </span>
            </div>
            <div style={{ color: token.colorTextSecondary, marginTop: 2 }}>
              #{row.key} · {row.timeWork} h
            </div>
            <div style={{ marginTop: 10 }}>
              <Arbeitsarten row={row} color={token.colorTextSecondary} />
            </div>
            {row.bemerkung && (
              <div style={{ marginTop: 8, color: token.colorTextSecondary }}>{row.bemerkung}</div>
            )}
            {darfBearbeiten && (
              <Button block style={{ marginTop: 14 }} onClick={() => setEntwurf({ ...row })}>
                Bearbeiten
              </Button>
            )}
          </Card>
        ))}
      </Space>
    );
  } else {
    inhalt = (
      <Table rowKey="key" dataSource={dataSource} columns={columns} scroll={{ x: 'max-content' }} />
    );
  }

  return (
    <>
      {filter}
      {inhalt}

      <Drawer
        open={Boolean(entwurf)}
        onClose={() => setEntwurf(undefined)}
        placement="bottom"
        height={isMobile ? '100%' : '85%'}
        title={entwurf ? `Eintrag #${entwurf.key} · ${entwurf.city || 'ohne Feuerwehr'}` : ''}
        footer={
          <div style={{ display: 'flex', gap: 12, paddingBottom: 'var(--safe-bottom)' }}>
            {/* Löschen sitzt bewusst getrennt von Speichern - vorher lagen die
                beiden Knöpfe etwa 8px auseinander. */}
            <Popconfirm
              title="Eintrag löschen?"
              description="Das lässt sich nicht rückgängig machen."
              okText="Löschen"
              okButtonProps={{ danger: true }}
              cancelText="Abbrechen"
              onConfirm={handleDelete}
            >
              <Button danger size="large">Löschen</Button>
            </Popconfirm>
            <Button type="primary" size="large" style={{ flex: 1 }} loading={saving} onClick={handleSave}>
              Speichern
            </Button>
          </div>
        }
      >
        {entwurf && (
          <Form layout="vertical">
            <Space size={12} style={{ display: 'flex' }} align="start">
              <Form.Item label="Datum" style={{ flex: 1 }}>
                <Input value={entwurf.dateWork} disabled />
              </Form.Item>
              <Form.Item label="Arbeitszeit (h)" style={{ flex: 1 }}>
                <InputNumber
                  aria-label="Arbeitszeit"
                  value={entwurf.timeWork}
                  onChange={(v) => setEntwurf({ ...entwurf, timeWork: v })}
                  min={0}
                  max={10}
                  step={0.5}
                  decimalSeparator=","
                  inputMode="decimal"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Space>

            {/* Ein Feld pro Zeile mit Label darüber. Vorher fraß das addonBefore
                bei 358px Modalbreite über die Hälfte und ließ dem Zahlenfeld
                rund 80px. */}
            {WORK_TYPES.map((type) => (
              <Form.Item key={type.key} label={type.label} style={{ marginBottom: 12 }}>
                <InputNumber
                  aria-label={type.label}
                  value={entwurf[type.searchField]}
                  onChange={(v) => setEntwurf({ ...entwurf, [type.searchField]: v })}
                  precision={0}
                  min={0}
                  max={10}
                  inputMode="numeric"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            ))}

            <Form.Item label="Bemerkung">
              <Input
                aria-label="Bemerkung"
                value={entwurf.bemerkung}
                onChange={(e) => setEntwurf({ ...entwurf, bemerkung: e.target.value })}
              />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </>
  );
}

export default Search;
