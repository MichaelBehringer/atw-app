import React, {useState} from "react";
import {Col, Row, Input, Button, Divider, Modal} from 'antd';
import { myToastError, myToastSuccess } from "../helper/ToastHelper";
import { doPostRequestAuth } from "../helper/RequestHelper";


function Account(props) {
  const [isModalPWOpen, setIsModalPWOpen] = useState(false);

  const [txtPWOld, settxtPWOld] = useState();
  const [txtPWNew1, settxtPWNew1] = useState();
  const [txtPWNew2, settxtPWNew2] = useState();

  function showPWModal() {
    setIsModalPWOpen(true);
  };

  function handleModalPWCancel() {
    setIsModalPWOpen(false);
    settxtPWOld()
    settxtPWNew1()
    settxtPWNew2()
  };

  function handleModalPWSave() {
    if(!txtPWOld || !txtPWNew1 || !txtPWNew2) {
      myToastError("Alle Felder füllen")
      return
    }
    if(txtPWNew1 !== txtPWNew2) {
      myToastError("Neue Passwörter stimmen nicht überein")
      return
    }
    const params = {persNo: props.loggedPersNo, password: txtPWNew1, passwordOld: txtPWOld};
    doPostRequestAuth("password", params, props.token).then((res) => {
        setIsModalPWOpen(false);
        settxtPWOld()
        settxtPWNew1()
        settxtPWNew2()
        myToastSuccess("Passwort erfolgreich geändert")
    }, error => {
        myToastError("Altes Passwort stimmt nicht")
      }
    );
  };

  return (
    <div>
      <Modal title="Passwort Ändern" open={isModalPWOpen} onCancel={handleModalPWCancel} footer={[
        <Button type="primary" key="save" onClick={handleModalPWSave}>
        Ändern
      </Button>,
        <Button type="default" key="cancle" onClick={handleModalPWCancel}>
          Abbrechen
        </Button>
      ]}>
        <Input type="password" value={txtPWOld} onChange={(e)=>settxtPWOld(e.target.value)} placeholder="Passwort alt" />
        <Input type="password" value={txtPWNew1} onChange={(e)=>settxtPWNew1(e.target.value)} placeholder="Passwort neu" />
        <Input type="password" value={txtPWNew2} onChange={(e)=>settxtPWNew2(e.target.value)} placeholder="Passwort neu" />
      </Modal>
      <Divider orientation="left">Account</Divider>
      <Row>
        <Col span={24}>
          <Button onClick={() => showPWModal()} className="ffInputFull marginButton" type="primary">Passwort Ändern</Button>
        </Col>
      </Row>
      <Divider orientation="left">Benachrichtigungen</Divider>

    </div>
  );
}

export default Account;
