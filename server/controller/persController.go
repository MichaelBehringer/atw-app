package controller

import (
	. "ffAPI/models"

	_ "github.com/go-sql-driver/mysql"
)

func GetPersons() []Person {
	results := ExecuteSQL("select PERS_NO, FIRSTNAME, LASTNAME from pers where IS_ACTIVE=1 order by LASTNAME")
	persons := []Person{}
	for results.Next() {
		var pers Person
		results.Scan(&pers.PersNo, &pers.Firstname, &pers.Lastname)
		persons = append(persons, pers)
	}
	return persons
}

func GetPersonsExtra() []PersonExtra {
	results := ExecuteSQL("select p.PERS_NO, p.FIRSTNAME, p.LASTNAME, p.USERNAME, f.FUNCTION_NO, f.FUNCTION_NAME, ac.CITY_NO, ac.CITY_NAME from pers p inner join atemschutzpflegestelle_cities ac on p.city_no = ac.CITY_NO inner join function f on p.FUNCTION_NO = f.FUNCTION_NO where p.IS_ACTIVE=1 order by p.LASTNAME")
	persons := []PersonExtra{}
	for results.Next() {
		var pers PersonExtra
		results.Scan(&pers.PersNo, &pers.Firstname, &pers.Lastname, &pers.Username, &pers.FunctionNo, &pers.FunctionName, &pers.CityNo, &pers.CityName)
		persons = append(persons, pers)
	}
	return persons
}

func GetFunctions() []Function {
	results := ExecuteSQL("select FUNCTION_NO, FUNCTION_NAME from function order by FUNCTION_NO")
	functions := []Function{}
	for results.Next() {
		var function Function
		results.Scan(&function.FunctionNo, &function.FunctionName)
		functions = append(functions, function)
	}
	return functions
}

func doesUsernameExists(person Person) bool {
	var doesExist bool
	ExecuteSQLRow("SELECT COUNT(*) FROM pers WHERE USERNAME=?", person.Username).Scan(&doesExist)
	return doesExist
}

func CreateUser(person Person) bool {
	if doesUsernameExists(person) {
		return false
	}
	ExecuteDDL("INSERT INTO pers (FIRSTNAME, LASTNAME, USERNAME, PASSWORD, FUNCTION_NO, CITY_NO, IS_ACTIVE) VALUES(?,?,?,?,?,?,1)", person.Firstname, person.Lastname, person.Username, person.Password, person.FunctionNo, person.CityNo)
	return true
}

func UpdateUser(person Person) bool {
	if doesUsernameExists(person) {
		return false
	}
	ExecuteDDL("UPDATE pers SET FIRSTNAME = ?, LASTNAME = ?, FUNCTION_NO = ?, CITY_NO = ?, USERNAME = ? where PERS_NO = ?", person.Firstname, person.Lastname, person.FunctionNo, person.CityNo, person.Username, person.PersNoKey)
	return true
}

func DeleteUser(person PersonDelete) {
	ExecuteDDL("UPDATE pers SET IS_ACTIVE = 0 where PERS_NO = ?", person.PersNo)
}
