package controller

import (
	"strings"
	"testing"
	"time"

	"github.com/go-sql-driver/mysql"
)

func TestMitZeitlimitsErgaenztFehlendeWerte(t *testing.T) {
	// So sieht der DSN aus, den die .env auf der VM mitbringt.
	dsn := mitZeitlimits("ffwadmin:geheim@tcp(host.docker.internal:3306)/ffw")

	cfg, err := mysql.ParseDSN(dsn)
	if err != nil {
		t.Fatalf("Ergebnis nicht lesbar: %v", err)
	}

	// Ohne Verbindungs-Zeitlimit wartet der Treiber minutenlang, wenn die
	// Pakete verworfen werden - die Anmeldung in der Oberflaeche dreht dann
	// endlos.
	if cfg.Timeout != 5*time.Second {
		t.Errorf("Timeout = %v, erwartet 5s", cfg.Timeout)
	}
	if cfg.ReadTimeout != 30*time.Second {
		t.Errorf("ReadTimeout = %v, erwartet 30s", cfg.ReadTimeout)
	}
	if cfg.WriteTimeout != 30*time.Second {
		t.Errorf("WriteTimeout = %v, erwartet 30s", cfg.WriteTimeout)
	}
}

func TestMitZeitlimitsBehaeltZugangsdatenUndDatenbank(t *testing.T) {
	dsn := mitZeitlimits("ffwadmin:geheim@tcp(host.docker.internal:3306)/ffw")

	cfg, err := mysql.ParseDSN(dsn)
	if err != nil {
		t.Fatalf("Ergebnis nicht lesbar: %v", err)
	}
	if cfg.User != "ffwadmin" || cfg.Passwd != "geheim" {
		t.Errorf("Zugangsdaten verändert: %q / %q", cfg.User, cfg.Passwd)
	}
	if cfg.Addr != "host.docker.internal:3306" || cfg.DBName != "ffw" {
		t.Errorf("Ziel verändert: %q / %q", cfg.Addr, cfg.DBName)
	}
}

func TestMitZeitlimitsUeberschreibtEigeneAngabenNicht(t *testing.T) {
	// Wer im DSN selbst etwas setzt, soll es behalten.
	dsn := mitZeitlimits("u:p@tcp(host:3306)/db?timeout=1s&readTimeout=2s&writeTimeout=3s")

	cfg, err := mysql.ParseDSN(dsn)
	if err != nil {
		t.Fatalf("Ergebnis nicht lesbar: %v", err)
	}
	if cfg.Timeout != time.Second || cfg.ReadTimeout != 2*time.Second || cfg.WriteTimeout != 3*time.Second {
		t.Errorf("eigene Angaben überschrieben: %v / %v / %v", cfg.Timeout, cfg.ReadTimeout, cfg.WriteTimeout)
	}
}

func TestMitZeitlimitsGibtUnlesbarenDSNUnveraendertZurueck(t *testing.T) {
	// Dann soll sql.Open den Fehler melden, nicht diese Funktion still etwas
	// anderes daraus machen.
	kaputt := "das ist kein dsn"
	if got := mitZeitlimits(kaputt); got != kaputt {
		t.Errorf("mitZeitlimits(%q) = %q", kaputt, got)
	}
}

func TestStandardDSNZeigtAufDenHost(t *testing.T) {
	// Im Container erreicht die Anwendung die MySQL der VM nur hierüber, und
	// dafür muss extra_hosts in der docker-compose.yml stehen.
	if !strings.Contains(StandardDSN, "host.docker.internal") {
		t.Errorf("StandardDSN = %q", StandardDSN)
	}
}
