import React, { useState } from "react";
import { Button, Input } from "antd";
import { doPostRequest } from "../helper/RequestHelper";
import { myToastError } from "../helper/ToastHelper";
import { useNavigate } from "react-router-dom";

function Authentication(props) {
	const [txtUsername, setTxtUsername] = useState();
	const [txtPassword, setTxtPassword] = useState();
	const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();

	function handleLogin() {
		setIsLoading(true)
		const params = { username: txtUsername, password: txtPassword };
		doPostRequest("login", params).then((response) => {
			setIsLoading(false)
			props.setToken(response.data.accessToken);
			navigate("/")
		}, error => {
			setIsLoading(false)
			if (error.response.status === 401) {
				myToastError("Benutzername oder Passwort falsch!");
			}
			return error;
		});
		setTxtPassword()
		setTxtUsername()
	}


	return (
		<div>
			<div className="imgcontainer">
				<img src="logo192.png" alt="Logo" className="logo" />
			</div>
			<div className="loginContainer">
			<Input value={txtUsername} onChange={(e) => setTxtUsername(e.target.value)} className="ffInputFull loginElement" placeholder={"Benutzername"} />
			<Input.Password value={txtPassword} onChange={(e) => setTxtPassword(e.target.value)} className="ffInputFull loginElement" placeholder={"Passwort"} />
			<Button loading={isLoading} onClick={() => handleLogin()} className="ffInputFull loginElement" type="primary">Login</Button>
		
			</div>
			</div>
	);
}

export default Authentication;