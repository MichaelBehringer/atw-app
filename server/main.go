package main

import (
	. "ffAPI/controller"
	. "ffAPI/middleware"
	. "ffAPI/models"
	"fmt"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func main() {
	InitDB()
	defer CloseDB()

	router := gin.Default()
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowHeaders = []string{"Content-Type", "Content-Length", "Accept-Encoding", "Authorization", "Cache-Control"}

	router.Use(static.Serve("/", static.LocalFile("ressources/build", true)))

	router.Use(cors.New(config))
	router.POST("/login", login)
	router.GET("/checkToken", AuthUser(), checkToken)

	router.GET("/pers", AuthUser(), pers)
	router.GET("/persExtra", AuthUser(), persExtra)
	router.GET("/cities", AuthUser(), cities)
	router.GET("/function", AuthUser(), function)
	router.POST("/search", AuthUser(), search)

	router.PUT("/createEntry", AuthUser(), createEntry)
	router.DELETE("/deleteEntry", AuthUser(), deleteEntry)
	router.POST("/updateEntry", AuthUser(), updateEntry)
	router.PUT("/createExtraEntry", AuthUser(), createExtraEntry)

	router.PUT("/createUser", AuthUser(), createUser)
	router.POST("/updateUser", AuthUser(), updateUser)
	router.DELETE("/deleteUser", AuthUser(), deleteUser)

	router.POST("/updateCity", AuthUser(), updateCity)
	router.DELETE("/deleteCity", AuthUser(), deleteCity)

	router.GET("/file", file)

	router.Run(":8080")
}

func login(c *gin.Context) {
	var login Login
	c.BindJSON(&login)
	retJWT := DoLogin(login, c)
	c.IndentedJSON(http.StatusOK, retJWT)
}

func checkToken(c *gin.Context) {
	tokenRes := CheckToken(c)
	c.IndentedJSON(http.StatusOK, tokenRes)
}

func pers(c *gin.Context) {
	persons := GetPersons()
	c.IndentedJSON(http.StatusOK, persons)
}

func persExtra(c *gin.Context) {
	persons := GetPersonsExtra()
	c.IndentedJSON(http.StatusOK, persons)
}

func function(c *gin.Context) {
	functions := GetFunctions()
	c.IndentedJSON(http.StatusOK, functions)
}

func cities(c *gin.Context) {
	cities := GetCities()
	c.IndentedJSON(http.StatusOK, cities)
}

func search(c *gin.Context) {
	var searchParam SearchParam
	c.BindJSON(&searchParam)
	searchResult := GetSearchResult(searchParam)
	c.IndentedJSON(http.StatusOK, searchResult)
}

func createEntry(c *gin.Context) {
	var newEntry EntryObj
	c.BindJSON(&newEntry)
	// fmt.Println(err.Error())
	// fmt.Println(strings.Split(newEntry.DateWork, "T")[0])
	// fmt.Println(newEntry.FlaschenFuellen)
	CreateEntry(newEntry)
	c.Status(http.StatusOK)
	// c.IndentedJSON(http.StatusOK, res)
	// tokenRes := CheckToken(c)
	// c.IndentedJSON(http.StatusOK, tokenRes)
}

func deleteEntry(c *gin.Context) {
	var removeEntry EntryObj
	c.BindJSON(&removeEntry)
	DeleteEntry(removeEntry)
	c.Status(http.StatusOK)
}

func updateEntry(c *gin.Context) {
	var updateEntryObj EntryObj
	c.BindJSON(&updateEntryObj)
	UpdateEntry(updateEntryObj)
	c.Status(http.StatusOK)
}

func createExtraEntry(c *gin.Context) {
	var extraEntry EntryObj
	c.BindJSON(&extraEntry)
	CreateExtraEntry(extraEntry)
	c.Status(http.StatusOK)
}

func createUser(c *gin.Context) {
	var person Person
	c.BindJSON(&person)
	success := CreateUser(person)
	if success {
		c.Status(http.StatusOK)
	} else {
		c.Status(http.StatusBadRequest)
	}
}

func updateUser(c *gin.Context) {
	var person Person
	c.BindJSON(&person)
	success := UpdateUser(person)
	if success {
		c.Status(http.StatusOK)
	} else {
		c.Status(http.StatusBadRequest)
	}
}

func deleteUser(c *gin.Context) {
	var personDelete PersonDelete
	c.BindJSON(&personDelete)
	DeleteUser(personDelete)
	c.Status(http.StatusOK)
}

func updateCity(c *gin.Context) {
	var city UpdateCityObj
	c.BindJSON(&city)
	UpdateCity(city)
	c.Status(http.StatusOK)
}

func deleteCity(c *gin.Context) {
	var city City
	c.BindJSON(&city)
	DeleteCity(city)
	c.Status(http.StatusOK)
}

func file(c *gin.Context) {
	fmt.Println("im filed drinenn")
	numbers := [4]int{1, 2, 3, 4}
	pathZip, fileZip := CreateCityPDFs(numbers[:], 2022)
	c.Writer.Header().Set("Content-Disposition", "attachment; filename="+fileZip)
	c.Header("Content-Language", fileZip)
	c.File(pathZip + fileZip)
}
