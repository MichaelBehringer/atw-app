import { message } from "antd";

export function myToastError(txt) {
	message.error(txt, 3);
}

export function myToastSuccess(txt) {
	message.success(txt, 3);
}

	export function myToastInfo(txt) {
		message.info(txt, 3);
}