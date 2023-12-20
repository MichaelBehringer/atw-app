import {Button, Col, Input, Popconfirm, Row, Table} from "antd";
import {useEffect, useState} from "react";
import {doDeleteRequestAuth, doGetRequestAuth, doPostRequestAuth} from "../helper/RequestHelper";
import {myToastError, myToastSuccess} from "../helper/ToastHelper";
import {DeleteOutlined, SaveOutlined} from "@ant-design/icons";
import Select from 'react-select';
import {isExternal} from "../helper/helpFunctions";
import AddUserModal from "./AddUserModal";

function UserManagement(props) {
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [isModalAGWOpen, setIsModalAGWOpen] = useState(false);

  function showAGWModal() {
    setIsModalAGWOpen(true);
  };

  function handleModalAGWCancel() {
    setIsModalAGWOpen(false);
  };

  function loadUser() {
    doGetRequestAuth("persExtra", props.token).then(
      res => {
        setUsers(
          res.data.map(row => ({
            key: row.persNo,
            firstname: row.firstname,
            lastname: row.lastname,
            username: row.username,
            functionNo: row.functionNo,
            functionName: row.functionName,
            cityNo: row.cityNo,
            cityName: row.cityName
          }))
        );
      }
    );
  }

  function loadCities() {
    doGetRequestAuth("cities", props.token).then(
      res => {
        setCities(
          res.data.map(row => ({
            key: row.cityNo,
            cityName: row.name
          }))
        );
      }
    );
  }

  function loadFunction() {
    doGetRequestAuth("function", props.token).then(
      res => {
        setFunctions(
          res.data.map(row => ({
            key: row.functionNo,
            functionName: row.functionName
          }))
        );
      }
    );
  }

  function handleUpdateUser(e) {
    doPostRequestAuth("updateUser", e, props.token).then((ret) => {
      if (ret.status === 200) {
        myToastSuccess('Speichern erfolgreich');
      } else {
        myToastError('Fehler beim speichern aufgetreten');
      }
    });
  }

  function handleDeleteUser(e) {
    const params = {userNo: e.key};
    doDeleteRequestAuth("deleteUser", params, props.token).then((res) => {
      if (res.status === 200) {
        myToastSuccess('Löschen erfolgreich');
      } else {
        myToastError('Fehler beim Löschen aufgetreten');
      }
      loadUser();
    });
  }

  const optionsFunctions = functions.map(fun => ({
    value: fun.key, label: fun.functionName
  }));
  const optionsCities = cities.map(city => ({
    value: city.key, label: city.cityName
  }));

  const columnsAGW = [
    {
      title: 'Rolle',
      dataIndex: '',
      key: 'role',
      render: (e) => <Select className="tableElem" menuPlacement={'auto'} value={{value: e.functionNo, label: e.functionName}} options={optionsFunctions} onChange={(tx) => {
        setUsers(
          users.map((item) => {
            return item.key === e.key ? {...e, functionNo: tx.value, functionName: tx.label} : item;
          })
        );
      }} />
    },
    {
      title: 'Feuerwehr',
      dataIndex: '',
      key: 'ff',
      render: (e) => <Select className="tableElem" menuPlacement={'auto'} isDisabled={!isExternal(e.functionNo)} value={{value: e.cityNo, label: e.cityName}} options={optionsCities} onChange={(tx) => {
        setUsers(
          users.map((item) => {
            return item.key === e.key ? {...e, cityNo: tx.value, cityName: tx.label} : item;
          })
        );
      }} />
    },
    {
      title: 'Vorname',
      dataIndex: '',
      key: 'firstname',
      render: (e) => <Input className="tableElem" value={e.firstname} onChange={(tx) => {
        setUsers(
          users.map((item) => {
            return item.key === e.key ? {...e, firstname: tx.target.value} : item;
          })
        );
      }} />
    },
    {
      title: 'Nachname',
      dataIndex: '',
      key: 'lastname',
      render: (e) => <Input className="tableElem" value={e.lastname} onChange={(tx) => {
        setUsers(
          users.map((item) => {
            return item.key === e.key ? {...e, lastname: tx.target.value} : item;
          })
        );
      }} />
    },
    {
      title: 'Benutzername',
      dataIndex: '',
      key: 'username',
      render: (e) => <Input disabled className="tableElem" value={e.username} onChange={(tx) => {
        setUsers(
          users.map((item) => {
            return item.key === e.key ? {...e, username: tx.target.value} : item;
          })
        );
      }} />
    },
    {
      title: '',
      dataIndex: '',
      key: 'x',
      render: (e) => <SaveOutlined onClick={() => handleUpdateUser(e)} />
    },
    {
      title: '',
      dataIndex: '',
      key: 'd',
      render: (e) => <Popconfirm
        title="Benutzer Löschen"
        description="sicher?"
        onConfirm={() => handleDeleteUser(e)}
        okText="Löschen"
        cancelText="Abbrechen"
      ><DeleteOutlined /></Popconfirm>
    },
  ];

  useEffect(() => {
    loadUser();
    loadCities();
    loadFunction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <AddUserModal token={props.token} isModalAGWOpen={isModalAGWOpen} handleModalAGWCancel={handleModalAGWCancel} optionsFunctions={optionsFunctions} optionsCities={optionsCities} loadUser={loadUser}/>
      <Row>
        <Col span={12}>
        <p>Benutzerverwaltung</p>
        </Col>
        <Col span={12}>
          <Button onClick={() => showAGWModal()} className="ffInputFull marginButton" type="primary">Neuer User</Button>
        </Col>
      </Row>
      <Table className="userManagementTable" pagination={false} scroll={{x: 400}} dataSource={users} columns={columnsAGW} />
    </div>
  );
}

export default UserManagement;
