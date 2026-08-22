package controller

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/go-sql-driver/mysql"
)

var db *sql.DB
var err error

const StandardDSN = "ffwadmin:gnidmewff@tcp(host.docker.internal:3306)/ffw"

// mitZeitlimits ergaenzt fehlende Zeitlimits im DSN.
//
// Der MySQL-Treiber hat von sich aus keine. Ist der Server nicht erreichbar und
// werden die Pakete verworfen statt abgelehnt - etwa durch eine Firewall mit
// DROP -, wartet der Verbindungsversuch minutenlang. Die HTTP-Anfrage haengt
// dann genauso lange, und in der Oberflaeche dreht sich der Anmeldeknopf
// endlos, ohne dass irgendwo ein Fehler auftaucht.
func mitZeitlimits(dsn string) string {
	cfg, parseErr := mysql.ParseDSN(dsn)
	if parseErr != nil {
		// Nicht lesbar: unveraendert weitergeben, sql.Open meldet es.
		return dsn
	}
	if cfg.Timeout == 0 {
		cfg.Timeout = 5 * time.Second
	}
	if cfg.ReadTimeout == 0 {
		cfg.ReadTimeout = 30 * time.Second
	}
	if cfg.WriteTimeout == 0 {
		cfg.WriteTimeout = 30 * time.Second
	}
	return cfg.FormatDSN()
}

func InitDB() {
	db, err = sql.Open("mysql", mitZeitlimits(Env("ATW_DB_DSN", StandardDSN)))
	if err != nil {
		panic(err.Error())
	}

	// MySQL schliesst untaetige Verbindungen nach einer Weile selbst. Ohne
	// Begrenzung wuerde der Pool solche Leichen weiterverwenden.
	//
	// Bewusst KEIN SetMaxOpenConns: die Abfragen in diesem Paket schliessen ihre
	// *sql.Rows nicht, jede Listenabfrage haelt also eine Verbindung fest. Mit
	// einer Obergrenze wuerde die Anwendung nach einigen Abfragen haengen statt
	// weiterzulaufen.
	db.SetConnMaxLifetime(3 * time.Minute)

	// sql.Open baut noch keine Verbindung auf. Ohne diesen Test faellt eine
	// falsche Konfiguration erst bei der ersten Anmeldung auf, und dann nur als
	// unerklaerlicher Fehler in der Oberflaeche - im Log stand nichts.
	if pingErr := db.Ping(); pingErr != nil {
		log.Printf("Datenbank NICHT erreichbar: %v", pingErr)
		log.Printf("Hinweis: laeuft die Anwendung im Container, muss MySQL auf der Docker-Bridge lauschen und der Benutzer von dort zugelassen sein - siehe README.")
	} else {
		log.Println("Datenbank erreichbar")
	}
}

func CloseDB() {
	db.Close()
}

func ExecuteSQL(statement string, params ...interface{}) *sql.Rows {
	results, err := db.Query(statement, params...)
	if err != nil {
		fmt.Println("Err", err.Error())
		return nil
	}
	return results
}

func ExecuteSQLRow(statement string, params ...interface{}) *sql.Row {
	return db.QueryRow(statement, params...)
}

func ExecuteDDL(statement string, params ...interface{}) sql.Result {
	result, _ := db.Exec(statement, params...)
	return result
}
