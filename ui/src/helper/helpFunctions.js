export function getUserToID(userID, users) {
	return users.find(u => u.persNo === userID)
}

export function isAdmin(functionID) {
	return functionID === 2
}

export function isATW(functionID) {
	return functionID === 1
}

export function isExternal(functionID) {
	return functionID === 3
}

export function getWemding() {
	return {value: 1, label: 'Wemding'}
}