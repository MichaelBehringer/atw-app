package controller

import (
	"regexp"
	"testing"

	. "ffAPI/models"

	"github.com/DATA-DOG/go-sqlmock"
)

// mitMockDB ersetzt die globale Verbindung fuer die Dauer eines Tests.
func mitMockDB(t *testing.T) sqlmock.Sqlmock {
	t.Helper()
	mockDB, mock, mockErr := sqlmock.New()
	if mockErr != nil {
		t.Fatalf("sqlmock: %v", mockErr)
	}
	vorher := db
	db = mockDB
	t.Cleanup(func() {
		db = vorher
		mockDB.Close()
	})
	return mock
}

func pruefeErwartungen(t *testing.T, mock sqlmock.Sqlmock) {
	t.Helper()
	if erwartErr := mock.ExpectationsWereMet(); erwartErr != nil {
		t.Error(erwartErr)
	}
}

func beispielEintrag() EntryObj {
	return EntryObj{
		DataNo: 42, City: 3, User: 7, DateWork: "2026-09-29", TimeWork: 1.5,
		FlaschenFuellen: 1, FlaschenTuev: 2, MaskenReinigen: 3, MaskenPruefen: 4,
		LaReinigen: 5, LaPruefen: 6, GeraetePruefen: 7, GeraeteReinigen: 8,
		Bemerkung:         "Test",
		FlaschenFuellenNr: "1", FlaschenTuevNr: "2,3", MaskenPruefenNr: "4",
		MaskenReinigenNr: "5", LaPruefenNr: "6", LaReinigenNr: "7",
		GeraetePruefenNr: "8", GeraeteReinigenNr: "9",
	}
}

func TestSaveEntrySchreibtBeideTabellenMitDataNo(t *testing.T) {
	mock := mitMockDB(t)
	e := beispielEintrag()

	mock.ExpectExec(regexp.QuoteMeta("UPDATE atemschutzpflegestelle_data SET")).
		WithArgs(e.FlaschenFuellen, e.MaskenPruefen, e.GeraetePruefen, e.User, e.TimeWork, e.DateWork, e.FlaschenTuev, e.MaskenReinigen, e.LaPruefen, e.LaReinigen, e.GeraeteReinigen, e.Bemerkung, e.DataNo).
		WillReturnResult(sqlmock.NewResult(0, 1))
	mock.ExpectExec(regexp.QuoteMeta("UPDATE atemschutzpflegestelle_nr set")).
		WithArgs(e.FlaschenFuellenNr, e.FlaschenTuevNr, e.MaskenPruefenNr, e.MaskenReinigenNr, e.LaPruefenNr, e.LaReinigenNr, e.GeraetePruefenNr, e.GeraeteReinigenNr, e.DataNo).
		WillReturnResult(sqlmock.NewResult(0, 1))

	if saveErr := SaveEntry(e); saveErr != nil {
		t.Fatalf("SaveEntry: %v", saveErr)
	}
	pruefeErwartungen(t, mock)
}

func TestSaveEntryMeldetFehler(t *testing.T) {
	mock := mitMockDB(t)
	mock.ExpectExec("UPDATE atemschutzpflegestelle_data").WillReturnError(sqlmock.ErrCancelled)

	if SaveEntry(beispielEintrag()) == nil {
		t.Fatal("Fehler der Datenbank wurde verschluckt")
	}
}

func TestUpdateEntrySetztGeraetePruefenRichtig(t *testing.T) {
	mock := mitMockDB(t)
	e := beispielEintrag()

	mock.ExpectExec(regexp.QuoteMeta("UPDATE atemschutzpflegestelle_data SET")).
		WithArgs(e.FlaschenFuellen, e.MaskenPruefen, e.GeraetePruefen, e.TimeWork, e.FlaschenTuev, e.MaskenReinigen, e.LaPruefen, e.LaReinigen, e.GeraeteReinigen, e.Bemerkung, e.DataNo).
		WillReturnResult(sqlmock.NewResult(0, 1))

	if updateErr := UpdateEntry(e); updateErr != nil {
		t.Fatalf("UpdateEntry: %v", updateErr)
	}
	pruefeErwartungen(t, mock)
}
