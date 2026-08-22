import axios from "axios";

// Default: relativer Pfad. In Dev leitet der Vite-Proxy /server/ auf das
// Backend um, in Produktion macht das nginx (location /server/).
// VITE_API_URL ueberschreibt das nur fuer Sonderfaelle (siehe .env.example).
const url = import.meta.env.VITE_API_URL ?? "/server/"

// Eigene Instanz statt der globalen: der Interceptor unten soll ausschliesslich
// fuer die Aufrufe dieser Anwendung gelten.
const client = axios.create()

let onUnauthorized = null
let bereitsGemeldet = false

// Wird von TokenContainer gesetzt. Der Interceptor kann removeToken nicht
// selbst aufrufen, weil das an React-State haengt.
export function registerUnauthorizedHandler(handler) {
	onUnauthorized = handler
	// Nach einer erneuten Anmeldung soll wieder gemeldet werden koennen.
	bereitsGemeldet = false
}

// Ist die Antwort ein abgelaufenes oder ungueltiges Token?
//
// 405 ist die Antwort der AuthUser-Middleware auf ein ungueltiges Token
// (server/middleware/authUser.go). Gin liefert 405 sonst nicht, weil
// HandleMethodNotAllowed standardmaessig aus ist - der Code ist hier also
// eindeutig.
//
// Bewusst NICHT 400: das schickt die Middleware bei fehlendem Token, aber
// createUser meldet damit auch einen schon vergebenen Benutzernamen. Und nicht
// 401: das kommt nur von der Anmeldung selbst, wo es keine Sitzung zu beenden
// gibt.
export function istTokenUngueltig(error) {
	if (error?.response?.status !== 405) return false
	// Nur Anfragen, die tatsaechlich ein Token mitgeschickt haben.
	return Boolean(error?.config?.headers?.Authorization)
}

client.interceptors.response.use(undefined, (error) => {
	if (istTokenUngueltig(error) && onUnauthorized && !bereitsGemeldet) {
		// Nur einmal: bei mehreren gleichzeitig laufenden Anfragen gaebe es
		// sonst mehrere Meldungen.
		bereitsGemeldet = true
		onUnauthorized()
	}
	return Promise.reject(error)
})

export async function doPostRequest(path, param) {
	return client.post(url+path, param)
}

export async function doPostRequestAuth(path, param, auth) {
	return client.post(url+path, param, {headers: {Authorization: 'Bearer ' + auth}})
}

export async function doGetRequestBlob(path) {
	return client.get(url+path, { responseType: 'blob' })
}

export async function doGetRequestAuth(path, auth) {
	return client.get(url+path, {headers: {Authorization: 'Bearer ' + auth}})
}

export async function doDeleteRequestAuth(path, param, auth) {
	const dataObj = { data: param, headers: {Authorization: 'Bearer ' + auth}}
	return client.delete(url+path, dataObj)
}

export async function doPutRequestAuth(path, param, auth) {
	return client.put(url+path, param, {headers: {Authorization: 'Bearer ' + auth}})
}
