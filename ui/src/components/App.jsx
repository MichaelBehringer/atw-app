import { Route, Routes, useLocation, useNavigate } from "react-router";
import { Suspense, lazy, useEffect, useState } from 'react';
import { doGetRequestAuth } from "../helper/RequestHelper";

// Jeder Screen ein eigenes Bundle. Vorher lag die ganze App in einem Chunk
// von rund 1,36 MB, den auch jemand laden musste, der nur Auftraege abhakt.
const Home = lazy(() => import("./Home"));
const Planner = lazy(() => import("./Planner"));
const Search = lazy(() => import("./Search"));
const Evaluation = lazy(() => import("./Evaluation"));
const UserManagement = lazy(() => import("./UserManagement"));
const Account = lazy(() => import("./Account"));
import { myToastError, myToastInfo } from "../helper/ToastHelper";
import { Avatar, Button, Dropdown, Layout, Result, Skeleton, theme } from 'antd';
import AppNav, { BOTTOM_NAV_HEIGHT, SIDER_WIDTH } from "./AppNav";
import ChangePasswordModal from './ChangePasswordModal';
import useIsMobile from "../hooks/useIsMobile";
import { useColorSchemeSetting } from "../colorScheme";
import { titleFor } from "../navigation";

const { Header, Content } = Layout;

