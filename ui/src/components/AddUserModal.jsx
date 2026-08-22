import {Button, Input, Modal} from "antd";
import {useState} from "react";
import Select from 'react-select';
import {myToastError, myToastSuccess} from "../helper/ToastHelper";
import {getWemding, isExternal} from "../helper/helpFunctions";
import {doPutRequestAuth} from "../helper/RequestHelper";

function AddUserModal(props) {
	const [selectedFunction, setSelectedFunction] = useState();
	const [selectedCity, setSelectedCity] = useState();

	const [txtFirstname, setTxtFirstname] = useState();
	const [txtLastname, setTxtLastname] = useState();
	const [txtUsername, setTxtUsername] = useState();
	const [txtPassword, setTxtPassword] = useState();

	function isTextEmpty(txt) {
		return txt === undefined || txt === '';
	}

	function handleModalOk() {
		if (selectedFunction === undefined || selectedCity === undefined || isTextEmpty(txtFirstname) || isTextEmpty(txtLastname) || isTextEmpty(txtPassword) || isTextEmpty(txtUsername)) {
			myToastError('Bitte alle Felder füllen');
		} else {
			const params = {functionNo: selectedFunction.value, cityNo: selectedCity.value, firstname: txtFirstname, lastname: txtLastname, password: txtPassword, username: txtUsername};
			doPutRequestAuth("createUser", params, props.token).then((e) => {
				console.log(e.status)
				if (e.status === 200) {
					myToastSuccess('Speichern erfolgreich');
					props.handleModalAGWCancel();
					props.loadUser()
				}}, error => {
					if (error.response.status === 400) {
					myToastError('Benutzername bereits vorhanden');
				} else {
					myToastError('Fehler beim speichern aufgetreten');
				}
				});
		}
	};

	return (
		<Modal title="Benutzer Anlegen" open={props.isModalAGWOpen} onCancel={props.handleModalAGWCancel} footer={[
			<Button key="cancle" onClick={props.handleModalAGWCancel}>
				Zurück
			</Button>,
			<Button key="submit" type="primary" onClick={handleModalOk}>
				Speichern
			</Button>
		]}
		>
			<Select value={selectedFunction} placeholder={'Rolle'} menuPlacement={'auto'} options={props.optionsFunctions} onChange={(e) => {
				setSelectedFunction(e);
				if (!isExternal(e.value)) {setSelectedCity(getWemding());}
			}} />
			<Select value={selectedCity} isDisabled={!isExternal(selectedFunction?.value)} placeholder={'Feuerwehr'} menuPlacement={'auto'} options={props.optionsCities} onChange={(e) => setSelectedCity(e)} />
			<Input className="ffInputFull" value={txtFirstname} onChange={(e) => setTxtFirstname(e.target.value)} placeholder={"Vorname"} />
			<Input className="ffInputFull" value={txtLastname} onChange={(e) => setTxtLastname(e.target.value)} placeholder={"Nachname"} />
			<Input className="ffInputFull" value={txtUsername} onChange={(e) => setTxtUsername(e.target.value)} placeholder={"Benutzername"} />
			<Input className="ffInputFull" value={txtPassword} onChange={(e) => setTxtPassword(e.target.value)} placeholder={"Passwort"} />
		</Modal>
	);
}

export default AddUserModal;
