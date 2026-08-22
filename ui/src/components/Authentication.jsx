import { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, Row, Col, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import { doPostRequest } from '../helper/RequestHelper';
import { myToastError } from '../helper/ToastHelper';

const { Title } = Typography;

function Authentication(props) {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(false);

	function handleLogin(values) {
		setLoading(true);
		const params = { username: values.username, password: values.password };
		doPostRequest("login", params).then((response) => {
			setLoading(false);
			props.setToken(response.data.accessToken, values.remember);
			navigate("/")
		}, error => {
			setLoading(false);
			// Bei einem Netzwerkfehler - also gerade im Mobilfunkfall - gibt es
			// kein error.response. Der ungeprüfte Zugriff darauf hat vorher eine
			// TypeError geworfen und den Spinner haengen lassen.
			if (error.response?.status === 401) {
				myToastError('Benutzername oder Passwort falsch!');
			} else if (error.response) {
				myToastError('Anmeldung fehlgeschlagen. Bitte später erneut versuchen.');
			} else {
				myToastError('Keine Verbindung zum Server.');
			}
		});
	}

	return (
		<div style={{
			// 100dvh statt 100vh: auf iOS Safari ist 100vh groesser als der
			// sichtbare Bereich, der Inhalt rutscht sonst hinter die Browserleiste.
			minHeight: '100dvh',
			backgroundImage: 'url(/background_login.jpg)',
			backgroundSize: 'cover',
			backgroundPosition: 'center',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			padding: `calc(16px + var(--safe-top)) 16px calc(16px + var(--safe-bottom))`,
			boxSizing: 'border-box'
		}}>
			<Row justify="center" align="middle" style={{ width: '100%' }}>
				<Col xs={24} sm={20} md={12} lg={8} style={{ maxWidth: 420, margin: '0 auto' }}>
					<Card style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}>
						<Title level={2} style={{ textAlign: 'center' }}>Login</Title>
						<Form
							name="normal_login"
							className="login-form"
							initialValues={{ remember: false }}
							onFinish={handleLogin}
						>
							<Form.Item
								name="username"
								rules={[{ required: true, message: 'Bitte Benutzernamen angeben!' }]}
							>
								<Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Benutzername" />
							</Form.Item>
							<Form.Item
								name="password"
								rules={[{ required: true, message: 'Bitte Passwort angeben!' }]}
							>
								<Input
									prefix={<LockOutlined className="site-form-item-icon" />}
									type="password"
									placeholder="Passwort"
								/>
							</Form.Item>
							<Form.Item>
								<Form.Item name="remember" valuePropName="checked" noStyle>
									<Checkbox>Angemeldet bleiben</Checkbox>
								</Form.Item>
							</Form.Item>

							<Form.Item style={{ marginBottom: 0 }}>
								{/* block: der Button war bisher ein ~80px breiter Knopf, weil
								    die Klasse login-form-button nie definiert war. */}
								<Button type="primary" htmlType="submit" size="large" block loading={loading}>
									Anmelden
								</Button>
							</Form.Item>
						</Form>
					</Card>
				</Col>
			</Row>
		</div>
	);
};

export default Authentication;
