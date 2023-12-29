import React, {useState} from "react";
import {Col, Row, Input, Button, Divider, Modal, Table, Popconfirm, Space} from 'antd';
import {DeleteOutlined, SaveOutlined} from "@ant-design/icons";
import {myToastError, myToastSuccess} from "../helper/ToastHelper";
import {doDeleteRequestAuth, doGetRequestAuth, doGetRequestBlob, doPostRequestAuth, doPutRequestAuth} from "../helper/RequestHelper";
import {useNavigate} from "react-router-dom";

function Evaluation(props) {
  const [isModalFFOpen, setIsModalFFOpen] = useState(false);
  const [cities, setCities] = useState([]);
  const [txtNewCity, setTxtNewCity] = useState();
  const navigate = useNavigate();

  function showFFModal() {
    setIsModalFFOpen(true);
    loadCities();
  };

  function createNewCity() {
    const params = { name: txtNewCity };
      doPutRequestAuth("createCity", params, props.token).then((e) => {
          myToastSuccess('Speichern erfolgreich');
          loadCities();
          setTxtNewCity()
      }, error => {
        myToastError('Fehler beim speichern aufgetreten/Feuerwehr schon vorhanden');
      }
        );
  }

  function handleUpdateFF(e) {
    doPostRequestAuth("updateCity", e, props.token).then((ret) => {
      if (ret.status === 200) {
        myToastSuccess('Speichern erfolgreich');
      } else {
        myToastError('Fehler beim speichern aufgetreten');
      }
    });
  }

  function handleDeleteFF(e) {
    const params = {cityNo: e.key};
    doDeleteRequestAuth("deleteCity", params, props.token).then((res) => {
      if (res.status === 200) {
        myToastSuccess('Löschen erfolgreich');
      } else {
        myToastError('Fehler beim Löschen aufgetreten');
      }
      loadCities();
    });
  }

  function handleModalFFCancel() {
    setIsModalFFOpen(false);
  };

  function handleFFAuswertung() {
        doGetRequestBlob('file').then((response) => {
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', response.headers['content-language']); //any other extension
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl)
  });
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

  const columnsFF = [
    {
      title: 'Feuerwehr',
      dataIndex: '',
      key: 'cityName',
      render: (e) => <Input value={e.cityName} onChange={(tx) => {
        setCities(
          cities.map((item) => {
            return item.key === e.key ? {key: e.key, cityName: tx.target.value} : item;
          })
        );
      }} />
    },
    {
      title: '',
      dataIndex: '',
      key: 'x',
      render: (e) => <SaveOutlined onClick={() => handleUpdateFF(e)} />
    },
    {
      title: '',
      dataIndex: '',
      key: 'd',
      render: (e) => <Popconfirm
        title="Feuerwehr Löschen"
        description="sicher?"
        onConfirm={() => handleDeleteFF(e)}
        okText="Löschen"
        cancelText="Abbrechen"
      ><DeleteOutlined /></Popconfirm>
    },
  ];

  return (
    <div>
      <Modal title="Feuerwehren Verwalten" open={isModalFFOpen} onCancel={handleModalFFCancel} footer={[
        <Button key="cancle" onClick={handleModalFFCancel}>
          Zurück
        </Button>
      ]}
      >
      <Space.Compact style={{ width: '100%' }}>
        <Input placeholder="Neue Feuerwehr" value={txtNewCity} onChange={(e)=>setTxtNewCity(e.target.value)}/>
        <Button onClick={() => createNewCity()} type="primary">Anlegen</Button>
      </Space.Compact>
        <Table scroll={{x: 400}} dataSource={cities} columns={columnsFF} />
      </Modal>
      <Divider orientation="left">Verwalten</Divider>
      <Row>
        <Col span={24}>
          <Button onClick={() => navigate('/userManagement')} className="ffInputFull marginButton" type="primary">AGW Verwalten</Button>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Button onClick={() => showFFModal()} className="ffInputFull marginButton" type="primary">Feuerwehren Verwalten</Button>
        </Col>
      </Row>
      <Divider orientation="left">Auswertungen</Divider>
      <Row>
        <Col span={24}>
          <Button onClick={() => console.log('aaa')} className="ffInputFull marginButton" type="primary">Jahresauswertung AGW</Button>
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Button onClick={() => handleFFAuswertung()} className="ffInputFull marginButton" type="primary">Jahresauswertung Feuerwehren</Button>
        </Col>
      </Row>
    </div>
  );
}

export default Evaluation;
