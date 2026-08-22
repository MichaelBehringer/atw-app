import { useState } from "react";
import { Button, Card, Descriptions, Segmented, Space, Typography } from 'antd';
import { LogoutOutlined } from "@ant-design/icons";
import { isATW, isAdmin, isExternal } from "../helper/helpFunctions";
import { useColorSchemeSetting } from "../colorScheme";
import ChangePasswordModal from "./ChangePasswordModal";

const { Title, Text } = Typography;

function rollenName(functionNo) {
  if (isATW(functionNo)) return 'Atemschutzgerätewart';
  if (isAdmin(functionNo)) return 'Administrator';
  if (isExternal(functionNo)) return 'Externe Feuerwehr';
  return 'Unbekannt';
}

function Account(props) {
  const [pwOpen, setPwOpen] = useState(false);
  const { preference, setPreference } = useColorSchemeSetting();

  return (
    <>
      <Title level={5} style={{ marginTop: 0 }}>Angemeldet als</Title>
      <Card size="small" style={{ marginBottom: 24 }}>
        <Descriptions
          column={1}
          size="small"
          items={[
            { key: 'name', label: 'Name', children: props.loggedUsername ?? '–' },
            { key: 'role', label: 'Rolle', children: rollenName(props.loggedFunctionNo) },
          ]}
        />
      </Card>

      <Title level={5}>Erscheinungsbild</Title>
      <Segmented
        block
        value={preference}
        onChange={setPreference}
        style={{ marginBottom: 8 }}
        options={[
          { value: 'system', label: 'Automatisch' },
          { value: 'light', label: 'Hell' },
          { value: 'dark', label: 'Dunkel' },
        ]}
      />
      <Text type="secondary">
        „Automatisch" folgt der Einstellung des Geräts.
      </Text>

      <Title level={5} style={{ marginTop: 24 }}>Sicherheit</Title>
      <Space direction="vertical" size={10} style={{ display: 'flex' }}>
        <Button size="large" block onClick={() => setPwOpen(true)}>
          Passwort ändern
        </Button>
        <Button size="large" block danger icon={<LogoutOutlined aria-hidden />} onClick={props.removeToken}>
          Abmelden
        </Button>
      </Space>

      <div style={{ marginTop: 32, textAlign: 'center' }}>
        <Text type="secondary">Atemschutz-App · Version {__APP_VERSION__}</Text>
      </div>

      {/* Bewusst dieselbe Komponente wie im Profil-Menü. Vorher gab es hier eine
          zweite, eigene Umsetzung derselben Maske. */}
      <ChangePasswordModal
        visible={pwOpen}
        setIsVisible={setPwOpen}
        loggedPersNo={props.loggedPersNo}
        token={props.token}
        onClose={() => setPwOpen(false)}
      />
    </>
  );
}

export default Account;
