import React from 'react';
import {
  CalendarOutlined,
  CompressOutlined,
  HomeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Layout, Menu } from 'antd';
import { isATW, isAdmin } from "../helper/helpFunctions";
import { useNavigate } from 'react-router-dom';
const { Sider } = Layout;

function MySider(props) {
  const navigate = useNavigate();

  return (
    <Sider
    collapsible
    collapsed={props.collapsed}
    onCollapse={(value) => props.setCollapsed(value)}
    style={{
      overflow: 'hidden',
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      height: '100vh',
    }}
  >
    <div className="demo-logo-vertical" />
    <Menu
      theme="dark"
      mode="inline"
      defaultSelectedKeys={['1']}
      onClick={(e) => { navigate(e.key) }}
      items={[
        {
          key: 'home',
          icon: <HomeOutlined />,
          label: 'Home',
        },
        {
          key: 'planner',
          icon: <CalendarOutlined />,
          label: 'Erfassung',
        },
        isATW(props.loggedFunctionNo)||isAdmin(props.loggedFunctionNo)?{
          key: 'search',
          icon: <SearchOutlined />,
          label: 'Suche',
        }:null,
        isAdmin(props.loggedFunctionNo)?{
          key: 'evaluation',
          icon: <CompressOutlined />,
          label: 'Auswertung',
        }:null
      ]}
    />
  </Sider>
  );
}

export default MySider;
