import { Form, Input, Modal, Select } from "antd";
import { useState } from "react";
import { myToastError, myToastSuccess } from "../helper/ToastHelper";
import { getWemding, isExternal } from "../helper/helpFunctions";
import { doPutRequestAuth } from "../helper/RequestHelper";
import useCloseOnBack from "../hooks/useCloseOnBack";

function AddUserModal(props) {
	const [selectedFunction, setSelectedFunction] = useState();
	const [selectedCity, setSelectedCity] = useState();
	const [txtFirstname, setTxtFirstname] = useState('');
	const [txtLastname, setTxtLastname] = useState('');
	const [txtUsername, setTxtUsername] = useState('');
	const [txtPassword, setTxtPassword] = useState('');
	const [saving, setSaving] = useState(false);

	useCloseOnBack(props.isModalAGWOpen, () => handleClose());

	function reset() {
		setSelectedFunction(undefined);
		setSelectedCity(undefined);
		setTxtFirstname('');
		setTxtLastname('');
		setTxtUsername('');
		setTxtPassword('');
	}

	function handleClose() {
		reset();
		props.handleModalAGWCancel();
	}

	function handleModalOk() {
		if (
			selectedFunction === undefined ||
			selectedCity === undefined ||
			!txtFirstname ||
			!txtLastname ||
			!txtUsername ||
			!txtPassword
		) {
			myToastError('Bitte alle Felder füllen');
			return;
		}

		const params = {
			functionNo: selectedFunction,
			cityNo: selectedCity,
			firstname: txtFirstname,
			lastname: txtLastname,
			password: txtPassword,
			username: txtUsername,
		};

		setSaving(true);
		doPutRequestAuth("createUser", params, props.token)
			.then(() => {
				myToastSuccess('Benutzer angelegt');
				reset();
				props.handleModalAGWCancel();
				props.loadUser();
			})
			.catch((error) => {
				// Ohne optionale Verkettung warf das bei Netzwerkfehlern eine
				// TypeError und der Dialog blieb stehen.
				if (error.response?.status === 400) {
					myToastError('Benutzername bereits vorhanden');
				} else if (error.response) {
					myToastError('Fehler beim Speichern');
				} else {
					myToastError('Keine Verbindung zum Server.');
				}
			})
			.finally(() => setSaving(false));
	}

	return (
		<Modal
			title="Benutzer anlegen"
			open={props.isModalAGWOpen}
			onCancel={handleClose}
			onOk={handleModalOk}
			okText="Anlegen"
			cancelText="Abbrechen"
			confirmLoading={saving}
		>
			<Form layout="vertical">
				<Form.Item label="Rolle" required>
					<Select
						aria-label="Rolle"
						value={selectedFunction}
						placeholder="Rolle"
						options={props.optionsFunctions}
						onChange={(value) => {
							setSelectedFunction(value);
							// Alle außer Externen gehören zur eigenen Feuerwehr.
							if (!isExternal(value)) setSelectedCity(getWemding().value);
						}}
					/>
				</Form.Item>
				<Form.Item
					label="Feuerwehr"
					required
					extra={
						selectedFunction !== undefined && !isExternal(selectedFunction)
							? 'Nur für die Rolle "Extern" wählbar'
							: undefined
					}
				>
					<Select
						showSearch
						aria-label="Feuerwehr"
						optionFilterProp="label"
						value={selectedCity}
						disabled={!isExternal(selectedFunction)}
						placeholder="Feuerwehr"
						options={props.optionsCities}
						onChange={setSelectedCity}
					/>
				</Form.Item>
				<Form.Item label="Vorname" required>
					<Input value={txtFirstname} onChange={(e) => setTxtFirstname(e.target.value)} />
				</Form.Item>
				<Form.Item label="Nachname" required>
					<Input value={txtLastname} onChange={(e) => setTxtLastname(e.target.value)} />
				</Form.Item>
				<Form.Item label="Benutzername" required>
					<Input
						value={txtUsername}
						autoCapitalize="none"
						autoCorrect="off"
						onChange={(e) => setTxtUsername(e.target.value)}
					/>
				</Form.Item>
				<Form.Item label="Passwort" required>
					{/* Vorher ein normales Input - das Passwort stand im Klartext auf
					    dem Schirm. */}
					<Input.Password value={txtPassword} onChange={(e) => setTxtPassword(e.target.value)} />
				</Form.Item>
			</Form>
		</Modal>
	);
}

export default AddUserModal;
