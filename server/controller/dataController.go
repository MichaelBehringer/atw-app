package controller

import (
	"database/sql"
	. "ffAPI/models"
	"fmt"
	"slices"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

func GetSearchResult(searchParam SearchParam) []SearchResult {
	results := ExecuteSQL("select d.DATA_NO , ifnull(ac.CITY_NAME, ''), DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y'), d.TIME_WORK , d.FLASCHEN_FUELLEN , d.FLASCHEN_TUEV , d.MASKEN_REINIGEN , d.MASKEN_PRUEFEN , d.LA_REINIGEN , d.LA_PRUEFEN , d.GERAETE_PRUEFEN , d.GERAETE_REINIGEN, d.BEMERKUNG from atemschutzpflegestelle_data d left join atemschutzpflegestelle_cities ac on d.CITY_NO=ac.CITY_NO where PERS_NO = ? and d.state = 'saved' order by d.DATA_NO desc", searchParam.PersNo)
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
	ExecuteSQLRow("select d.DATA_NO , d.CITY_NO, DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y'), d.TIME_WORK , d.FLASCHEN_FUELLEN , d.FLASCHEN_TUEV , d.MASKEN_REINIGEN , d.MASKEN_PRUEFEN , d.LA_REINIGEN , d.LA_PRUEFEN , d.GERAETE_PRUEFEN , d.GERAETE_REINIGEN, d.BEMERKUNG, n.FLASCHEN_FUELLEN_NR, n.FLASCHEN_TUEV_NR, n.MASKEN_PRUEFEN_NR, n.MASKEN_REINIGEN_NR, n.LA_PRUEFEN_NR, n.LA_REINIGEN_NR, n.GERAETE_PRUEFEN_NR, n.GERAETE_REINIGEN_NR from atemschutzpflegestelle_data d inner join atemschutzpflegestelle_nr n on d.DATA_NO = n.DATA_NO where d.DATA_NO = ? ", id).Scan(
		&entry.DataNo, &entry.City, &entry.DateWork, &entry.TimeWork, &entry.FlaschenFuellen, &entry.FlaschenTuev, &entry.MaskenReinigen, &entry.MaskenPruefen, &entry.LaReinigen, &entry.LaPruefen, &entry.GeraetePruefen, &entry.GeraeteReinigen, &entry.Bemerkung, &entry.FlaschenFuellenNr, &entry.FlaschenTuevNr, &entry.MaskenPruefenNr, &entry.MaskenReinigenNr, &entry.LaPruefenNr, &entry.LaReinigenNr, &entry.GeraetePruefenNr, &entry.GeraeteReinigenNr)
	return entry
}

func GetSearchResultOpen(searchParam SearchParamExtra) []SearchResultOpen {
	var results *sql.Rows
	if searchParam.IsExternal {
		results = ExecuteSQL("select d.DATA_NO, ac.CITY_NAME, d.CITY_NO, DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y'), d.state from atemschutzpflegestelle_data d inner join atemschutzpflegestelle_cities ac on d.CITY_NO=ac.CITY_NO inner join pers p on d.CITY_NO=p.CITY_NO where p.PERS_NO=? order by d.STATE asc, d.DATA_NO desc", searchParam.PersNo)
	} else {
		results = ExecuteSQL("select d.DATA_NO, ac.CITY_NAME, d.CITY_NO, DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y'), d.state from atemschutzpflegestelle_data d inner join atemschutzpflegestelle_cities ac on d.CITY_NO=ac.CITY_NO where d.state='open' order by d.STATE asc, d.DATA_NO desc")
	}
	searchResults := []SearchResultOpen{}
	for results.Next() {
		var searchResult SearchResultOpen
		results.Scan(&searchResult.DataNo, &searchResult.City, &searchResult.CityNo, &searchResult.DateWork, &searchResult.State)
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
	ExecuteDDL("UPDATE atemschutzpflegestelle_data SET FLASCHEN_FUELLEN = ?, MASKEN_PRUEFEN = ?, GERAETE_PRUEFEN = ?, PERS_NO = ?, TIME_WORK = ?, DATE_WORK = ?, FLASCHEN_TUEV = ?, MASKEN_REINIGEN = ?, LA_PRUEFEN = ?, LA_REINIGEN = ?, GERAETE_REINIGEN = ?, BEMERKUNG = ?, STATE = 'saved' where DATA_NO = ?", newEntry.FlaschenFuellen, newEntry.MaskenPruefen, newEntry.GeraetePruefen, newEntry.User, newEntry.TimeWork, newEntry.DateWork, newEntry.FlaschenTuev, newEntry.MaskenReinigen, newEntry.LaPruefen, newEntry.LaReinigen, newEntry.GeraeteReinigen, newEntry.Bemerkung)
	ExecuteDDL("UPDATE atemschutzpflegestelle_nr set FLASCHEN_FUELLEN_NR = ?, FLASCHEN_TUEV_NR = ?, MASKEN_PRUEFEN_NR = ?, MASKEN_REINIGEN_NR = ?, LA_PRUEFEN_NR = ?, LA_REINIGEN_NR = ?, GERAETE_PRUEFEN_NR = ?, GERAETE_REINIGEN_NR = ? WHERE DATA_NO = ?", newEntry.FlaschenFuellenNr, newEntry.FlaschenTuevNr, newEntry.MaskenPruefenNr, newEntry.MaskenReinigenNr, newEntry.LaPruefenNr, newEntry.LaReinigenNr, newEntry.GeraetePruefenNr, newEntry.GeraeteReinigenNr)
}

func CreateEntryProposal(newEntry EntryObj) {
	result := ExecuteDDL("INSERT INTO atemschutzpflegestelle_data (CITY_NO, FLASCHEN_FUELLEN, MASKEN_PRUEFEN, GERAETE_PRUEFEN, PERS_NO, TIME_WORK, DATE_WORK, FLASCHEN_TUEV, MASKEN_REINIGEN, LA_PRUEFEN, LA_REINIGEN, GERAETE_REINIGEN, BEMERKUNG, STATE) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?, ?)", newEntry.City, newEntry.FlaschenFuellen, newEntry.MaskenPruefen, newEntry.GeraetePruefen, newEntry.User, newEntry.TimeWork, newEntry.DateWork, newEntry.FlaschenTuev, newEntry.MaskenReinigen, newEntry.LaPruefen, newEntry.LaReinigen, newEntry.GeraeteReinigen, newEntry.Bemerkung, "open")
	newID, _ := result.LastInsertId()
	ExecuteDDL("INSERT INTO atemschutzpflegestelle_nr (DATA_NO, FLASCHEN_FUELLEN_NR, FLASCHEN_TUEV_NR, MASKEN_PRUEFEN_NR, MASKEN_REINIGEN_NR, LA_PRUEFEN_NR, LA_REINIGEN_NR, GERAETE_PRUEFEN_NR, GERAETE_REINIGEN_NR) VALUES(?,?,?,?,?,?,?,?,?)", newID, newEntry.FlaschenFuellenNr, newEntry.FlaschenTuevNr, newEntry.MaskenPruefenNr, newEntry.MaskenReinigenNr, newEntry.LaPruefenNr, newEntry.LaReinigenNr, newEntry.GeraetePruefenNr, newEntry.GeraeteReinigenNr)

	ntfyNoticeAnlieferung("Info_FF_AGW", GetCityname(newEntry.City), createNtfyLine(newEntry.FlaschenFuellen, "Flaschen füllen")+createNtfyLine(newEntry.FlaschenTuev, "Flaschen TÜV")+createNtfyLine(newEntry.MaskenPruefen, "Masken prüfen")+createNtfyLine(newEntry.MaskenReinigen, "Masken reinigen")+createNtfyLine(newEntry.LaPruefen, "LA prüfen")+createNtfyLine(newEntry.LaReinigen, "LA reinigen")+createNtfyLine(newEntry.GeraetePruefen, "Geräte prüfen")+createNtfyLine(newEntry.GeraeteReinigen, "Geräte reinigen"))
}

func DeleteEntry(removeEntry EntryObj) {
	ExecuteDDL("DELETE FROM atemschutzpflegestelle_data WHERE DATA_NO = ?", removeEntry.DataNo)
	ExecuteDDL("DELETE FROM atemschutzpflegestelle_nr WHERE DATA_NO = ?", removeEntry.DataNo)
}

func UpdateEntry(updateEntryObj EntryObj) {
	ExecuteDDL("UPDATE atemschutzpflegestelle_data SET FLASCHEN_FUELLEN = ?, MASKEN_PRUEFEN = ?, GERAETE_PRUEFEN = ?, TIME_WORK = ?, FLASCHEN_TUEV = ?, MASKEN_REINIGEN = ?, LA_PRUEFEN = ?, LA_REINIGEN = ?, GERAETE_REINIGEN = ?, BEMERKUNG = ? where DATA_NO = ?", updateEntryObj.FlaschenFuellen, updateEntryObj.MaskenPruefen, updateEntryObj.GeraeteReinigen, updateEntryObj.TimeWork, updateEntryObj.FlaschenTuev, updateEntryObj.MaskenReinigen, updateEntryObj.LaPruefen, updateEntryObj.LaReinigen, updateEntryObj.GeraeteReinigen, updateEntryObj.Bemerkung, updateEntryObj.DataNo)
}

func UpdateEntryTree(updateEntryObjTree EntryObjTree) {
	statement := "select p.USERNAME from atemschutzpflegestelle_data d inner join pers p on d.PERS_NO = p.PERS_NO where d.DATA_NO = ?"
	var ntfyTopicName string
	ExecuteSQLRow(statement, updateEntryObjTree.DataNo).Scan(&ntfyTopicName)

	statement = "select LASTNAME from pers where PERS_NO = ?"
	var ntfyEditorName string
	ExecuteSQLRow(statement, updateEntryObjTree.User).Scan(&ntfyEditorName)

	if slices.Contains(updateEntryObjTree.WorkingPoints, "root") {
		ExecuteDDL("UPDATE atemschutzpflegestelle_data SET STATE = 'saved', TIME_WORK = ?, DATE_WORK = ?, PERS_NO = ? where DATA_NO = ?", updateEntryObjTree.TimeWork, updateEntryObjTree.DateWork, updateEntryObjTree.User, updateEntryObjTree.DataNo)
		ntfyNoticeBearbeitung(ntfyTopicName, "Auftrag komplett abgearbeitet", "Bearbeiter: "+ntfyEditorName+"\n Auftragsnummer: #"+fmt.Sprint(updateEntryObjTree.DataNo))
	} else {
		newEntry := NrObjList{}
		//var newEntry EntryObj
		for _, element := range updateEntryObjTree.WorkingPoints {
			if strings.Contains(element, "#") {
				splitElement := strings.Split(element, "#")
				elementKey := splitElement[0]
				elementNr := splitElement[1]

				var column string

				switch elementKey {
				case "ff":
					newEntry.FlaschenFuellenNr = append(newEntry.FlaschenFuellenNr, elementNr)
					column = "FLASCHEN_FUELLEN"
				case "ft":
					newEntry.FlaschenTuevNr = append(newEntry.FlaschenTuevNr, elementNr)
					column = "FLASCHEN_TUEV"
				case "mp":
					newEntry.MaskenPruefenNr = append(newEntry.MaskenPruefenNr, elementNr)
					column = "MASKEN_PRUEFEN"
				case "mr":
					newEntry.MaskenReinigenNr = append(newEntry.MaskenReinigenNr, elementNr)
					column = "MASKEN_REINIGEN"
				case "lp":
					newEntry.LaPruefenNr = append(newEntry.LaPruefenNr, elementNr)
					column = "LA_PRUEFEN"
				case "lr":
					newEntry.LaReinigenNr = append(newEntry.LaReinigenNr, elementNr)
					column = "LA_REINIGEN"
				case "gp":
					newEntry.GeraetePruefenNr = append(newEntry.GeraetePruefenNr, elementNr)
					column = "GERAETE_PRUEFEN"
				case "gr":
					newEntry.GeraeteReinigenNr = append(newEntry.GeraeteReinigenNr, elementNr)
					column = "GERAETE_REINIGEN"
				}

				var nrList string
				columnNr := column + "_NR"
				ExecuteSQLRow("SELECT "+columnNr+" FROM atemschutzpflegestelle_nr WHERE DATA_NO=?", updateEntryObjTree.DataNo).Scan(&nrList)
				stringArray := strings.Split(nrList, ",")
				var filteredArray []string

				for _, v := range stringArray {
					if v != elementNr {
						filteredArray = append(filteredArray, v)
					}
				}
				ExecuteSQLRow("UPDATE atemschutzpflegestelle_nr set "+columnNr+"=? WHERE DATA_NO=?", strings.Join(filteredArray, ","), updateEntryObjTree.DataNo)
				ExecuteSQLRow("UPDATE atemschutzpflegestelle_data set "+column+"=? WHERE DATA_NO=?", len(filteredArray), updateEntryObjTree.DataNo)
			}
		}
		CreateEntry(EntryObj{City: updateEntryObjTree.City, User: updateEntryObjTree.User, DateWork: updateEntryObjTree.DateWork, TimeWork: updateEntryObjTree.TimeWork, FlaschenFuellen: len(newEntry.FlaschenFuellenNr), FlaschenTuev: len(newEntry.FlaschenTuevNr), MaskenReinigen: len(newEntry.MaskenReinigenNr), MaskenPruefen: len(newEntry.MaskenPruefenNr), LaReinigen: len(newEntry.LaReinigenNr), LaPruefen: len(newEntry.LaPruefenNr), GeraetePruefen: len(newEntry.GeraetePruefenNr), GeraeteReinigen: len(newEntry.GeraeteReinigenNr), FlaschenFuellenNr: strings.Join(newEntry.FlaschenFuellenNr, ","), FlaschenTuevNr: strings.Join(newEntry.FlaschenTuevNr, ","), MaskenReinigenNr: strings.Join(newEntry.MaskenReinigenNr, ","), MaskenPruefenNr: strings.Join(newEntry.MaskenPruefenNr, ","), LaReinigenNr: strings.Join(newEntry.LaReinigenNr, ","), LaPruefenNr: strings.Join(newEntry.LaPruefenNr, ","), GeraetePruefenNr: strings.Join(newEntry.GeraetePruefenNr, ","), GeraeteReinigenNr: strings.Join(newEntry.GeraeteReinigenNr, ",")})

		ntfyNoticeBearbeitung(ntfyTopicName, "Auftrag teilweise abgearbeitet", "Bearbeiter: "+ntfyEditorName+"\n Auftragsnummer: #"+fmt.Sprint(updateEntryObjTree.DataNo)+"\nBestandteile:"+createNtfyLine(len(newEntry.FlaschenFuellenNr), "Flaschen füllen")+createNtfyLine(len(newEntry.FlaschenTuevNr), "Flaschen TÜV")+createNtfyLine(len(newEntry.MaskenPruefenNr), "Masken prüfen")+createNtfyLine(len(newEntry.MaskenReinigenNr), "Masken reinigen")+createNtfyLine(len(newEntry.LaPruefenNr), "LA prüfen")+createNtfyLine(len(newEntry.LaReinigenNr), "LA reinigen")+createNtfyLine(len(newEntry.GeraetePruefenNr), "Geräte prüfen")+createNtfyLine(len(newEntry.GeraeteReinigenNr), "Geräte reinigen"))
	}
}

func CreateExtraEntry(updateEntryObj EntryObj) {
	ExecuteDDL("INSERT INTO atemschutzpflegestelle_data (CITY_NO, FLASCHEN_FUELLEN, MASKEN_PRUEFEN, GERAETE_PRUEFEN, PERS_NO, TIME_WORK, DATE_WORK, FLASCHEN_TUEV, MASKEN_REINIGEN, LA_PRUEFEN, LA_REINIGEN, GERAETE_REINIGEN, BEMERKUNG) VALUES(0,0,0,0,?,?,?,0,0,0,0,0,?)", updateEntryObj.User, updateEntryObj.TimeWork, updateEntryObj.DateWork, updateEntryObj.Bemerkung)
}

func createNtfyLine(amounth int, name string) string {
	if amounth > 0 {
		return fmt.Sprintf("\n- %d %s", amounth, name)
	}
	return ""
}
