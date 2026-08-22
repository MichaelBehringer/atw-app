package controller

import (
	"context"
	"io"
	"log"
	"mime"
	"net/http"
	"strings"
	"time"
)

// Benachrichtigungen ueber ntfy.
//
// Wichtig am Zuschnitt: eine Benachrichtigung ist Nebensache. Sie darf den
// Nutzer nicht warten lassen und erst recht nicht dazu fuehren, dass ein
// gespeicherter Auftrag nach einem Fehler aussieht, nur weil ein fremder
// Dienst nicht antwortet.

// Eigener Client mit Zeitlimit. http.DefaultClient hat keins - ein haengendes
// ntfy.sh haette den Speichern-Vorgang beliebig lange blockiert.
var ntfyClient = &http.Client{Timeout: 10 * time.Second}

func ntfyEnabled() bool {
	return !strings.EqualFold(Env("ATW_NTFY_ENABLED", "true"), "false")
}

func ntfyBaseURL() string {
	return strings.TrimRight(Env("ATW_NTFY_URL", "https://ntfy.sh"), "/")
}

// sendNtfy stellt die Nachricht in den Hintergrund und kehrt sofort zurueck.
func sendNtfy(topic, title, body string) {
	if !ntfyEnabled() || topic == "" {
		return
	}

	go func() {
		if err := postNtfy(topic, title, body); err != nil {
			// Nur protokollieren: der Auftrag ist gespeichert, die
			// Benachrichtigung ist es nicht wert, daraus einen Fehler fuer den
			// Nutzer zu machen. Vorher wurde der Fehler komplett verworfen,
			// ausgefallene Benachrichtigungen waeren also nie aufgefallen.
			log.Printf("ntfy: Senden an %q fehlgeschlagen: %v", topic, err)
		}
	}()
}

// postNtfy sendet synchron und gibt den Fehler zurueck. Getrennt von sendNtfy,
// damit sich das Verhalten testen laesst.
func postNtfy(topic, title, body string) error {
	// Eigener Kontext, nicht der der Anfrage: der ist beendet, sobald die
	// Antwort an den Nutzer raus ist, und wuerde das Senden abbrechen.
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ntfyBaseURL()+"/"+topic, strings.NewReader(body))
	if err != nil {
		return err
	}

	// ntfy verarbeitet UTF-8 in Headern, empfiehlt bei Sonderzeichen aber
	// RFC 2047. Feuerwehrnamen wie "Fuenfstetten" oder "Doeckingen" landen im
	// Titel, deshalb hier kodiert. Reiner ASCII-Text bleibt unveraendert.
	req.Header.Set("Title", mime.QEncoding.Encode("utf-8", title))
	req.Header.Set("Content-Type", "text/plain; charset=utf-8")

	resp, err := ntfyClient.Do(req)
	if err != nil {
		return err
	}
	// Ohne Close bleibt die Verbindung belegt.
	defer resp.Body.Close()
	io.Copy(io.Discard, resp.Body)

	if resp.StatusCode >= http.StatusMultipleChoices {
		return &ntfyStatusError{Status: resp.Status}
	}
	return nil
}

type ntfyStatusError struct {
	Status string
}

func (e *ntfyStatusError) Error() string {
	return "ntfy antwortete mit " + e.Status
}

// Die beiden Themennamen bleiben unveraendert - sie sind der Anker fuer die
// bereits eingerichteten Abos auf den Handys. Eine Umstellung wuerde alle
// bestehenden Benachrichtigungen stillschweigend abschalten.
func ntfyNoticeAnlieferung(topic string, source string, message string) {
	sendNtfy(topic, source+" - Anlieferung", "Bestandteile:"+message)
}

func ntfyNoticeBearbeitung(topic string, header string, message string) {
	sendNtfy("Info_"+topic, header, message)
}
