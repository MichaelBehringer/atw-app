package controller

import (
	"context"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"sort"
	"strconv"
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

// Adresse der Anwendung. Ist sie gesetzt, oeffnet ein Tipp auf die
// Benachrichtigung direkt die Auftragsliste. Ohne Angabe entfaellt der Link -
// ein falscher waere schlimmer als keiner.
func ntfyAppURL() string {
	return Env("ATW_APP_URL", "")
}

type ntfyNachricht struct {
	Thema string
	Titel string
	Text  string
	// Emoji-Kuerzel, das ntfy dem Titel voranstellt. Macht die Meldungen in
	// der Benachrichtigungsliste auf einen Blick unterscheidbar.
	Tags string
}

// Ein Posten einer Nachricht: eine Arbeitsart mit den betroffenen
// Geraetenummern.
type ntfyPosten struct {
	Name    string
	Nummern []string
}

// ntfyPostenListe formatiert die Posten mehrzeilig, mit Anzahl und Nummern:
//
//	- 3x Flaschen fuellen: 12, 15, 22
//	- 1x Masken pruefen: 3
//
// Die Nummern waren vorher nur als Anzahl in der Nachricht. Fuer die
// empfangende Feuerwehr ist aber genau die Nummer die Information, die zaehlt -
// sie weiss dann, welche Flasche sie abholen kann.
func ntfyPostenListe(posten []ntfyPosten) string {
	var zeilen []string
	for _, p := range posten {
		if len(p.Nummern) == 0 {
			continue
		}
		zeilen = append(zeilen, fmt.Sprintf("- %dx %s: %s", len(p.Nummern), p.Name, strings.Join(sortiereNummern(p.Nummern), ", ")))
	}
	return strings.Join(zeilen, "\n")
}

// ntfyPostenKurz fasst die Posten einzeilig zusammen, ohne Nummern:
//
//	1x Flaschen fuellen, 2x Masken pruefen
func ntfyPostenKurz(posten []ntfyPosten) string {
	var teile []string
	for _, p := range posten {
		if len(p.Nummern) == 0 {
			continue
		}
		teile = append(teile, fmt.Sprintf("%dx %s", len(p.Nummern), p.Name))
	}
	return strings.Join(teile, ", ")
}

// Nummern aufsteigend, damit die Reihenfolge nicht davon abhaengt, in welcher
// Folge jemand die Haekchen gesetzt hat.
func sortiereNummern(nummern []string) []string {
	kopie := make([]string, len(nummern))
	copy(kopie, nummern)
	sort.Slice(kopie, func(i, j int) bool {
		a, errA := strconv.Atoi(kopie[i])
		b, errB := strconv.Atoi(kopie[j])
		if errA != nil || errB != nil {
			return kopie[i] < kopie[j]
		}
		return a < b
	})
	return kopie
}

// sendNtfy stellt die Nachricht in den Hintergrund und kehrt sofort zurueck.
func sendNtfy(n ntfyNachricht) {
	if !ntfyEnabled() || n.Thema == "" {
		return
	}

	go func() {
		if err := postNtfy(n); err != nil {
			// Nur protokollieren: der Auftrag ist gespeichert, die
			// Benachrichtigung ist es nicht wert, daraus einen Fehler fuer den
			// Nutzer zu machen. Vorher wurde der Fehler komplett verworfen,
			// ausgefallene Benachrichtigungen waeren also nie aufgefallen.
			log.Printf("ntfy: Senden an %q fehlgeschlagen: %v", n.Thema, err)
		}
	}()
}

// postNtfy sendet synchron und gibt den Fehler zurueck. Getrennt von sendNtfy,
// damit sich das Verhalten testen laesst.
func postNtfy(n ntfyNachricht) error {
	// Eigener Kontext, nicht der der Anfrage: der ist beendet, sobald die
	// Antwort an den Nutzer raus ist, und wuerde das Senden abbrechen.
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ntfyBaseURL()+"/"+n.Thema, strings.NewReader(n.Text))
	if err != nil {
		return err
	}

	// ntfy verarbeitet UTF-8 in Headern, empfiehlt bei Sonderzeichen aber
	// RFC 2047. Feuerwehrnamen wie "Fuenfstetten" oder "Doeckingen" landen im
	// Titel, deshalb hier kodiert. Reiner ASCII-Text bleibt unveraendert.
	req.Header.Set("Title", mime.QEncoding.Encode("utf-8", n.Titel))
	req.Header.Set("Content-Type", "text/plain; charset=utf-8")
	if n.Tags != "" {
		req.Header.Set("Tags", n.Tags)
	}
	if url := ntfyAppURL(); url != "" {
		req.Header.Set("Click", url)
	}

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

// Die Themennamen bleiben unveraendert - sie sind der Anker fuer die bereits
// eingerichteten Abos auf den Handys. Eine Umstellung wuerde alle bestehenden
// Benachrichtigungen stillschweigend abschalten.
const ntfyThemaAnlieferung = "Info_FF_AGW"

func ntfyThemaBearbeitung(benutzername string) string {
	return "Info_" + benutzername
}

// Meldung an die Geraetewarte: eine Feuerwehr hat Material angeliefert.
//
// Die Feuerwehr steht vorne im Titel, weil alle Geraetewarte dasselbe Thema
// abonnieren - sie ist also das Unterscheidungsmerkmal in der
// Benachrichtigungsliste.
func ntfyAnlieferung(auftragNr int64, feuerwehr string, posten []ntfyPosten) {
	text := ntfyPostenListe(posten)
	if text == "" {
		text = "Keine Angaben zu den Bestandteilen."
	}

	sendNtfy(ntfyNachricht{
		Thema: ntfyThemaAnlieferung,
		Titel: fmt.Sprintf("%s - Anlieferung #%d", feuerwehr, auftragNr),
		Text:  text,
		Tags:  "package",
	})
}

// Meldung an die anliefernde Feuerwehr: an ihrem Auftrag wurde gearbeitet.
//
// Die Auftragsnummer steht im Titel, damit man in der Benachrichtigungsliste
// mehrere Meldungen auseinanderhalten kann, ohne sie zu oeffnen.
func ntfyBearbeitung(benutzername string, auftragNr int, bearbeiter string, erledigt []ntfyPosten, offen []ntfyPosten) {
	komplett := ntfyPostenKurz(offen) == ""

	zustand := "teilweise abgearbeitet"
	tags := "hammer_and_wrench"
	if komplett {
		zustand = "komplett abgearbeitet"
		tags = "white_check_mark"
	}

	absaetze := []string{"Bearbeiter: " + bearbeiter}
	if liste := ntfyPostenListe(erledigt); liste != "" {
		absaetze = append(absaetze, "Erledigt:\n"+liste)
	}
	if kurz := ntfyPostenKurz(offen); kurz != "" {
		// Fuer die Feuerwehr die wichtigste Information: was fehlt noch.
		absaetze = append(absaetze, "Noch offen: "+kurz)
	}

	sendNtfy(ntfyNachricht{
		Thema: ntfyThemaBearbeitung(benutzername),
		Titel: fmt.Sprintf("Auftrag #%d %s", auftragNr, zustand),
		Text:  strings.Join(absaetze, "\n\n"),
		Tags:  tags,
	})
}
