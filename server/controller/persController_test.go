package controller

import (
	"regexp"
	"testing"

	. "ffAPI/models"

	"github.com/DATA-DOG/go-sqlmock"
)

const namensPruefung = "SELECT COUNT(*) FROM pers WHERE UPPER(USERNAME)=UPPER(?) AND PERS_NO<>?"

func TestUpdateUserMitEigenemNamenIstErlaubt(t *testing.T) {
	mock := mitMockDB(t)
	p := Person{PersNoKey: 7, Username: "max", Firstname: "Max", Lastname: "Muster", FunctionNo: 1, CityNo: 2}

	// Der eigene Datensatz ist ausgeschlossen - also kein Treffer.
	mock.ExpectQuery(regexp.QuoteMeta(namensPruefung)).WithArgs("max", 7).
		WillReturnRows(sqlmock.NewRows([]string{"c"}).AddRow(0))
	mock.ExpectExec(regexp.QuoteMeta("UPDATE pers SET")).
		WithArgs("Max", "Muster", 1, 2, "max", 7).
		WillReturnResult(sqlmock.NewResult(0, 1))

	ok, updateErr := UpdateUser(p)
	if updateErr != nil || !ok {
		t.Fatalf("UpdateUser = %v, %v; erwartet true, nil", ok, updateErr)
	}
	pruefeErwartungen(t, mock)
}

func TestUpdateUserMitFremdemNamenWirdAbgelehnt(t *testing.T) {
	mock := mitMockDB(t)
	p := Person{PersNoKey: 7, Username: "Anna"}

	mock.ExpectQuery(regexp.QuoteMeta(namensPruefung)).WithArgs("Anna", 7).
		WillReturnRows(sqlmock.NewRows([]string{"c"}).AddRow(1))

	ok, updateErr := UpdateUser(p)
	if updateErr != nil || ok {
		t.Fatalf("UpdateUser = %v, %v; erwartet false, nil", ok, updateErr)
	}
	pruefeErwartungen(t, mock)
}

func TestCreateCityLehntDuplikatAb(t *testing.T) {
	mock := mitMockDB(t)

	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(*) FROM atemschutzpflegestelle_cities")).WithArgs("Wemding").
		WillReturnRows(sqlmock.NewRows([]string{"c"}).AddRow(1))

	ok, createErr := CreateCity(City{Name: " Wemding "})
	if createErr != nil || ok {
		t.Fatalf("CreateCity = %v, %v; erwartet false, nil", ok, createErr)
	}
	pruefeErwartungen(t, mock)
}

func TestCreateCityLegtNeueAn(t *testing.T) {
	mock := mitMockDB(t)

	mock.ExpectQuery(regexp.QuoteMeta("SELECT COUNT(*) FROM atemschutzpflegestelle_cities")).WithArgs("Fessenheim").
		WillReturnRows(sqlmock.NewRows([]string{"c"}).AddRow(0))
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO atemschutzpflegestelle_cities")).WithArgs("Fessenheim").
		WillReturnResult(sqlmock.NewResult(5, 1))

	ok, createErr := CreateCity(City{Name: "Fessenheim"})
	if createErr != nil || !ok {
		t.Fatalf("CreateCity = %v, %v; erwartet true, nil", ok, createErr)
	}
	pruefeErwartungen(t, mock)
}

func TestCreateCityOhneNamen(t *testing.T) {
	mitMockDB(t)
	if ok, _ := CreateCity(City{Name: "  "}); ok {
		t.Fatal("leerer Name wurde angelegt")
	}
}
