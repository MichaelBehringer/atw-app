import React from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { doPostRequestAuth } from '../helper/RequestHelper';
import { myToastError, myToastSuccess } from '../helper/ToastHelper';

const ChangePasswordModal = ({ visible, setIsVisible, loggedPersNo, token, onClose }) => {
    const [form] = Form.useForm();

    const handleOk = () => {
        form.validateFields()
            .then(values => {
                const params = { persNo: loggedPersNo, password: values.newPassword, passwordOld: values.oldPassword };
                doPostRequestAuth("password", params, token).then((res) => {
                    setIsVisible(false);
                    form.resetFields();
                    myToastSuccess("Passwort erfolgreich geändert")
                }, error => {
                    myToastError("Altes Passwort stimmt nicht")
                }
                );
            })
            .catch(info => {
            });
    };

    return (
        <Modal
            open={visible}
            title="Passwort ändern"
            onCancel={onClose}
            footer={[
                <Button key="cancel" onClick={onClose}>
                    Abbrechen
                </Button>,
                <Button key="submit" type="primary" onClick={handleOk}>
                    Ändern
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical" name="change_password_form">
                <Form.Item
                    name="oldPassword"
                    label="Altes Passwort"
                    rules={[
                        {
                            required: true,
                            message: 'Bitte geben Sie Ihr altes Passwort ein',
                        },
                    ]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    name="newPassword"
                    label="Neues Passwort"
                    rules={[
                        {
                            required: true,
                            message: 'Bitte geben Sie Ihr neues Passwort ein',
                        },
                    ]}
                >
                    <Input.Password />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ChangePasswordModal;
