package controller

import (
	"database/sql"
	. "ffAPI/models"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

func GetSearchResult(searchParam SearchParam) []SearchResult {
	results := ExecuteSQL("select d.DATA_NO , nvl(ac.CITY_NAME,''), DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y'), d.TIME_WORK , d.FLASCHEN_FUELLEN , d.FLASCHEN_TUEV , d.MASKEN_REINIGEN , d.MASKEN_PRUEFEN , d.LA_REINIGEN , d.LA_PRUEFEN , d.GERAETE_PRUEFEN , d.GERAETE_REINIGEN, d.BEMERKUNG from atemschutzpflegestelle_data d left join atemschutzpflegestelle_cities ac on d.CITY_NO=ac.CITY_NO where PERS_NO = ? and d.state = 'saved' order by d.DATA_NO desc", searchParam.PersNo)
	searchResults := []SearchResult{}
	for results.Next() {
		var searchResult SearchResult
		results.Scan(&searchResult.DataNo, &searchResult.City, &searchResult.DateWork, &searchResult.TimeWork, &searchResult.FlaschenFuellen, &searchResult.FlaschenTuev, &searchResult.MaskenReinigen, &searchResult.MaskenPruefen, &searchResult.LaReinigen, &searchResult.LaPruefen, &searchResult.GeraetePruefen, &searchResult.GeraeteReinigen, &searchResult.Bemerkung)
		searchResults = append(searchResults, searchResult)
	}
	return searchResults
}

func GetEntryByID(id string) EntryObj {
	var entry EntryObj
	err := ExecuteSQLRow("select d.DATA_NO , d.CITY_NO, DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y'), d.TIME_WORK , d.FLASCHEN_FUELLEN , d.FLASCHEN_TUEV , d.MASKEN_REINIGEN , d.MASKEN_PRUEFEN , d.LA_REINIGEN , d.LA_PRUEFEN , d.GERAETE_PRUEFEN , d.GERAETE_REINIGEN, d.BEMERKUNG, n.FLASCHEN_FUELLEN_NR, n.FLASCHEN_TUEV_NR, n.MASKEN_PRUEFEN_NR, n.MASKEN_REINIGEN_NR, n.LA_PRUEFEN_NR, n.LA_REINIGEN_NR, n.GERAETE_PRUEFEN_NR, n.GERAETE_REINIGEN_NR from atemschutzpflegestelle_data d inner join atemschutzpflegestelle_nr n on d.DATA_NO = n.DATA_NO where d.DATA_NO = ? ", id).Scan(
		&entry.DataNo, &entry.City, &entry.DateWork, &entry.TimeWork, &entry.FlaschenFuellen, &entry.FlaschenTuev, &entry.MaskenReinigen, &entry.MaskenPruefen, &entry.LaReinigen, &entry.LaPruefen, &entry.GeraetePruefen, &entry.GeraeteReinigen, &entry.Bemerkung, &entry.FlaschenFuellenNr, &entry.FlaschenTuevNr, &entry.MaskenPruefenNr, &entry.MaskenReinigenNr, &entry.LaPruefenNr, &entry.LaReinigenNr, &entry.GeraetePruefenNr, &entry.GeraeteReinigenNr)
	fmt.Println(entry)
	fmt.Println(err)
	return entry
}

func GetSearchResultOpen(searchParam SearchParamExtra) []SearchResultOpen {
	var results *sql.Rows
	if searchParam.IsExternal {
		results = ExecuteSQL("select d.DATA_NO, ac.CITY_NAME, DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y'), d.state from atemschutzpflegestelle_data d inner join atemschutzpflegestelle_cities ac on d.CITY_NO=ac.CITY_NO inner join pers p on d.CITY_NO=p.CITY_NO where p.PERS_NO=? order by d.DATA_NO desc", searchParam.PersNo)
	} else {
		results = ExecuteSQL("select d.DATA_NO, ac.CITY_NAME, DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y'), d.state from atemschutzpflegestelle_data d inner join atemschutzpflegestelle_cities ac on d.CITY_NO=ac.CITY_NO where d.state='open' order by d.DATA_NO desc")
	}
	searchResults := []SearchResultOpen{}
	for results.Next() {
		var searchResult SearchResultOpen
		results.Scan(&searchResult.DataNo, &searchResult.City, &searchResult.DateWork, &searchResult.State)
		searchResults = append(searchResults, searchResult)
	}
	return searchResults
}

func CreateEntry(newEntry EntryObj) {
	result := ExecuteDDL("INSERT INTO atemschutzpflegestelle_data (CITY_NO, FLASCHEN_FUELLEN, MASKEN_PRUEFEN, GERAETE_PRUEFEN, PERS_NO, TIME_WORK, DATE_WORK, FLASCHEN_TUEV, MASKEN_REINIGEN, LA_PRUEFEN, LA_REINIGEN, GERAETE_REINIGEN, BEMERKUNG) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", newEntry.City, newEntry.FlaschenFuellen, newEntry.MaskenPruefen, newEntry.GeraetePruefen, newEntry.User, newEntry.TimeWork, newEntry.DateWork, newEntry.FlaschenTuev, newEntry.MaskenReinigen, newEntry.LaPruefen, newEntry.LaReinigen, newEntry.GeraeteReinigen, newEntry.Bemerkung)
	newID, _ := result.LastInsertId()
	ExecuteDDL("INSERT INTO atemschutzpflegestelle_nr (DATA_NO, FLASCHEN_FUELLEN_NR, FLASCHEN_TUEV_NR, MASKEN_PRUEFEN_NR, MASKEN_REINIGEN_NR, LA_PRUEFEN_NR, LA_REINIGEN_NR, GERAETE_PRUEFEN_NR, GERAETE_REINIGEN_NR) VALUES(?,?,?,?,?,?,?,?,?)", newID, newEntry.FlaschenFuellenNr, newEntry.FlaschenTuevNr, newEntry.MaskenPruefenNr, newEntry.MaskenReinigenNr, newEntry.LaPruefenNr, newEntry.LaReinigenNr, newEntry.GeraetePruefenNr, newEntry.GeraeteReinigenNr)
}

func SaveEntry(newEntry EntryObj) {
	ExecuteDDL("UPDATE atemschutzpflegestelle_data SET FLASCHEN_FUELLEN = ?, MASKEN_PRUEFEN = ?, GERAETE_PRUEFEN = ?, PERS_NO = ?, TIME_WORK = ?, DATE_WORK = ?, FLASCHEN_TUEV = ?, MASKEN_REINIGEN = ?, LA_PRUEFEN = ?, LA_REINIGEN = ?, GERAETE_REINIGEN = ?, BEMERKUNG = ?, STATE = 'saved' where DATA_NO = ?", newEntry.FlaschenFuellen, newEntry.MaskenPruefen, newEntry.GeraetePruefen, newEntry.User, newEntry.TimeWork, newEntry.DateWork, newEntry.FlaschenTuev, newEntry.MaskenReinigen, newEntry.LaPruefen, newEntry.LaReinigen, newEntry.GeraeteReinigen, newEntry.Bemerkung, newEntry.EditId)
	ExecuteDDL("UPDATE atemschutzpflegestelle_nr set FLASCHEN_FUELLEN_NR = ?, FLASCHEN_TUEV_NR = ?, MASKEN_PRUEFEN_NR = ?, MASKEN_REINIGEN_NR = ?, LA_PRUEFEN_NR = ?, LA_REINIGEN_NR = ?, GERAETE_PRUEFEN_NR = ?, GERAETE_REINIGEN_NR = ? WHERE DATA_NO = ?", newEntry.FlaschenFuellenNr, newEntry.FlaschenTuevNr, newEntry.MaskenPruefenNr, newEntry.MaskenReinigenNr, newEntry.LaPruefenNr, newEntry.LaReinigenNr, newEntry.GeraetePruefenNr, newEntry.GeraeteReinigenNr, newEntry.EditId)
}

func CreateEntryProposal(newEntry EntryObj) {
	result := ExecuteDDL("INSERT INTO atemschutzpflegestelle_data (CITY_NO, FLASCHEN_FUELLEN, MASKEN_PRUEFEN, GERAETE_PRUEFEN, PERS_NO, TIME_WORK, DATE_WORK, FLASCHEN_TUEV, MASKEN_REINIGEN, LA_PRUEFEN, LA_REINIGEN, GERAETE_REINIGEN, BEMERKUNG, STATE) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?, ?)", newEntry.City, newEntry.FlaschenFuellen, newEntry.MaskenPruefen, newEntry.GeraetePruefen, newEntry.User, newEntry.TimeWork, newEntry.DateWork, newEntry.FlaschenTuev, newEntry.MaskenReinigen, newEntry.LaPruefen, newEntry.LaReinigen, newEntry.GeraeteReinigen, newEntry.Bemerkung, "open")
	newID, _ := result.LastInsertId()
	ExecuteDDL("INSERT INTO atemschutzpflegestelle_nr (DATA_NO, FLASCHEN_FUELLEN_NR, FLASCHEN_TUEV_NR, MASKEN_PRUEFEN_NR, MASKEN_REINIGEN_NR, LA_PRUEFEN_NR, LA_REINIGEN_NR, GERAETE_PRUEFEN_NR, GERAETE_REINIGEN_NR) VALUES(?,?,?,?,?,?,?,?,?)", newID, newEntry.FlaschenFuellenNr, newEntry.FlaschenTuevNr, newEntry.MaskenPruefenNr, newEntry.MaskenReinigenNr, newEntry.LaPruefenNr, newEntry.LaReinigenNr, newEntry.GeraetePruefenNr, newEntry.GeraeteReinigenNr)
}

func DeleteEntry(removeEntry EntryObj) {
	ExecuteDDL("DELETE FROM atemschutzpflegestelle_data WHERE DATA_NO = ?", removeEntry.DataNo)
	ExecuteDDL("DELETE FROM atemschutzpflegestelle_nr WHERE DATA_NO = ?", removeEntry.DataNo)
}

func UpdateEntry(updateEntryObj EntryObj) {
	ExecuteDDL("UPDATE atemschutzpflegestelle_data SET FLASCHEN_FUELLEN = ?, MASKEN_PRUEFEN = ?, GERAETE_PRUEFEN = ?, TIME_WORK = ?, FLASCHEN_TUEV = ?, MASKEN_REINIGEN = ?, LA_PRUEFEN = ?, LA_REINIGEN = ?, GERAETE_REINIGEN = ?, BEMERKUNG = ? where DATA_NO = ?", updateEntryObj.FlaschenFuellen, updateEntryObj.MaskenPruefen, updateEntryObj.GeraeteReinigen, updateEntryObj.TimeWork, updateEntryObj.FlaschenTuev, updateEntryObj.MaskenReinigen, updateEntryObj.LaPruefen, updateEntryObj.LaReinigen, updateEntryObj.GeraeteReinigen, updateEntryObj.Bemerkung, updateEntryObj.DataNo)
}

func CreateExtraEntry(updateEntryObj EntryObj) {
	ExecuteDDL("INSERT INTO atemschutzpflegestelle_data (CITY_NO, FLASCHEN_FUELLEN, MASKEN_PRUEFEN, GERAETE_PRUEFEN, PERS_NO, TIME_WORK, DATE_WORK, FLASCHEN_TUEV, MASKEN_REINIGEN, LA_PRUEFEN, LA_REINIGEN, GERAETE_REINIGEN, BEMERKUNG) VALUES(0,0,0,0,?,?,?,0,0,0,0,0,?)", updateEntryObj.User, updateEntryObj.TimeWork, updateEntryObj.DateWork, updateEntryObj.Bemerkung)
}
