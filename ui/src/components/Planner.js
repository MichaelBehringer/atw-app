import React, { useState, useEffect } from "react";
import { Col, Row, Divider, Button, Tooltip, DatePicker, Modal, Select as SelectAntd } from 'antd';

import Select from 'react-select';
import { Input, InputNumber } from "antd";
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import locale from 'antd/es/date-picker/locale/de_DE';
import { myToastError, myToastSuccess } from "../helper/ToastHelper";
import { doGetRequestAuth, doPutRequestAuth } from "../helper/RequestHelper";
import { getCityToID, getUserToID, isAdmin, isExternal } from "../helper/helpFunctions";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const { TextArea } = Input;
const options = [];
for (let i = 1; i < 100; i++) {
  options.push({
    label: i,
    value: i,
  });
}

function Planner(props) {
  const { editId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txtModalNotice, setTxtModalNotice] = useState("Monatliche Kurzprüfung");
  const dateFormat = 'DD.MM.YYYY';
  const [users, setUsers] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedUser, setSelectedUser] = useState();
  const [selectedCity, setSelectedCity] = useState();

  const [txtFlaschenFuellen, setTxtFlaschenFuellen] = useState();
  const [txtFlaschenFuellenNr, setTxtFlaschenFuellenNr] = useState([]);
  const [txtFlaschenTUEV, setTxtFlaschenTUEV] = useState();
  const [txtFlaschenTUEVNr, setTxtFlaschenTUEVNr] = useState([]);

  const [txtMaskenPruefen, setTxtMaskenPruefen] = useState();
  const [txtMaskenPruefenNr, setTxtMaskenPruefenNr] = useState([]);
  const [txtMaskenReinigen, setTxtMaskenReinigen] = useState();
  const [txtMaskenReinigenNr, setTxtMaskenReinigenNr] = useState([]);

  const [txtLAPruefen, setTxtLAPruefen] = useState();
  const [txtLAPruefenNr, setTxtLAPruefenNr] = useState([]);
  const [txtLAReinigen, setTxtLAReinigen] = useState();
  const [txtLAReinigenNr, setTxtLAReinigenNr] = useState([]);

  const [txtGereatePruefen, setTxtGereatePruefen] = useState();
  const [txtGereatePruefenNr, setTxtGereatePruefenNr] = useState([]);
  const [txtGereateReinigen, setTxtGereateReinigen] = useState();
  const [txtGereateReinigenNr, setTxtGereateReinigenNr] = useState([]);
  <Tooltip placement="right" title="Flaschen füllen"><InputNumber value={txtFlaschenFuellen} onChange={(e) => setTxtFlaschenFuellen(e)} precision={0} min={0} max={10} className="ffInputFull" placeholder={"Flaschen füllen"} /></Tooltip>
  const inputFields = [
    {
      divider: 'Flaschen', content: [
        { value: { title: 'Flaschen füllen', state: txtFlaschenFuellen, setState: setTxtFlaschenFuellen }, nr: { state: txtFlaschenFuellenNr, setState: setTxtFlaschenFuellenNr } },
        { value: { title: 'Flaschen TÜV', state: txtFlaschenTUEV, setState: setTxtFlaschenTUEV }, nr: { state: txtFlaschenTUEVNr, setState: setTxtFlaschenTUEVNr } },
      ]
    },
    {
      divider: 'Masken', content: [
        { value: { title: 'Masken prüfen', state: txtMaskenPruefen, setState: setTxtMaskenPruefen }, nr: { state: txtMaskenPruefenNr, setState: setTxtMaskenPruefenNr } },
        { value: { title: 'Masken reinigen', state: txtMaskenReinigen, setState: setTxtMaskenReinigen }, nr: { state: txtMaskenReinigenNr, setState: setTxtMaskenReinigenNr } },
      ]
    },
    {
      divider: 'Lungenautomat', content: [
        { value: { title: 'LA prüfen', state: txtLAPruefen, setState: setTxtLAPruefen }, nr: { state: txtLAPruefenNr, setState: setTxtLAPruefenNr } },
        { value: { title: 'LA reinigen', state: txtLAReinigen, setState: setTxtLAReinigen }, nr: { state: txtLAReinigenNr, setState: setTxtLAReinigenNr } },
      ]
    },
    {
      divider: 'Gerät', content: [
        { value: { title: 'Geräte prüfen', state: txtGereatePruefen, setState: setTxtGereatePruefen }, nr: { state: txtGereatePruefenNr, setState: setTxtGereatePruefenNr } },
        { value: { title: 'Geräte reinigen', state: txtGereateReinigen, setState: setTxtGereateReinigen }, nr: { state: txtGereateReinigenNr, setState: setTxtGereateReinigenNr } },
      ]
    },
  ]

  const [txtArbeitszeit, setTxtArbeitszeit] = useState();
  const [txtDate, setTxtDate] = useState(dayjs());

  function showModal() {
    setIsModalOpen(true);
  };
  function handleModalOk() {
    if (txtModalNotice === '' || selectedUser === undefined || txtArbeitszeit === undefined || txtDate === null) {
      myToastError('Bitte alle Felder füllen');
    } else {
      const params = { user: selectedUser.value, arbeitszeit: txtArbeitszeit, dateWork: txtDate.format('YYYY-MM-DD'), bemerkung: txtModalNotice };
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
      let clean = true
      for (const field of inputFields) {
        for (const content of field.content) {
          if (content.value.state && content.value.state !== content.nr.state.length) {
            clean = false
          }
        }
      }

      if (!clean) {
        myToastError('Anzahl der eingegebenen Nummern passt nicht');
      } else {
        const params = { user: selectedUser.value, city: selectedCity.value, flaschenFuellen: txtFlaschenFuellen, flaschenFuellenNr: txtFlaschenFuellenNr.join(','), flaschenTUEV: txtFlaschenTUEV, flaschenTUEVNr: txtFlaschenTUEVNr.join(','), maskenPruefen: txtMaskenPruefen, maskenPruefenNr: txtMaskenPruefenNr.join(','), maskenReinigen: txtMaskenReinigen, maskenReinigenNr: txtMaskenReinigenNr.join(','), laPruefen: txtLAPruefen, laPruefenNr: txtLAPruefenNr.join(','), laReinigen: txtLAReinigen, laReinigenNr: txtLAReinigenNr.join(','), geraetePruefen: txtGereatePruefen, geraetePruefenNr: txtGereatePruefenNr.join(','), geraeteReinigen: txtGereateReinigen, geraeteReinigenNr: txtGereateReinigenNr.join(','), arbeitszeit: txtArbeitszeit, dateWork: txtDate.format('YYYY-MM-DD'), editId: editId };
        if(editId) {
          doPutRequestAuth("saveEntry", params, props.token).then((e) => {
            if (e.status === 200) {
              myToastSuccess('Speichern erfolgreich');
              resetFields()
              navigate('/')
            } else {
              myToastError('Fehler beim speichern aufgetreten');
            }
          });
        } else {
          doPutRequestAuth("createEntry", params, props.token).then((e) => {
            if (e.status === 200) {
              myToastSuccess('Speichern erfolgreich');
              resetFields()
            } else {
              myToastError('Fehler beim speichern aufgetreten');
            }
          });
        }
      }
    }
  }

  function handleExternal() {
      let clean = true
      for (const field of inputFields) {
        for (const content of field.content) {
          if (content.value.state && content.value.state !== content.nr.state.length) {
            clean = false
          }
        }
      }

      if (!clean) {
        myToastError('Anzahl der eingegebenen Nummern passt nicht');
      } else {
        const params = { user: selectedUser.value, 
          city: selectedCity.value, 
          flaschenFuellen: txtFlaschenFuellen, 
          flaschenFuellenNr: txtFlaschenFuellenNr.join(','), 
          flaschenTUEV: txtFlaschenTUEV, 
          flaschenTUEVNr: txtFlaschenTUEVNr.join(','), 
          maskenPruefen: txtMaskenPruefen, 
          maskenPruefenNr: txtMaskenPruefenNr.join(','), 
          maskenReinigen: txtMaskenReinigen, maskenReinigenNr: 
          txtMaskenReinigenNr.join(','), laPruefen: txtLAPruefen, 
          laPruefenNr: txtLAPruefenNr.join(','), 
          laReinigen: txtLAReinigen, laReinigenNr: 
          txtLAReinigenNr.join(','), geraetePruefen: 
          txtGereatePruefen, geraetePruefenNr: 
          txtGereatePruefenNr.join(','), 
          geraeteReinigen: txtGereateReinigen, 
          geraeteReinigenNr: txtGereateReinigenNr.join(','), 
          arbeitszeit: 0, 
          dateWork: txtDate.format('YYYY-MM-DD') };
        doPutRequestAuth("createEntryProposal", params, props.token).then((e) => {
          if (e.status === 200) {
            myToastSuccess('Speichern erfolgreich');
            resetFields(false)
          } else {
            myToastError('Fehler beim speichern aufgetreten');
          }
        });
      }
    
  }

  function resetFields(resetCity = true) {
    if(resetCity) {
      setSelectedCity(null);
    }

    setTxtFlaschenFuellen();
    setTxtFlaschenFuellenNr([]);
    setTxtFlaschenTUEV();
    setTxtFlaschenTUEVNr([]);

    setTxtMaskenPruefen();
    setTxtMaskenPruefenNr([]);
    setTxtMaskenReinigen();
    setTxtMaskenReinigenNr([]);

    setTxtLAPruefen();
    setTxtLAPruefenNr([]);
    setTxtLAReinigen();
    setTxtLAReinigenNr([]);

    setTxtGereatePruefen();
    setTxtGereatePruefenNr([]);
    setTxtGereateReinigen();
    setTxtGereateReinigenNr([]);

    setTxtArbeitszeit();
    setTxtDate(dayjs());
  }

  useEffect(() => {
    doGetRequestAuth("pers", props.token).then(
      res => {
        setUsers(
          res.data.map(row => ({
            persNo: row.persNo,
            firstname: row.firstname,
            lastname: row.lastname,
            cityNo: row.cityNo
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
    if (users.length !== 0 && cities.length !== 0) {
      let loggedUser = getUserToID(props.loggedPersNo, users);
      setSelectedUser({ value: loggedUser?.persNo, label: loggedUser?.firstname + " " + loggedUser?.lastname });
      if (isExternal(props.loggedFunctionNo)) {
        let loggedCity = getCityToID(loggedUser.cityNo, cities);
        setSelectedCity({ value: loggedCity?.cityNo, label: loggedCity?.name });
      }
      if(editId) {
        doGetRequestAuth('entry/'+editId, props.token).then((res) => {
          setTxtArbeitszeit(res.data.arbeitszeit);
          setTxtDate(dayjs(res.data.dateWork, 'DD.MM.YYYY'));
          setSelectedCity({ value: res.data.city, label: getCityToID(res.data.city, cities)?.name });
          setTxtFlaschenFuellen(res.data.flaschenFuellen===0?null:res.data.flaschenFuellen);
          setTxtFlaschenFuellenNr(res.data.flaschenFuellenNr!==""?res.data.flaschenFuellenNr.split(',').map(Number):[]);
          setTxtFlaschenTUEV(res.data.flaschenTUEV===0?null:res.data.flaschenTUEV);
          setTxtFlaschenTUEVNr(res.data.flaschenTUEVNr!==""?res.data.flaschenTUEVNr.split(',').map(Number):[]); 
          setTxtMaskenPruefen(res.data.maskenPruefen===0?null:res.data.maskenPruefen);
          setTxtMaskenPruefenNr(res.data.maskenPruefenNr!==""?res.data.maskenPruefenNr.split(',').map(Number):[]);
          setTxtMaskenReinigen(res.data.maskenReinigen===0?null:res.data.maskenReinigen);
          setTxtMaskenReinigenNr(res.data.maskenReinigenNr!==""?res.data.maskenReinigenNr.split(',').map(Number):[]);
          setTxtLAPruefen(res.data.laPruefen===0?null:res.data.laPruefen);
          setTxtLAPruefenNr(res.data.laPruefenNr!==""?res.data.laPruefenNr.split(',').map(Number):[]);
          setTxtLAReinigen(res.data.laReinigen===0?null:res.data.laReinigen);
          setTxtLAReinigenNr(res.data.laReinigenNr!==""?res.data.laReinigenNr.split(',').map(Number):[]);
          setTxtGereatePruefen(res.data.geraetePruefen===0?null:res.data.geraetePruefen);
          setTxtGereatePruefenNr(res.data.geraetePruefenNr!==""?res.data.geraetePruefenNr.split(',').map(Number):[]);
          setTxtGereateReinigen(res.data.geraeteReinigen===0?null:res.data.geraeteReinigen);
          setTxtGereateReinigenNr(res.data.geraeteReinigenNr!==""?res.data.geraeteReinigenNr.split(',').map(Number):[]);
        });
      } else {
        resetFields(false);
      }

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, cities, location]);

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

          <Select isDisabled={!isAdmin(props.loggedFunctionNo)} value={selectedUser} className="ffInputFull" placeholder={"Atemschutzgerätewart"} options={optionsUsers} onChange={(e) => setSelectedUser(e)} />
          <TextArea rows={4} value={txtModalNotice} onChange={(e) => setTxtModalNotice(e.target.value)} className="ffInputFull" placeholder={"Bemerkung"} />
          <InputNumber value={txtArbeitszeit} onChange={(e) => setTxtArbeitszeit(e)} min={0} max={10} decimalSeparator={","} className="ffInputFull" placeholder={"Arbeitszeit (h)"} />
          <DatePicker locale={locale} format={dateFormat} value={txtDate} onChange={(e) => setTxtDate(e)} className="ffInputFull" />
        </Modal>
        {
          editId ? <Divider orientation="left">#{editId}</Divider> : <></>
        }
        {!isExternal(props.loggedFunctionNo) ? <Row>
          <Col span={24}>
            <Select isDisabled={!isAdmin(props.loggedFunctionNo)} value={selectedUser} className="ffInputFull" placeholder={"Atemschutzgerätewart"} options={optionsUsers} onChange={(e) => setSelectedUser(e)} />
          </Col>
        </Row> : <></>}
        <Row>
          <Col span={24}>
            <Select isDisabled={isExternal(props.loggedFunctionNo)||editId} value={selectedCity} className="ffInputFull" placeholder={"Feuerwehr"} options={optionsCities} onChange={(e) => setSelectedCity(e)} />
          </Col>
        </Row>

        {inputFields.map((e) => (
          <React.Fragment key={e.divider}>
            <Divider orientation="left">{e.divider}</Divider>
            {e.content.map((c) => (
              <Row key={"r" + c.value.title}>
                <Col key={"c1" + c.value.title} span={12}>
                  <Tooltip key={"tt" + c.value.title} placement="right" title={c.value.title}><InputNumber disabled={isExternal(props.loggedFunctionNo)&&editId} key={"txt" + c.value.title} value={c.value.state} onChange={(e) => { c.value.setState(e) }} precision={0} min={0} max={10} className="ffInputFull" placeholder={c.value.title} /></Tooltip>
                </Col>
                <Col key={"c2" + c.value.title} span={12}>
                  <SelectAntd
                    key={"s" + c.value.title}
                    mode="multiple"
                    placeholder="Nr."
                    onChange={(e) => { c.nr.setState(e) }}
                    options={options}
                    value={c.nr.state}
                    style={{
                      width: '100%',
                      color: c.value.state !== c.nr.state.length ? 'red' : 'green'
                    }}
                    disabled={!c.value.state || (isExternal(props.loggedFunctionNo)&&editId)}
                  />
                </Col>
              </Row>
            ))}
          </React.Fragment>
        ))}

        {!isExternal(props.loggedFunctionNo) ? <div>
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
              {!editId?<Button onClick={() => showModal()} className="ffInputFull otherTasksButton">Sonstige Aufgaben</Button>:<></>}
            </Col>
            <Col span={12}>
              <Button onClick={() => handleSave()} className="ffInputFull" type="primary">{'Speichern'}</Button>
            </Col>
          </Row>
        </div> : <div>
          <Divider orientation="left">Abschluss</Divider>
          <Row>
            <Col span={12}>
              <DatePicker disabled={editId} locale={locale} format={dateFormat} value={txtDate} onChange={(e) => setTxtDate(e)} className="ffInputFull" />
            </Col>
            <Col span={12}>
              <Button disabled={editId} onClick={() => handleExternal()} className="ffInputFull" type="primary">{editId?'Update':'Anlegen'}</Button>
            </Col>
          </Row>

        </div>}


      </div> : <div>Daten werden geladen</div>);
}

export default Planner;
