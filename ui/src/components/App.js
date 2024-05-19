import {Route, Routes} from "react-router-dom";
import Planner from "./Planner";
import React, {useEffect, useState} from 'react';

// Be sure to include styles at some point, probably during your bootstraping
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import MySider from "./MySider";
import Home from "./Home";
import Evaluation from "./Evaluation";
import Search from "./Search";
import Account from "./Account";
import {doGetRequestAuth} from "../helper/RequestHelper";
import UserManagement from "./UserManagement";
import { myToastInfo } from "../helper/ToastHelper";

function App(props) {
	const [loggedPersNo, setLoggedPersNo] = useState();
	const [loggedFunctionNo, setLoggedFunctionNo] = useState();
	const [loggedInitials, setLoggedInitials] = useState();
  useEffect(() => {
    doGetRequestAuth('checkToken', props.token).then((res)=>{
      myToastInfo('Hallo ' + res.data.username)
      setLoggedInitials(res.data.username.split(' ').map(word => word[0]).join(''))
      setLoggedPersNo(res.data.persNo)
      setLoggedFunctionNo(res.data.functionNo)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
    {(loggedPersNo && loggedFunctionNo) ?
    <div>
      <MySider loggedFunctionNo={loggedFunctionNo} loggedInitials={loggedInitials} removeToken={props.removeToken}/>
      <div className="mainContent">
        <Routes>
          <Route path="/" element={<Home token={props.token} loggedFunctionNo={loggedFunctionNo} loggedPersNo={loggedPersNo}/>} />
          <Route path="/planner" element={<Planner token={props.token} loggedPersNo={loggedPersNo}/>} />
          <Route path="/evaluation" element={<Evaluation token={props.token} loggedFunctionNo={loggedFunctionNo}/>} />
          <Route path="/userManagement" element={<UserManagement token={props.token} loggedFunctionNo={loggedFunctionNo}/>} />
          <Route path="/search" element={<Search token={props.token} loggedFunctionNo={loggedFunctionNo} loggedPersNo={loggedPersNo}/>} />
          <Route path="/account" element={<Account token={props.token} loggedFunctionNo={loggedFunctionNo} loggedPersNo={loggedPersNo}/>} />
        </Routes>
      </div>
    </div> : <div>Daten werden geladen</div>}
    </div>
  );
}

export default App;
