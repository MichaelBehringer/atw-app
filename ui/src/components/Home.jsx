import { Button, Card, Empty, Skeleton, Space, Table, Tag, theme } from "antd";
import { isExternal } from "../helper/helpFunctions";
import { EyeOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { doPostRequestAuth } from "../helper/RequestHelper";
import { useNavigate } from "react-router";
import { myToastError, myToastSuccess } from "../helper/ToastHelper";
import { summarize } from "../helper/auftrag";
import useIsMobile from "../hooks/useIsMobile";
import AuftragSheet from "./AuftragSheet";

// "4× Flaschen füllen · 2× Masken prüfen" - was an diesem Auftrag zu tun ist,
// ohne ihn öffnen zu müssen.
function AuftragZusammenfassung({ entry, color }) {
  const parts = summarize(entry);

  if (parts.length === 0) {
    return <span style={{ color }}>Keine Arbeitspunkte hinterlegt</span>;
  }

  return (
    <span style={{ color }}>
      {parts.map((p) => `${p.count}× ${p.label}`).join(' · ')}
    </span>
  );
}

function Home(props) {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { token } = theme.useToken();

  const readOnly = isExternal(props.loggedFunctionNo);

  function doSearch() {
    const params = { persNo: props.loggedPersNo, isExternal: readOnly };
    return doPostRequestAuth("searchOpen", params, props.token)
      .then((res) => setDataSource(res.data ?? []))
      .catch(() => myToastError("Aufträge konnten nicht geladen werden."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    doSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit({ workingPoints, dateWork, timeWork, complete }) {
    if (timeWork === null || timeWork === undefined || dateWork === null) {
      myToastError("Bitte Arbeitszeit und Datum füllen");
      return;
    }

    const params = {
      dataNo: selectedEntry.key,
      city: selectedEntry.cityNo,
      user: props.loggedPersNo,
      workingPoints,
      dateWork: dateWork.format('YYYY-MM-DD'),
      timeWork,
    };

    setSaving(true);
    doPostRequestAuth('updateEntryTree', params, props.token)
      .then(() => {
        myToastSuccess(complete ? "Auftrag abgeschlossen" : "Arbeitspunkte gemeldet");
        setSelectedEntry(undefined);
        return doSearch();
      })
      .catch(() => myToastError("Speichern fehlgeschlagen"))
      .finally(() => setSaving(false));
  }

  function openEntry(entry) {
    if (readOnly) {
      navigate('/planner/' + entry.key);
    } else {
      setSelectedEntry(entry);
    }
  }

  if (loading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }

  if (dataSource.length === 0) {
    return <Empty description="Keine offenen Aufträge" />;
  }

  // Am Handy Karten: eine Tabelle mit sechs Spalten ist auf 390px nicht
  // lesbar, und die Hauptaktion war bisher ein 14px-Symbol in einer Zelle.
  const cards = (
    <Space direction="vertical" size={12} style={{ display: 'flex' }}>
      {dataSource.map((entry) => (
        <Card key={entry.key} size="small">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <strong style={{ fontSize: 17 }}>{entry.city}</strong>
            <Tag color={entry.state === 'open' ? 'orange' : 'green'} style={{ marginInlineEnd: 0 }}>
              {entry.state === 'open' ? 'offen' : 'abgeschlossen'}
            </Tag>
          </div>
          <div style={{ color: token.colorTextSecondary, marginTop: 2 }}>
            #{entry.key} · {entry.dateWork}
          </div>
          <div style={{ marginTop: 10, lineHeight: 1.5 }}>
            <AuftragZusammenfassung entry={entry} color={token.colorText} />
          </div>
          <Button
            type="primary"
            size="large"
            block
            style={{ marginTop: 14 }}
            onClick={() => openEntry(entry)}
            icon={readOnly ? <EyeOutlined /> : undefined}
          >
            {readOnly ? 'Ansehen' : 'Abarbeiten'}
          </Button>
        </Card>
      ))}
    </Space>
  );

  const columns = [
    { title: '#', dataIndex: 'key', key: 'key', width: 80 },
    {
      title: 'Status',
      dataIndex: 'state',
      key: 'state',
      width: 140,
      render: (state) => (
        <Tag color={state === 'open' ? 'orange' : 'green'}>
          {state === 'open' ? 'offen' : 'abgeschlossen'}
        </Tag>
      ),
    },
    { title: 'Feuerwehr', dataIndex: 'city', key: 'city' },
    { title: 'Datum', dataIndex: 'dateWork', key: 'dateWork', width: 130 },
    {
      title: 'Arbeitspunkte',
      key: 'summary',
      render: (_, entry) => <AuftragZusammenfassung entry={entry} color={token.colorTextSecondary} />,
    },
    {
      title: '',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, entry) => (
        <Button type="primary" onClick={() => openEntry(entry)}>
          {readOnly ? 'Ansehen' : 'Abarbeiten'}
        </Button>
      ),
    },
  ];

  return (
    <>
      {isMobile ? cards : <Table rowKey="key" dataSource={dataSource} columns={columns} scroll={{ x: 'max-content' }} />}
      <AuftragSheet
        entry={selectedEntry}
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(undefined)}
        onSubmit={handleSubmit}
        saving={saving}
      />
    </>
  );
}

export default Home;
