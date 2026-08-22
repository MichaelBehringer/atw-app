import { Button, Card, Drawer, Empty, Form, Input, Popconfirm, Select, Skeleton, Space, Table, Tag, theme } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { doDeleteRequestAuth, doGetRequestAuth, doPostRequestAuth } from "../helper/RequestHelper";
import { myToastError, myToastSuccess } from "../helper/ToastHelper";
import { isExternal } from "../helper/helpFunctions";
import useCloseOnBack from "../hooks/useCloseOnBack";
import useIsMobile from "../hooks/useIsMobile";
import AddUserModal from "./AddUserModal";

function UserManagement(props) {
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [entwurf, setEntwurf] = useState();
  const [saving, setSaving] = useState(false);

  const isMobile = useIsMobile();
  const { token } = theme.useToken();
  useCloseOnBack(Boolean(entwurf), () => setEntwurf(undefined));
  useCloseOnBack(addOpen, () => setAddOpen(false));

  function loadUser() {
    setLoading(true);
    return doGetRequestAuth("persExtra", props.token)
      .then((res) =>
        setUsers(
          (res.data ?? []).map((row) => ({
            key: row.persNo,
            firstname: row.firstname,
            lastname: row.lastname,
            username: row.username,
            functionNo: row.functionNo,
            functionName: row.functionName,
            cityNo: row.cityNo,
            cityName: row.cityName,
          }))
        )
      )
      .catch(() => myToastError("Benutzer konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUser();
    doGetRequestAuth("cities", props.token).then((res) =>
      setCities((res.data ?? []).map((row) => ({ key: row.cityNo, cityName: row.name })))
    );
    doGetRequestAuth("function", props.token).then((res) =>
      setFunctions((res.data ?? []).map((row) => ({ key: row.functionNo, functionName: row.functionName })))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const optionsFunctions = useMemo(
    () => functions.map((f) => ({ value: f.key, label: f.functionName })),
    [functions]
  );
  const optionsCities = useMemo(
    () => cities.map((c) => ({ value: c.key, label: c.cityName })),
    [cities]
  );

  function handleSave() {
    setSaving(true);
    doPostRequestAuth("updateUser", entwurf, props.token)
      .then(() => {
        myToastSuccess('Benutzer gespeichert');
        setEntwurf(undefined);
        return loadUser();
      })
      .catch(() => myToastError('Fehler beim Speichern'))
      .finally(() => setSaving(false));
  }

  function handleDelete(user) {
    doDeleteRequestAuth("deleteUser", { userNo: user.key }, props.token)
      .then(() => {
        myToastSuccess('Benutzer gelöscht');
        return loadUser();
      })
      .catch(() => myToastError('Fehler beim Löschen'));
  }

  const columns = [
    { title: 'Name', key: 'name', render: (_, u) => `${u.firstname} ${u.lastname}` },
    { title: 'Benutzername', dataIndex: 'username', key: 'username' },
    {
      title: 'Rolle',
      key: 'role',
      render: (_, u) => <Tag>{u.functionName}</Tag>,
    },
    { title: 'Feuerwehr', dataIndex: 'cityName', key: 'cityName' },
    {
      title: '',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, u) => (
        <Space>
          <Button onClick={() => setEntwurf({ ...u })}>Bearbeiten</Button>
          <Popconfirm
            title="Benutzer löschen?"
            description="Das lässt sich nicht rückgängig machen."
            okText="Löschen"
            okButtonProps={{ danger: true }}
            cancelText="Abbrechen"
            onConfirm={() => handleDelete(u)}
          >
            <Button danger>Löschen</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  let inhalt;
  if (loading) {
    inhalt = <Skeleton active paragraph={{ rows: 5 }} />;
  } else if (users.length === 0) {
    inhalt = <Empty description="Keine Benutzer" />;
  } else if (isMobile) {
    // Inline-Editing in einer Tabelle mit fünf Feldern pro Zeile war am Handy
    // nicht bedienbar - jetzt Karte plus Bearbeiten-Sheet.
    inhalt = (
      <Space direction="vertical" size={12} style={{ display: 'flex' }}>
        {users.map((u) => (
          <Card key={u.key} size="small">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
              <strong style={{ fontSize: 17 }}>{u.firstname} {u.lastname}</strong>
              <Tag style={{ marginInlineEnd: 0 }}>{u.functionName}</Tag>
            </div>
            <div style={{ color: token.colorTextSecondary, marginTop: 2 }}>
              {u.username}{u.cityName ? ` · ${u.cityName}` : ''}
            </div>
            <Button block style={{ marginTop: 12 }} onClick={() => setEntwurf({ ...u })}>
              Bearbeiten
            </Button>
          </Card>
        ))}
      </Space>
    );
  } else {
    inhalt = <Table rowKey="key" dataSource={users} columns={columns} scroll={{ x: 'max-content' }} />;
  }

  return (
    <>
      <Button
        type="primary"
        size="large"
        block={isMobile}
        icon={<PlusOutlined aria-hidden />}
        onClick={() => setAddOpen(true)}
        style={{ marginBottom: 16 }}
      >
        Neuer Benutzer
      </Button>

      {inhalt}

      <AddUserModal
        token={props.token}
        isModalAGWOpen={addOpen}
        handleModalAGWCancel={() => setAddOpen(false)}
        optionsFunctions={optionsFunctions}
        optionsCities={optionsCities}
        loadUser={loadUser}
      />

      <Drawer
        open={Boolean(entwurf)}
        onClose={() => setEntwurf(undefined)}
        placement="bottom"
        height={isMobile ? '100dvh' : '70%'}
        title={entwurf ? `${entwurf.firstname} ${entwurf.lastname}` : ''}
        footer={
          <div style={{ display: 'flex', gap: 12, paddingBottom: 'var(--safe-bottom)' }}>
            <Popconfirm
              title="Benutzer löschen?"
              description="Das lässt sich nicht rückgängig machen."
              okText="Löschen"
              okButtonProps={{ danger: true }}
              cancelText="Abbrechen"
              onConfirm={() => {
                const u = entwurf;
                setEntwurf(undefined);
                handleDelete(u);
              }}
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
            <Form.Item label="Rolle">
              <Select
                aria-label="Rolle"
                value={entwurf.functionNo}
                options={optionsFunctions}
                onChange={(value, option) =>
                  setEntwurf({ ...entwurf, functionNo: value, functionName: option.label })
                }
              />
            </Form.Item>
            <Form.Item
              label="Feuerwehr"
              // Nur Externe gehören zu einer auswärtigen Feuerwehr.
              extra={!isExternal(entwurf.functionNo) ? 'Nur für die Rolle "Extern" wählbar' : undefined}
            >
              <Select
                showSearch
                aria-label="Feuerwehr"
                optionFilterProp="label"
                disabled={!isExternal(entwurf.functionNo)}
                value={entwurf.cityNo}
                options={optionsCities}
                onChange={(value, option) =>
                  setEntwurf({ ...entwurf, cityNo: value, cityName: option.label })
                }
              />
            </Form.Item>
            <Form.Item label="Vorname">
              <Input
                value={entwurf.firstname}
                onChange={(e) => setEntwurf({ ...entwurf, firstname: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Nachname">
              <Input
                value={entwurf.lastname}
                onChange={(e) => setEntwurf({ ...entwurf, lastname: e.target.value })}
              />
            </Form.Item>
            <Form.Item label="Benutzername" extra="Der Benutzername kann nicht geändert werden.">
              <Input value={entwurf.username} disabled />
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </>
  );
}

export default UserManagement;
