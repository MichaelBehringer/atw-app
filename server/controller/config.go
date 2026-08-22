package controller

import "os"

// Env liest eine Umgebungsvariable und faellt auf def zurueck, wenn sie nicht
// gesetzt oder leer ist. Die Defaults entsprechen den Werten, die vorher fest
// im Quellcode standen - ohne gesetzte Variablen verhaelt sich der Server also
// unveraendert.
func Env(key, def string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return def
}
