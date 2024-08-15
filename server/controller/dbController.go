package controller

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB
var err error

func InitDB() {
	// db, err = sql.Open("mysql", "dbadmin:raspberry@tcp(ffwemding.dynv6.net:3306)/ffw")
	db, err = sql.Open("mysql", "ffwadmin:gnidmewff@tcp(host.docker.internal:3306)/ffw")
	if err != nil {
		panic(err.Error())
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
