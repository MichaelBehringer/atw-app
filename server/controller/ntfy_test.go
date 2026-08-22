package controller

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// Alle Tests laufen gegen einen lokalen Testserver. Es geht nichts an ntfy.sh.

type erhalten struct {
	Pfad  string
	Titel string
	Typ   string
	Tags  string
	Click string
	Body  string
}

// testServer setzt ATW_NTFY_URL auf einen lokalen Server und gibt zurueck, was
// dort ankommt.
func testServer(t *testing.T, status int) *erhalten {
	t.Helper()

	got := &erhalten{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		got.Pfad = r.URL.Path
		got.Titel = r.Header.Get("Title")
		got.Typ = r.Header.Get("Content-Type")
		got.Tags = r.Header.Get("Tags")
		got.Click = r.Header.Get("Click")
		got.Body = string(body)
		w.WriteHeader(status)
	}))
	t.Cleanup(srv.Close)

	t.Setenv("ATW_NTFY_URL", srv.URL)
	t.Setenv("ATW_NTFY_ENABLED", "true")
	t.Setenv("ATW_APP_URL", "")
	return got
}

func TestPostNtfySendetThemaTitelUndText(t *testing.T) {
	got := testServer(t, http.StatusOK)

	err := postNtfy(ntfyNachricht{Thema: "Info_FF_AGW", Titel: "Amerbach - Anlieferung #143", Text: "- 3x Flaschen", Tags: "package"})
	if err != nil {
		t.Fatalf("unerwarteter Fehler: %v", err)
	}

	if got.Pfad != "/Info_FF_AGW" {
		t.Errorf("Pfad = %q, erwartet /Info_FF_AGW", got.Pfad)
	}
	if got.Titel != "Amerbach - Anlieferung #143" {
		t.Errorf("Titel = %q", got.Titel)
	}
	if got.Body != "- 3x Flaschen" {
		t.Errorf("Body = %q", got.Body)
	}
	if got.Typ != "text/plain; charset=utf-8" {
		t.Errorf("Content-Type = %q", got.Typ)
	}
	if got.Tags != "package" {
		t.Errorf("Tags = %q", got.Tags)
	}
}

func TestPostNtfyKodiertUmlauteImTitel(t *testing.T) {
	got := testServer(t, http.StatusOK)

	// Feuerwehren wie Fünfstetten oder Döckingen landen im Titel-Header.
	// HTTP-Header sind nicht auf UTF-8 festgelegt, ntfy empfiehlt dafür
	// RFC 2047.
	if err := postNtfy(ntfyNachricht{Thema: "thema", Titel: "Fünfstetten - Anlieferung", Text: "text"}); err != nil {
		t.Fatalf("unerwarteter Fehler: %v", err)
	}

	if got.Titel != "=?utf-8?q?F=C3=BCnfstetten_-_Anlieferung?=" {
		t.Errorf("Titel = %q, erwartet RFC-2047-Kodierung", got.Titel)
	}
}

func TestPostNtfyLaesstReinenASCIITitelUnveraendert(t *testing.T) {
	got := testServer(t, http.StatusOK)

	if err := postNtfy(ntfyNachricht{Thema: "thema", Titel: "Auftrag #142 komplett abgearbeitet", Text: "text"}); err != nil {
		t.Fatalf("unerwarteter Fehler: %v", err)
	}

	// Ohne Sonderzeichen soll nichts kodiert werden, sonst wird die Meldung
	// auf dem Handy unleserlich.
	if got.Titel != "Auftrag #142 komplett abgearbeitet" {
		t.Errorf("Titel = %q, erwartet unveraendert", got.Titel)
	}
}

func TestPostNtfySetztClickNurMitAppURL(t *testing.T) {
	got := testServer(t, http.StatusOK)

	if err := postNtfy(ntfyNachricht{Thema: "thema", Titel: "titel", Text: "text"}); err != nil {
		t.Fatalf("unerwarteter Fehler: %v", err)
	}
	// Ohne konfigurierte Adresse kein Link - ein falscher waere schlimmer als
	// keiner.
	if got.Click != "" {
		t.Errorf("Click = %q, erwartet leer", got.Click)
	}

	t.Setenv("ATW_APP_URL", "https://beispiel.test:11200/")
	if err := postNtfy(ntfyNachricht{Thema: "thema", Titel: "titel", Text: "text"}); err != nil {
		t.Fatalf("unerwarteter Fehler: %v", err)
	}
	if got.Click != "https://beispiel.test:11200/" {
		t.Errorf("Click = %q", got.Click)
	}
}

func TestPostNtfyMeldetFehlerStatus(t *testing.T) {
	testServer(t, http.StatusForbidden)

	if err := postNtfy(ntfyNachricht{Thema: "thema", Titel: "titel", Text: "text"}); err == nil {
		t.Fatal("Fehlerstatus wurde nicht gemeldet")
	}
}

func TestSendNtfySchweigtWennAbgeschaltet(t *testing.T) {
	got := testServer(t, http.StatusOK)
	t.Setenv("ATW_NTFY_ENABLED", "false")

	// sendNtfy prueft den Schalter, bevor eine Goroutine startet - der Aufruf
	// darf also synchron nichts ausloesen.
	sendNtfy(ntfyNachricht{Thema: "thema", Titel: "titel", Text: "text"})

	if got.Pfad != "" {
		t.Errorf("es wurde gesendet, obwohl abgeschaltet: %q", got.Pfad)
	}
}

