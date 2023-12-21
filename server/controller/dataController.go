package controller

import (
	"database/sql"
	. "ffAPI/models"
	"strings"

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

func GetSearchResultOpen(searchParam SearchParamExtra) []SearchResultOpen {
	var results *sql.Rows
	if searchParam.IsExternal {
		results = ExecuteSQL("select d.DATA_NO, ac.CITY_NAME, DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y') from atemschutzpflegestelle_data d inner join atemschutzpflegestelle_cities ac on d.CITY_NO=ac.CITY_NO inner join pers p on d.CITY_NO=p.CITY_NO where d.state='open' and p.PERS_NO=? order by d.DATA_NO desc", searchParam.PersNo)
	} else {
		results = ExecuteSQL("select d.DATA_NO, ac.CITY_NAME, DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y') from atemschutzpflegestelle_data d inner join atemschutzpflegestelle_cities ac on d.CITY_NO=ac.CITY_NO where d.state='open' order by d.DATA_NO desc")
	}
	searchResults := []SearchResultOpen{}
	for results.Next() {
		var searchResult SearchResultOpen
		results.Scan(&searchResult.DataNo, &searchResult.City, &searchResult.DateWork)
		searchResults = append(searchResults, searchResult)
	}
	return searchResults
}

func CreateEntry(newEntry EntryObj) {
	result := ExecuteDDL("INSERT INTO atemschutzpflegestelle_data (CITY_NO, FLASCHEN_FUELLEN, MASKEN_PRUEFEN, GERAETE_PRUEFEN, PERS_NO, TIME_WORK, DATE_WORK, FLASCHEN_TUEV, MASKEN_REINIGEN, LA_PRUEFEN, LA_REINIGEN, GERAETE_REINIGEN, BEMERKUNG) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)", newEntry.City, newEntry.FlaschenFuellen, newEntry.MaskenPruefen, newEntry.GeraetePruefen, newEntry.User, newEntry.TimeWork, strings.Split(newEntry.DateWork, "T")[0], newEntry.FlaschenTuev, newEntry.MaskenReinigen, newEntry.LaPruefen, newEntry.LaReinigen, newEntry.GeraeteReinigen, newEntry.Bemerkung)
	newID, _ := result.LastInsertId()
	ExecuteDDL("INSERT INTO atemschutzpflegestelle_nr (DATA_NO, FLASCHEN_FUELLEN_NR, FLASCHEN_TUEV_NR, MASKEN_PRUEFEN_NR, MASKEN_REINIGEN_NR, LA_PRUEFEN_NR, LA_REINIGEN_NR, GERAETE_PRUEFEN_NR, GERAETE_REINIGEN_NR) VALUES(?,?,?,?,?,?,?,?,?)", newID, newEntry.FlaschenFuellenNr, newEntry.FlaschenTuevNr, newEntry.MaskenPruefenNr, newEntry.MaskenReinigenNr, newEntry.LaPruefenNr, newEntry.LaReinigenNr, newEntry.GeraetePruefenNr, newEntry.GeraetePruefenNr)
}

func DeleteEntry(removeEntry EntryObj) {
	ExecuteDDL("DELETE FROM atemschutzpflegestelle_data WHERE DATA_NO = ?", removeEntry.DataNo)
	ExecuteDDL("DELETE FROM atemschutzpflegestelle_nr WHERE DATA_NO = ?", removeEntry.DataNo)
}

func UpdateEntry(updateEntryObj EntryObj) {
	ExecuteDDL("UPDATE atemschutzpflegestelle_data SET FLASCHEN_FUELLEN = ?, MASKEN_PRUEFEN = ?, GERAETE_PRUEFEN = ?, TIME_WORK = ?, FLASCHEN_TUEV = ?, MASKEN_REINIGEN = ?, LA_PRUEFEN = ?, LA_REINIGEN = ?, GERAETE_REINIGEN = ?, BEMERKUNG = ? where DATA_NO = ?", updateEntryObj.FlaschenFuellen, updateEntryObj.MaskenPruefen, updateEntryObj.GeraeteReinigen, updateEntryObj.TimeWork, updateEntryObj.FlaschenTuev, updateEntryObj.MaskenReinigen, updateEntryObj.LaPruefen, updateEntryObj.LaReinigen, updateEntryObj.GeraeteReinigen, updateEntryObj.Bemerkung, updateEntryObj.DataNo)
}

func CreateExtraEntry(updateEntryObj EntryObj) {
	ExecuteDDL("INSERT INTO atemschutzpflegestelle_data (CITY_NO, FLASCHEN_FUELLEN, MASKEN_PRUEFEN, GERAETE_PRUEFEN, PERS_NO, TIME_WORK, DATE_WORK, FLASCHEN_TUEV, MASKEN_REINIGEN, LA_PRUEFEN, LA_REINIGEN, GERAETE_REINIGEN, BEMERKUNG) VALUES(0,0,0,0,?,?,?,0,0,0,0,0,?)", updateEntryObj.User, updateEntryObj.TimeWork, strings.Split(updateEntryObj.DateWork, "T")[0], updateEntryObj.Bemerkung)
}