function App(props) {
  const [loggedPersNo, setLoggedPersNo] = useState();
  const [loggedFunctionNo, setLoggedFunctionNo] = useState();
  const [loggedInitials, setLoggedInitials] = useState();
  const [loggedUsername, setLoggedUsername] = useState();
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);
  const [verbindungsfehler, setVerbindungsfehler] = useState(false);

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const { preference, setPreference } = useColorSchemeSetting();

  const {
    token: { colorBgContainer, colorBgLayout, borderRadiusLG, colorBorderSecondary },
  } = theme.useToken();

  function pruefeToken() {
    setVerbindungsfehler(false);
    doGetRequestAuth('checkToken', props.token)
      .then((res) => {
        myToastInfo('Hallo ' + res.data.username);
        setLoggedUsername(res.data.username);
        setLoggedInitials(res.data.username.split(' ').map(word => word[0]).join(''));
        setLoggedPersNo(res.data.persNo);
        setLoggedFunctionNo(res.data.functionNo);
      })
      .catch((error) => {
        if (error.response) {
          // Das Token ist ungültig - etwa aus einer älteren Installation oder
          // nachdem der Signaturschlüssel gewechselt wurde. Ohne diese
          // Behandlung blieb die App für immer im Ladezustand hängen, statt die
          // Anmeldung zu zeigen, und man kam nur über das Löschen der
          // Websitedaten wieder heraus.
          myToastInfo('Bitte neu anmelden');
          props.removeToken();
        } else {
          // Kein response heißt Netzwerkfehler. Das Token ist dann
          // wahrscheinlich in Ordnung, deshalb wird es NICHT verworfen - sonst
          // würde ein kurzer Funkloch-Moment alle abmelden.
          myToastError('Keine Verbindung zum Server.');
          setVerbindungsfehler(true);
        }
      });
  }

  useEffect(() => {
    pruefeToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMenuClick = (e) => {
    if (e.key === 'account') {
      navigate('/account');
    } else if (e.key === 'changePassword') {
      setIsChangePasswordModalVisible(true);
    } else if (e.key === 'logout') {
      props.removeToken();
      myToastInfo('Logout erfolgreich');
    }
  };

  const menuItems = [
    { key: 'account', label: 'Konto' },
    { key: 'changePassword', label: 'Passwort ändern' },
    {
      key: 'appearance',
      label: 'Erscheinungsbild',
      children: [
        { key: 'system', label: 'Automatisch' },
        { key: 'light', label: 'Hell' },
        { key: 'dark', label: 'Dunkel' },
      ].map((option) => ({
        ...option,
        // Die aktive Wahl wird hervorgehoben, damit man sie im Untermenü sieht.
        label: preference === option.key ? `✓ ${option.label}` : option.label,
        onClick: () => setPreference(option.key),
      })),
    },
    { type: 'divider' },
    { key: 'logout', label: 'Abmelden', danger: true },
  ];

  const routeProps = {
    token: props.token,
    loggedFunctionNo,
    loggedPersNo,
    loggedUsername,
    removeToken: props.removeToken,
  };

  return (
    <>
      {(loggedPersNo && loggedFunctionNo) ? (
        <Layout style={{ minHeight: '100dvh', background: colorBgLayout }}>
          <AppNav loggedFunctionNo={loggedFunctionNo} />
          <Layout
            style={{
              // Am Handy trägt die Bottom-Navigation, am PC weicht der Inhalt
              // der Seitenleiste aus. Der Offset hängt jetzt an einer
              // Konstante aus AppNav statt an einem lokalen State.
              marginInlineStart: isMobile ? 0 : SIDER_WIDTH,
              background: colorBgLayout,
            }}
          >
            <Header
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                padding: `var(--safe-top) 16px 0`,
                height: 'auto',
                background: colorBgContainer,
                borderBottom: `1px solid ${colorBorderSecondary}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Am Handy steht hier der Seitentitel: ohne Seitenleiste ist er
                  der einzige Hinweis darauf, wo man sich befindet. */}
              <div style={{ fontWeight: 600, fontSize: 18, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isMobile ? titleFor(location.pathname, loggedFunctionNo) : 'Atemschutzpflegestelle'}
              </div>
              <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} trigger={['click']} placement="bottomRight">
                <Avatar style={{ cursor: 'pointer', flexShrink: 0 }}>{loggedInitials}</Avatar>
              </Dropdown>
            </Header>
            <Content
              style={{
                // Am Handy randlos: 'width: 100%' zusammen mit seitlichen
                // Margins ergab 100% + 24px und damit eine horizontal
                // verschiebbare Seite. Ohne Rand gibt es das Problem nicht und
                // es sind 24px mehr Platz für den Inhalt.
                margin: isMobile ? 0 : '24px auto',
                padding: isMobile ? 16 : 24,
                background: colorBgContainer,
                borderRadius: isMobile ? 0 : borderRadiusLG,
                // Platz für die Bottom-Navigation, damit das letzte Element
                // nicht dahinter liegt.
                marginBottom: isMobile
                  ? `calc(${BOTTOM_NAV_HEIGHT}px + var(--safe-bottom))`
                  : 24,
                maxWidth: isMobile ? undefined : 1200,
                width: isMobile ? 'auto' : '100%',
                boxSizing: 'border-box',
              }}
            >
              <Suspense fallback={<Skeleton active paragraph={{ rows: 6 }} />}>
                <Routes>
                  <Route path="/home" element={<Home {...routeProps} />} />
                  <Route path="/planner/:editId?" element={<Planner {...routeProps} />} />
                  <Route path="/evaluation" element={<Evaluation {...routeProps} />} />
                  <Route path="/userManagement" element={<UserManagement {...routeProps} />} />
                  <Route path="/search" element={<Search {...routeProps} />} />
                  <Route path="/account" element={<Account {...routeProps} />} />
                  <Route path="/*" element={<Home {...routeProps} />} />
                </Routes>
              </Suspense>
            </Content>
          </Layout>
        </Layout>
      ) : verbindungsfehler ? (
        <Result
          status="warning"
          title="Keine Verbindung zum Server"
          subTitle="Die Anmeldung konnte nicht geprüft werden."
          extra={
            <Button type="primary" size="large" onClick={pruefeToken}>
              Erneut versuchen
            </Button>
          }
        />
      ) : (
        <div style={{ padding: 24 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      )}
      <ChangePasswordModal
        visible={isChangePasswordModalVisible}
        setIsVisible={setIsChangePasswordModalVisible}
        loggedPersNo={loggedPersNo}
        token={props.token}
        onClose={() => setIsChangePasswordModalVisible(false)}
      />
    </>
  );
}

export default App;