func TestSendNtfySchweigtOhneThema(t *testing.T) {
	got := testServer(t, http.StatusOK)

	// Der Themenname kommt aus der Datenbank. Ist er leer, waere das Ziel
	// https://ntfy.sh/ - also ein Beitrag ins Nichts.
	sendNtfy(ntfyNachricht{Thema: "", Titel: "titel", Text: "text"})

	if got.Pfad != "" {
		t.Errorf("es wurde ohne Thema gesendet: %q", got.Pfad)
	}
}

func TestNtfyEnabledStandardIstAn(t *testing.T) {
	t.Setenv("ATW_NTFY_ENABLED", "")
	if !ntfyEnabled() {
		t.Error("ohne Angabe muessen Benachrichtigungen an sein")
	}

	for _, wert := range []string{"false", "FALSE", "False"} {
		t.Setenv("ATW_NTFY_ENABLED", wert)
		if ntfyEnabled() {
			t.Errorf("%q haette abschalten muessen", wert)
		}
	}
}

func TestNtfyBaseURLOhneAbschliessendenSchraegstrich(t *testing.T) {
	t.Setenv("ATW_NTFY_URL", "https://ntfy.example.com/")
	// Sonst entstuende https://ntfy.example.com//thema
	if got := ntfyBaseURL(); got != "https://ntfy.example.com" {
		t.Errorf("ntfyBaseURL() = %q", got)
	}
}

// ---------- Inhalt der Nachrichten ----------

func TestNtfyPostenListeNenntAnzahlUndNummern(t *testing.T) {
	posten := []ntfyPosten{
		{Name: "Flaschen füllen", Nummern: []string{"22", "12", "15"}},
		{Name: "Flaschen TÜV", Nummern: nil},
		{Name: "Masken prüfen", Nummern: []string{"3"}},
	}

	got := ntfyPostenListe(posten)
	want := "- 3x Flaschen füllen: 12, 15, 22\n- 1x Masken prüfen: 3"

	// Arbeitsarten ohne Nummern tauchen nicht auf, und die Nummern stehen
	// aufsteigend - unabhaengig davon, in welcher Folge die Haekchen gesetzt
	// wurden.
	if got != want {
		t.Errorf("ntfyPostenListe() =\n%q\nerwartet\n%q", got, want)
	}
}

func TestNtfyPostenListeIstLeerOhnePosten(t *testing.T) {
	if got := ntfyPostenListe(nil); got != "" {
		t.Errorf("erwartet leer, war %q", got)
	}
	if got := ntfyPostenListe([]ntfyPosten{{Name: "Flaschen füllen"}}); got != "" {
		t.Errorf("erwartet leer, war %q", got)
	}
}

func TestNtfyPostenKurzFasstEinzeiligZusammen(t *testing.T) {
	posten := []ntfyPosten{
		{Name: "Flaschen füllen", Nummern: []string{"12"}},
		{Name: "Masken prüfen", Nummern: []string{"3", "7"}},
		{Name: "LA prüfen", Nummern: nil},
	}

	if got := ntfyPostenKurz(posten); got != "1x Flaschen füllen, 2x Masken prüfen" {
		t.Errorf("ntfyPostenKurz() = %q", got)
	}
}

func TestSortiereNummernNumerischNichtAlphabetisch(t *testing.T) {
	// Alphabetisch waere 12, 2, 7 - also unbrauchbar.
	got := sortiereNummern([]string{"12", "2", "7"})
	if strings.Join(got, ",") != "2,7,12" {
		t.Errorf("sortiereNummern() = %v", got)
	}
}

func TestSortiereNummernVeraendertDieEingabeNicht(t *testing.T) {
	eingabe := []string{"3", "1"}
	sortiereNummern(eingabe)
	// Sonst wuerde die Sortierung fuer die Nachricht die Daten veraendern, die
	// der Aufrufer danach noch verwendet.
	if eingabe[0] != "3" {
		t.Errorf("Eingabe wurde veraendert: %v", eingabe)
	}
}

func TestAnlieferungTitelUndTagsUndText(t *testing.T) {
	got := testServer(t, http.StatusOK)

	err := postNtfy(ntfyNachricht{
		Thema: ntfyThemaAnlieferung,
		Titel: "Amerbach - Anlieferung #143",
		Text:  ntfyPostenListe([]ntfyPosten{{Name: "Flaschen füllen", Nummern: []string{"12", "15"}}}),
		Tags:  "package",
	})
	if err != nil {
		t.Fatalf("unerwarteter Fehler: %v", err)
	}

	if got.Pfad != "/Info_FF_AGW" {
		t.Errorf("Thema = %q - Bestandsabos haengen daran", got.Pfad)
	}
	if got.Body != "- 2x Flaschen füllen: 12, 15" {
		t.Errorf("Body = %q", got.Body)
	}
}

func TestThemaBearbeitungBehaeltPraefix(t *testing.T) {
	// Das Praefix ist Teil der bestehenden Abos auf den Handys.
	if got := ntfyThemaBearbeitung("mmuster"); got != "Info_mmuster" {
		t.Errorf("ntfyThemaBearbeitung() = %q", got)
	}
}
