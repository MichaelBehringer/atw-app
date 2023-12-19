package models

type Person struct {
	PersNoKey  int    `json:"key"`
	PersNo     int    `json:"persNo"`
	Lastname   string `json:"lastname"`
	Firstname  string `json:"firstname"`
	FunctionNo int    `json:"functionNo"`
	CityNo     int    `json:"cityNo"`
	Username   string `json:"username"`
	Password   string `json:"password"`
}

type PersonExtra struct {
	PersNo       int    `json:"persNo"`
	Lastname     string `json:"lastname"`
	Firstname    string `json:"firstname"`
	Username     string `json:"username"`
	FunctionNo   int    `json:"functionNo"`
	FunctionName string `json:"functionName"`
	CityNo       int    `json:"cityNo"`
	CityName     string `json:"cityName"`
}

type PersonDelete struct {
	PersNo int `json:"userNo"`
}

type AuthPerson struct {
	PersNo     int    `json:"persNo"`
	Username   string `json:"username"`
	FunctionNo int    `json:"functionNo"`
}

type Function struct {
	FunctionNo   int    `json:"functionNo"`
	FunctionName string `json:"functionName"`
}
