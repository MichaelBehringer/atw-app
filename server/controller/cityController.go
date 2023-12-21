package controller

import (
	. "ffAPI/models"

	_ "github.com/go-sql-driver/mysql"
)

func GetCities() []City {
	results := ExecuteSQL("select CITY_NO, CITY_NAME from atemschutzpflegestelle_cities where IS_ACTIVE=1 order by CITY_NAME")
	cities := []City{}
	for results.Next() {
		var city City
		results.Scan(&city.CityNo, &city.Name)
		cities = append(cities, city)
	}
	return cities
}

func GetYearCityResults(cityNo int, year int) []YearCityResult {
	statement := `SELECT
	p.LASTNAME,
	d.FLASCHEN_FUELLEN,
	d.FLASCHEN_TUEV,
	d.MASKEN_PRUEFEN,
	d.MASKEN_REINIGEN,
	d.LA_PRUEFEN,
	d.LA_REINIGEN,
	d.GERAETE_PRUEFEN,
	d.GERAETE_REINIGEN,
	DATE_FORMAT(d.DATE_WORK, '%d.%m.%Y')
FROM
	atemschutzpflegestelle_data d
inner join atemschutzpflegestelle_cities c on
	d.CITY_NO = c.CITY_NO
inner join pers p on
	d.PERS_NO = p.PERS_NO
WHERE
	d.CITY_NO = ?
	and YEAR(d.DATE_WORK) = ?
	and d.state = 'saved'`

	results := ExecuteSQL(statement, cityNo, year)
	yearCityResults := []YearCityResult{}
	for results.Next() {
		var yearCityResult YearCityResult
		err := results.Scan(&yearCityResult.Lastname, &yearCityResult.FlaschenFuellen, &yearCityResult.FlaschenTuev, &yearCityResult.MaskenPruefen, &yearCityResult.MaskenReinigen, &yearCityResult.LaPruefen, &yearCityResult.LaReinigen, &yearCityResult.GeraetePruefen, &yearCityResult.GeraeteReinigen, &yearCityResult.DateWork)
		if err != nil {
			panic(err.Error())
		}
		yearCityResults = append(yearCityResults, yearCityResult)
	}
	return yearCityResults
}

func GetYearCityResultsSum(cityNo int, year int) YearCityResult {
	statement := `SELECT
	SUM(d.FLASCHEN_FUELLEN),
	SUM(d.FLASCHEN_TUEV),
	SUM(d.MASKEN_PRUEFEN),
	SUM(d.MASKEN_REINIGEN),
	SUM(d.LA_PRUEFEN),
	SUM(d.LA_REINIGEN),
	SUM(d.GERAETE_PRUEFEN),
	SUM(d.GERAETE_REINIGEN)
FROM
	atemschutzpflegestelle_data d
WHERE
	d.CITY_NO = ?
	and YEAR(d.DATE_WORK) = ?
	and d.state = 'saved'`

	var yearCityResultSum YearCityResult
	ExecuteSQLRow(statement, cityNo, year).Scan(&yearCityResultSum.FlaschenFuellen, &yearCityResultSum.FlaschenTuev, &yearCityResultSum.MaskenPruefen, &yearCityResultSum.MaskenReinigen, &yearCityResultSum.LaPruefen, &yearCityResultSum.LaReinigen, &yearCityResultSum.GeraetePruefen, &yearCityResultSum.GeraeteReinigen)

	return yearCityResultSum
}

func GetCityname(cityNo int) string {
	statement := "select ac.CITY_NAME from atemschutzpflegestelle_cities ac where ac.CITY_NO = ?"
	var cityName string
	ExecuteSQLRow(statement, cityNo).Scan(&cityName)
	return cityName
}

func UpdateCity(city UpdateCityObj) {
	ExecuteDDL("UPDATE atemschutzpflegestelle_cities SET CITY_NAME = ? where CITY_NO = ?", city.Name, city.CityNo)
}

func DeleteCity(city City) {
	ExecuteDDL("UPDATE atemschutzpflegestelle_cities SET IS_ACTIVE = 0 where CITY_NO = ?", city.CityNo)
}
