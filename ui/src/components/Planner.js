import React, {useState, useEffect} from "react";
import {Col, Row, Divider, Button, Tooltip, DatePicker, Modal} from 'antd';

import Select from 'react-select';
import {Input, InputNumber} from "antd";
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import locale from 'antd/es/date-picker/locale/de_DE';
import {myToastError, myToastSuccess} from "../helper/ToastHelper";
import {doGetRequestAuth, doPutRequestAuth} from "../helper/RequestHelper";
import {getUserToID} from "../helper/helpFunctions";

const {TextArea} = Input;

function Planner(props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txtModalNotice, setTxtModalNotice] = useState("Monatliche Kurzprüfung");
  const dateFormat = 'DD.MM.YYYY';
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedUser, setSelectedUser] = useState();
  const [selectedCity, setSelectedCity] = useState();

  const [txtFlaschenFuellen, setTxtFlaschenFuellen] = useState();
  const [txtFlaschenFuellenNr, setTxtFlaschenFuellenNr] = useState();
  const [txtFlaschenTUEV, setTxtFlaschenTUEV] = useState();
  const [txtFlaschenTUEVNr, setTxtFlaschenTUEVNr] = useState();

  const [txtMaskenPruefen, setTxtMaskenPruefen] = useState();
  const [txtMaskenPruefenNr, setTxtMaskenPruefenNr] = useState();
  const [txtMaskenReinigen, setTxtMaskenReinigen] = useState();
  const [txtMaskenReinigenNr, setTxtMaskenReinigenNr] = useState();

  const [txtLAPruefen, setTxtLAPruefen] = useState();
  const [txtLAPruefenNr, setTxtLAPruefenNr] = useState();
  const [txtLAReinigen, setTxtLAReinigen] = useState();
  const [txtLAReinigenNr, setTxtLAReinigenNr] = useState();

  const [txtGereatePruefen, setTxtGereatePruefen] = useState();
  const [txtGereatePruefenNr, setTxtGereatePruefenNr] = useState();
  const [txtGereateReinigen, setTxtGereateReinigen] = useState();
  const [txtGereateReinigenNr, setTxtGereateReinigenNr] = useState();

  const [txtArbeitszeit, setTxtArbeitszeit] = useState();
  const [txtDate, setTxtDate] = useState(dayjs());

  function showModal() {
    setIsModalOpen(true);
  };
  function handleModalOk() {
    if (txtModalNotice === '' || selectedUser === undefined || txtArbeitszeit === undefined || txtDate === null) {
      myToastError('Bitte alle Felder füllen');
    } else {
      const params = {user: selectedUser.value, arbeitszeit: txtArbeitszeit, dateWork: txtDate, bemerkung: txtModalNotice};
      doPutRequestAuth("createExtraEntry", params, props.token).then((e) => {
        if (e.status === 200) {
          myToastSuccess('Speichern erfolgreich');
          setIsModalOpen(false);
        } else {
          myToastError('Fehler beim speichern aufgetreten');
        }
        setTxtModalNotice("Monatliche Kurzprüfung");

        setTxtArbeitszeit();
        setTxtDate(dayjs());
      });
    }
  };

  function handleModalCancel() {
    setIsModalOpen(false);
  };

  function handleSave() {
    if (txtDate === null || txtArbeitszeit === undefined || txtArbeitszeit === null || selectedUser === undefined || selectedCity === undefined || selectedUser === null || selectedCity === null) {
      myToastError('AGW, Feuerwehr, Datum und Arbeitszeit sind Pflichtfelder');
    } else {
      const params = {user: selectedUser.value, city: selectedCity.value, flaschenFuellen: txtFlaschenFuellen, flaschenFuellenNr: txtFlaschenFuellenNr, flaschenTUEV: txtFlaschenTUEV, flaschenTUEVNr: txtFlaschenTUEVNr, maskenPruefen: txtMaskenPruefen, maskenPruefenNr: txtMaskenPruefenNr, maskenReinigen: txtMaskenReinigen, maskenReinigenNr: txtMaskenReinigenNr, laPruefen: txtLAPruefen, laPruefenNr: txtLAPruefenNr, laReinigen: txtLAReinigen, laReinigenNr: txtLAReinigenNr, geraetePruefen: txtGereatePruefen, geraetePruefenNr: txtGereatePruefenNr, geraeteReinigen: txtGereateReinigen, geraeteReinigenNr: txtGereateReinigenNr, arbeitszeit: txtArbeitszeit, dateWork: txtDate};
      doPutRequestAuth("createEntry", params, props.token).then((e) => {
        if (e.status === 200) {
          myToastSuccess('Speichern erfolgreich');
        } else {
          myToastError('Fehler beim speichern aufgetreten');
        }
        setSelectedCity(null);

        setTxtFlaschenFuellen();
        setTxtFlaschenFuellenNr();
        setTxtFlaschenTUEV();
        setTxtFlaschenTUEVNr();

        setTxtMaskenPruefen();
        setTxtMaskenPruefenNr();
        setTxtMaskenReinigen();
        setTxtMaskenReinigenNr();

        setTxtLAPruefen();
        setTxtLAPruefenNr();
        setTxtLAReinigen();
        setTxtLAReinigenNr();

        setTxtGereatePruefen();
        setTxtGereatePruefenNr();
        setTxtGereateReinigen();
        setTxtGereateReinigenNr();

        setTxtArbeitszeit();
        setTxtDate(dayjs());
      });

    }

  }

  useEffect(() => {
    doGetRequestAuth("pers", props.token).then(
      res => {
        setUsers(
          res.data.map(row => ({
            persNo: row.persNo,
            firstname: row.firstname,
            lastname: row.lastname
          }))
        );
      }
    );
    doGetRequestAuth("cities", props.token).then(
      res => {
        setCities(
          res.data.map(row => ({
            cityNo: row.cityNo,
            name: row.name
          }))
        );
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (users.length !== 0) {
      let loggedUser = getUserToID(props.loggedPersNo, users);
      setSelectedUser({value: loggedUser?.persNo, label: loggedUser?.firstname + " " + loggedUser?.lastname});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users]);

  const optionsUsers = users.map(user => ({
    value: user.persNo, label: user.firstname + " " + user.lastname
  }));
  const optionsCities = cities.map(city => ({
    value: city.cityNo, label: city.name
  }));

  return (
    (users.length !== 0 && cities.length !== 0) ?
        <div>
          <Modal title="Sonstige Aufgabe" open={isModalOpen} onOk={handleModalOk} onCancel={handleModalCancel} footer={[
            <Button key="cancle" onClick={handleModalCancel}>
              Abbrechen
            </Button>,
            <Button key="submit" type="primary" onClick={handleModalOk}>
              Speichern
            </Button>
          ]}

          >

            <Select value={selectedUser} className="ffInputFull" placeholder={"Atemschutzgerätewart"} options={optionsUsers} onChange={(e) => setSelectedUser(e)} />
            <TextArea rows={4} value={txtModalNotice} onChange={(e) => setTxtModalNotice(e.target.value)} className="ffInputFull" placeholder={"Bemerkung"} />
            <InputNumber value={txtArbeitszeit} onChange={(e) => setTxtArbeitszeit(e)} min={0} max={10} decimalSeparator={","} className="ffInputFull" placeholder={"Arbeitszeit (h)"} />
            <DatePicker locale={locale} format={dateFormat} value={txtDate} onChange={(e) => setTxtDate(e)} className="ffInputFull" />
          </Modal>
          <Row>
            <Col span={24}>
              <Select value={selectedUser} className="ffInputFull" placeholder={"Atemschutzgerätewart"} options={optionsUsers} onChange={(e) => setSelectedUser(e)} />
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Select value={selectedCity} className="ffInputFull" placeholder={"Feuerwehr"} options={optionsCities} onChange={(e) => setSelectedCity(e)} />
            </Col>
          </Row>

          <Divider orientation="left">Flaschen</Divider>
          <Row>
            <Col span={12}>
              <Tooltip placement="right" title="Flaschen füllen"><InputNumber value={txtFlaschenFuellen} onChange={(e) => setTxtFlaschenFuellen(e)} precision={0} min={0} max={10} className="ffInputFull" placeholder={"Flaschen füllen"} /></Tooltip>
            </Col>
            <Col span={12}>
              <Input value={txtFlaschenFuellenNr} onChange={(e) => setTxtFlaschenFuellenNr(e.target.value)} className="ffInputFull" placeholder={"Nr."} />
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Tooltip placement="right" title="Flaschen TÜV"><InputNumber value={txtFlaschenTUEV} onChange={(e) => setTxtFlaschenTUEV(e)} precision={0} min={0} max={10} className="ffInputFull" placeholder={"Flaschen TÜV"} /></Tooltip>
            </Col>
            <Col span={12}>
              <Input value={txtFlaschenTUEVNr} onChange={(e) => setTxtFlaschenTUEVNr(e.target.value)} className="ffInputFull" placeholder={"Nr."} />
            </Col>
          </Row>

          <Divider orientation="left">Masken</Divider>
          <Row>
            <Col span={12}>
              <Tooltip placement="right" title="Masken prüfen"><InputNumber value={txtMaskenPruefen} onChange={(e) => setTxtMaskenPruefen(e)} precision={0} min={0} max={10} className="ffInputFull" placeholder={"Masken prüfen"} /></Tooltip>
            </Col>
            <Col span={12}>
              <Input value={txtMaskenPruefenNr} onChange={(e) => setTxtMaskenPruefenNr(e.target.value)} className="ffInputFull" placeholder={"Nr."} />
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Tooltip placement="right" title="Masken reinigen"><InputNumber value={txtMaskenReinigen} onChange={(e) => setTxtMaskenReinigen(e)} precision={0} min={0} max={10} className="ffInputFull" placeholder={"Masken reinigen"} /></Tooltip>
            </Col>
            <Col span={12}>
              <Input value={txtMaskenReinigenNr} onChange={(e) => setTxtMaskenReinigenNr(e.target.value)} className="ffInputFull" placeholder={"Nr."} />
            </Col>
          </Row>

          <Divider orientation="left">Lungenautomat</Divider>
          <Row>
            <Col span={12}>
              <Tooltip placement="right" title="LA prüfen"><InputNumber value={txtLAPruefen} onChange={(e) => setTxtLAPruefen(e)} precision={0} min={0} max={10} className="ffInputFull" placeholder={"LA prüfen"} /></Tooltip>
            </Col>
            <Col span={12}>
              <Input value={txtLAPruefenNr} onChange={(e) => setTxtLAPruefenNr(e.target.value)} className="ffInputFull" placeholder={"Nr."} />
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Tooltip placement="right" title="LA reinigen"><InputNumber value={txtLAReinigen} onChange={(e) => setTxtLAReinigen(e)} precision={0} min={0} max={10} className="ffInputFull" placeholder={"LA reinigen"} /></Tooltip>
            </Col>
            <Col span={12}>
              <Input value={txtLAReinigenNr} onChange={(e) => setTxtLAReinigenNr(e.target.value)} className="ffInputFull" placeholder={"Nr."} />
            </Col>
          </Row>

          <Divider orientation="left">Gerät</Divider>
          <Row>
            <Col span={12}>
              <Tooltip placement="right" title="Geräte prüfen"><InputNumber value={txtGereatePruefen} onChange={(e) => setTxtGereatePruefen(e)} precision={0} min={0} max={10} className="ffInputFull" placeholder={"Geräte prüfen"} /></Tooltip>
            </Col>
            <Col span={12}>
              <Input value={txtGereatePruefenNr} onChange={(e) => setTxtGereatePruefenNr(e.target.value)} className="ffInputFull" placeholder={"Nr."} />
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Tooltip placement="right" title="Geräte reinigen"><InputNumber value={txtGereateReinigen} onChange={(e) => setTxtGereateReinigen(e)} precision={0} min={0} max={10} className="ffInputFull" placeholder={"Geräte reinigen"} /></Tooltip>
            </Col>
            <Col span={12}>
              <Input value={txtGereateReinigenNr} onChange={(e) => setTxtGereateReinigenNr(e.target.value)} className="ffInputFull" placeholder={"Nr."} />
            </Col>
          </Row>

          <Divider orientation="left">Arbeitszeit</Divider>
          <Row>
            <Col span={12}>
              <InputNumber value={txtArbeitszeit} onChange={(e) => setTxtArbeitszeit(e)} min={0} max={10} decimalSeparator={","} className="ffInputFull" placeholder={"Arbeitszeit (h)"} />
            </Col>
            <Col span={12}>
              <DatePicker locale={locale} format={dateFormat} value={txtDate} onChange={(e) => setTxtDate(e)} className="ffInputFull" />
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Button onClick={() => showModal()} className="ffInputFull otherTasksButton">Sonstige Aufgaben</Button>
            </Col>
            <Col span={12}>
              <Button onClick={() => handleSave()} className="ffInputFull" type="primary">Speichern</Button>
            </Col>
          </Row>


        </div> : <div>Daten werden geladen</div>);
}

export default Planner;
