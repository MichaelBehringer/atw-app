package controller

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Alle Tests laufen gegen einen lokalen Testserver. Es geht nichts an ntfy.sh.

type erhalten struct {
	Pfad  string
	Titel string
	Typ   string
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
		got.Body = string(body)
		w.WriteHeader(status)
	}))
	t.Cleanup(srv.Close)

	t.Setenv("ATW_NTFY_URL", srv.URL)
	t.Setenv("ATW_NTFY_ENABLED", "true")
	return got
}

func TestPostNtfySendetThemaTitelUndText(t *testing.T) {
	got := testServer(t, http.StatusOK)

	if err := postNtfy("Info_FF_AGW", "Amerbach - Anlieferung", "Bestandteile: 3x Flaschen"); err != nil {
		t.Fatalf("unerwarteter Fehler: %v", err)
	}

	if got.Pfad != "/Info_FF_AGW" {
		t.Errorf("Pfad = %q, erwartet /Info_FF_AGW", got.Pfad)
	}
	if got.Titel != "Amerbach - Anlieferung" {
		t.Errorf("Titel = %q", got.Titel)
	}
	if got.Body != "Bestandteile: 3x Flaschen" {
		t.Errorf("Body = %q", got.Body)
	}
	if got.Typ != "text/plain; charset=utf-8" {
		t.Errorf("Content-Type = %q", got.Typ)
	}
}

func TestPostNtfyKodiertUmlauteImTitel(t *testing.T) {
	got := testServer(t, http.StatusOK)

	// Feuerwehren wie Fünfstetten oder Döckingen landen im Titel-Header.
	// HTTP-Header sind nicht auf UTF-8 festgelegt, ntfy empfiehlt dafür
	// RFC 2047.
	if err := postNtfy("thema", "Fünfstetten - Anlieferung", "text"); err != nil {
		t.Fatalf("unerwarteter Fehler: %v", err)
	}

	if got.Titel == "Fünfstetten - Anlieferung" {
		t.Error("Titel wurde nicht kodiert")
	}
	if got.Titel != "=?utf-8?q?F=C3=BCnfstetten_-_Anlieferung?=" {
		t.Errorf("Titel = %q, erwartet RFC-2047-Kodierung", got.Titel)
	}
}

func TestPostNtfyLaesstReinenASCIITitelUnveraendert(t *testing.T) {
	got := testServer(t, http.StatusOK)

	if err := postNtfy("thema", "Auftrag komplett abgearbeitet", "text"); err != nil {
		t.Fatalf("unerwarteter Fehler: %v", err)
	}

	// Ohne Sonderzeichen soll nichts kodiert werden, sonst wird die Meldung
	// auf dem Handy unleserlich.
	if got.Titel != "Auftrag komplett abgearbeitet" {
		t.Errorf("Titel = %q, erwartet unveraendert", got.Titel)
	}
}

func TestPostNtfyMeldetFehlerStatus(t *testing.T) {
	testServer(t, http.StatusForbidden)

	err := postNtfy("thema", "titel", "text")
	if err == nil {
		t.Fatal("Fehlerstatus wurde nicht gemeldet")
	}
}

func TestSendNtfySchweigtWennAbgeschaltet(t *testing.T) {
	got := testServer(t, http.StatusOK)
	t.Setenv("ATW_NTFY_ENABLED", "false")

	// sendNtfy prueft den Schalter, bevor eine Goroutine startet - der Aufruf
	// darf also synchron nichts ausloesen.
	sendNtfy("thema", "titel", "text")

	if got.Pfad != "" {
		t.Errorf("es wurde gesendet, obwohl abgeschaltet: %q", got.Pfad)
	}
}

func TestSendNtfySchweigtOhneThema(t *testing.T) {
	got := testServer(t, http.StatusOK)

	// Der Themenname kommt aus der Datenbank. Ist er leer, waere das Ziel
	// https://ntfy.sh/ - also ein Beitrag ins Nichts.
	sendNtfy("", "titel", "text")

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
