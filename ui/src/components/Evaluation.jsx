import { useMemo, useState } from "react";
import { Button, Card, Form, Input, List, Modal, Popconfirm, Select, Space, Typography, theme } from 'antd';
import { DeleteOutlined, DownloadOutlined, PlusOutlined, TeamOutlined } from "@ant-design/icons";
import { myToastError, myToastSuccess } from "../helper/ToastHelper";
import { doDeleteRequestAuth, doGetRequestAuth, doGetRequestBlob, doPostRequestAuth, doPutRequestAuth } from "../helper/RequestHelper";
import { useNavigate } from "react-router";
import useCloseOnBack from "../hooks/useCloseOnBack";

const { Title } = Typography;

// Auswahl der letzten Jahre. Es gibt keinen Endpunkt, der die Jahre mit Daten
// liefert, deshalb eine feste Spanne ab 2020 - das deckt den Bestand ab und
// waechst von selbst mit.
const ERSTES_JAHR = 2020;

function jahresOptionen() {
  const aktuell = new Date().getFullYear();
  const jahre = [];
  for (let jahr = aktuell; jahr >= ERSTES_JAHR; jahr -= 1) {
    jahre.push({ value: jahr, label: String(jahr) });
  }
  return jahre;
}

function Evaluation(props) {
  const [isModalFFOpen, setIsModalFFOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [txtNewCity, setTxtNewCity] = useState('');
  const [downloading, setDownloading] = useState(false);
  // Vorbelegt mit dem laufenden Jahr.
  const [jahr, setJahr] = useState(() => new Date().getFullYear());
  const jahre = useMemo(() => jahresOptionen(), []);
  const navigate = useNavigate();
  const { token } = theme.useToken();

  useCloseOnBack(isModalFFOpen, () => setIsModalFFOpen(false));

  function loadCities() {
    return doGetRequestAuth("cities", props.token)
      .then((res) =>
        setCities((res.data ?? []).map((row) => ({ key: row.cityNo, cityName: row.name })))
      )
      .catch(() => myToastError("Feuerwehren konnten nicht geladen werden."));
  }

  function showFFModal() {
    setIsModalFFOpen(true);
    loadCities();
  }

  function createNewCity() {
    if (!txtNewCity.trim()) {
      myToastError('Bitte einen Namen eingeben');
      return;
    }
    doPutRequestAuth("createCity", { name: txtNewCity.trim() }, props.token)
      .then(() => {
        myToastSuccess('Feuerwehr angelegt');
        setTxtNewCity('');
        return loadCities();
      })
      .catch(() => myToastError('Anlegen fehlgeschlagen - Feuerwehr schon vorhanden?'));
  }

  function handleUpdateFF(city) {
    doPostRequestAuth("updateCity", city, props.token)
      .then(() => myToastSuccess('Gespeichert'))
      .catch(() => myToastError('Fehler beim Speichern'));
  }

  function handleDeleteFF(city) {
    doDeleteRequestAuth("deleteCity", { cityNo: city.key }, props.token)
      .then(() => {
        myToastSuccess('Feuerwehr gelöscht');
        return loadCities();
      })
      .catch(() => myToastError('Fehler beim Löschen'));
  }

  // Die Auswertung erzeugt serverseitig 22 PDFs und packt sie - das dauert
  // gut eine Sekunde. Ohne Rückmeldung wirkt der Knopf kaputt.
  function handleFFAuswertung() {
    setDownloading(true);
    doGetRequestBlob(`file?year=${jahr}`)
      .then((response) => {
        const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute(
          'download',
          response.headers['content-language'] ?? `Auswertung_${jahr}.zip`
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(downloadUrl);
      })
      .catch(() => myToastError('Download fehlgeschlagen'))
      .finally(() => setDownloading(false));
  }

  return (
    <>
      <Title level={5} style={{ marginTop: 0 }}>Verwalten</Title>
      <Space direction="vertical" size={10} style={{ display: 'flex', marginBottom: 24 }}>
        <Button size="large" block icon={<TeamOutlined aria-hidden />} onClick={() => navigate('/userManagement')}>
          Benutzer verwalten
        </Button>
        <Button size="large" block icon={<TeamOutlined aria-hidden />} onClick={showFFModal}>
          Feuerwehren verwalten
        </Button>
      </Space>

      <Title level={5}>Auswertungen</Title>
      <Form layout="vertical">
        <Form.Item label="Jahr" style={{ marginBottom: 12 }}>
          <Select
            aria-label="Jahr"
            value={jahr}
            options={jahre}
            onChange={setJahr}
            style={{ width: '100%', maxWidth: 200 }}
          />
        </Form.Item>
      </Form>
      <Space direction="vertical" size={10} style={{ display: 'flex' }}>
        <Button
          type="primary"
          size="large"
          block
          icon={<DownloadOutlined aria-hidden />}
          loading={downloading}
          onClick={handleFFAuswertung}
        >
          {downloading
            ? 'Auswertung wird erstellt …'
            : `Jahresauswertung ${jahr} herunterladen`}
        </Button>
      </Space>
      {/* "Jahresauswertung AGW" war ein console.log ohne Funktion und ist
          deshalb ausgeblendet, bis es sie wirklich gibt. */}

      <Modal
        title="Feuerwehren verwalten"
        open={isModalFFOpen}
        onCancel={() => setIsModalFFOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalFFOpen(false)}>
            Zurück
          </Button>,
        ]}
      >
        <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
          <Input
            placeholder="Neue Feuerwehr"
            value={txtNewCity}
            onChange={(e) => setTxtNewCity(e.target.value)}
            onPressEnter={createNewCity}
          />
          <Button onClick={createNewCity} type="primary" icon={<PlusOutlined aria-hidden />}>
            Anlegen
          </Button>
        </Space.Compact>

        {/* Vorher eine horizontal scrollende Tabelle in einem Modal in einem
            230px breiten Container. Eine Liste braucht diese Breite nicht. */}
        <List
          dataSource={cities}
          locale={{ emptyText: 'Keine Feuerwehren' }}
          renderItem={(city) => (
            <List.Item style={{ paddingInline: 0 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={city.cityName}
                  aria-label={`Name von ${city.cityName}`}
                  onChange={(e) =>
                    setCities(
                      cities.map((item) =>
                        item.key === city.key ? { ...item, cityName: e.target.value } : item
                      )
                    )
                  }
                  onBlur={() => handleUpdateFF(city)}
                  onPressEnter={() => handleUpdateFF(city)}
                />
                <Popconfirm
                  title="Feuerwehr löschen?"
                  okText="Löschen"
                  okButtonProps={{ danger: true }}
                  cancelText="Abbrechen"
                  onConfirm={() => handleDeleteFF(city)}
                >
                  <Button danger icon={<DeleteOutlined aria-hidden />} aria-label={`${city.cityName} löschen`} />
                </Popconfirm>
              </Space.Compact>
            </List.Item>
          )}
        />
        <Card size="small" style={{ marginTop: 12, background: token.colorFillQuaternary }}>
          Änderungen am Namen werden beim Verlassen des Feldes gespeichert.
        </Card>
      </Modal>
    </>
  );
}

export default Evaluation;
