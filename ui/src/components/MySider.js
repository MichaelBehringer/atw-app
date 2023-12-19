import {useNavigate} from "react-router-dom";
import React from 'react';
import SideNav, {NavItem, NavIcon, NavText} from '@trendmicro/react-sidenav';
import {CalendarOutlined, CompressOutlined, HomeOutlined, LogoutOutlined, SearchOutlined} from '@ant-design/icons';
import {isAdmin, isATW} from "../helper/helpFunctions";

function MySider(props) {
  const navigate = useNavigate();

  function handleLogout() {
    props.removeToken();
  }
  return (
    <div>
      <SideNav
      className='nav-style'
        onSelect={(selected) => {
          if(selected==='logout') {
            handleLogout()
          } else {
            navigate(selected)
          }
        }}
      >
        <SideNav.Toggle />
        <SideNav.Nav>
          <NavItem eventKey="">
            <NavIcon>
              <HomeOutlined style={{fontSize: '1.75em'}} />
            </NavIcon>
            <NavText>
              Home
            </NavText>
          </NavItem>
          {isATW(props.loggedFunctionNo)||isAdmin(props.loggedFunctionNo)?<NavItem eventKey="planner">
            <NavIcon>
              <CalendarOutlined style={{fontSize: '1.75em'}} />
            </NavIcon>
            <NavText>
              Zeiterfassung
            </NavText>
          </NavItem>:<></>}
          {isATW(props.loggedFunctionNo)||isAdmin(props.loggedFunctionNo)?<NavItem eventKey="search">
            <NavIcon>
              <SearchOutlined style={{fontSize: '1.75em'}} />
            </NavIcon>
            <NavText>
              Suche
            </NavText>
          </NavItem>:<></>}
          {isAdmin(props.loggedFunctionNo)?<NavItem eventKey="evaluation">
            <NavIcon>
              <CompressOutlined style={{fontSize: '1.75em'}} />
            </NavIcon>
            <NavText>
              Auswertung
            </NavText>
          </NavItem>:<></>}
          <NavItem eventKey="logout">
            <NavIcon>
              <LogoutOutlined style={{fontSize: '1.75em'}} />
            </NavIcon>
            <NavText>
              Ausloggen
            </NavText>
          </NavItem>
        </SideNav.Nav>
      </SideNav>
    </div>
  );
}

export default MySider;
