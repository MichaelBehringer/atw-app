import { Route, Routes } from "react-router-dom";
import Planner from "./Planner";
import React, { useEffect, useState } from 'react';
import Home from "./Home";
import Evaluation from "./Evaluation";
import Search from "./Search";
import Account from "./Account";
import { doGetRequestAuth } from "../helper/RequestHelper";
import UserManagement from "./UserManagement";
import { myToastInfo } from "../helper/ToastHelper";
import { Layout, Avatar, Dropdown, theme } from 'antd';
import MySider from "./MySider";
import ChangePasswordModal from './ChangePasswordModal';

const { Header, Content } = Layout;

function App(props) {
  const [loggedPersNo, setLoggedPersNo] = useState();
  const [loggedFunctionNo, setLoggedFunctionNo] = useState();
  const [loggedInitials, setLoggedInitials] = useState();
  const [collapsed, setCollapsed] = useState(false);
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false); // State for modal visibility

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    doGetRequestAuth('checkToken', props.token).then((res) => {
      myToastInfo('Hallo ' + res.data.username);
      setLoggedInitials(res.data.username.split(' ').map(word => word[0]).join(''));
      setLoggedPersNo(res.data.persNo);
      setLoggedFunctionNo(res.data.functionNo);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMenuClick = (e) => {
    if (e.key === 'changePassword') {
      setIsChangePasswordModalVisible(true); // Show modal
    } else if (e.key === 'logout') {
      props.removeToken();
      myToastInfo('Logout erfolgreich');
    }
  };

  const menuItems = [
    {
      key: 'changePassword',
      label: 'Passwort ändern',
      onClick: handleMenuClick,
    },
    {
      key: 'logout',
      label: 'Logout',
      danger: true,
      onClick: handleMenuClick,
    },
  ];

  return (
    <div>
      {(loggedPersNo && loggedFunctionNo) ? (
        <Layout style={{ minHeight: '100vh' }}>
          <MySider loggedFunctionNo={loggedFunctionNo} collapsed={collapsed} setCollapsed={setCollapsed} />
          <Layout style={{ marginLeft: collapsed ? 80 : 200 }}>
            <Header
              style={{
                padding: 0,
                background: colorBgContainer,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              <div style={{ fontWeight: 'bold' }}>FF Wemding</div>
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Avatar style={{ backgroundColor: '#87d068', cursor: 'pointer' }}>{loggedInitials}</Avatar>
              </Dropdown>
            </Header>
            <Content
              style={{
                margin: '24px 16px',
                padding: 24,
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}
            >
              <Routes>
                <Route path="/home" element={<Home token={props.token} loggedFunctionNo={loggedFunctionNo} loggedPersNo={loggedPersNo} />} />
                <Route path="/planner" element={<Planner token={props.token} loggedFunctionNo={loggedFunctionNo}  loggedPersNo={loggedPersNo} />} />
                <Route path="/evaluation" element={<Evaluation token={props.token} loggedFunctionNo={loggedFunctionNo} />} />
                <Route path="/userManagement" element={<UserManagement token={props.token} loggedFunctionNo={loggedFunctionNo} />} />
                <Route path="/search" element={<Search token={props.token} loggedFunctionNo={loggedFunctionNo} loggedPersNo={loggedPersNo} />} />
                <Route path="/account" element={<Account token={props.token} loggedFunctionNo={loggedFunctionNo} loggedPersNo={loggedPersNo} />} />
                <Route path="/*" element={<Home token={props.token} loggedFunctionNo={loggedFunctionNo} loggedPersNo={loggedPersNo} />} />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      ) : (
        <div>Daten werden geladen</div>
      )}
      <ChangePasswordModal
        visible={isChangePasswordModalVisible}
        setIsVisible={setIsChangePasswordModalVisible}
        loggedPersNo={loggedPersNo}
        token={props.token}
        onClose={() => setIsChangePasswordModalVisible(false)}
      />
    </div>
  );
}

export default App;
