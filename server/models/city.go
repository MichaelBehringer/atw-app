package models

type City struct {
	CityNo int    `json:"cityNo"`
	Name   string `json:"name"`
}

type UpdateCityObj struct {
	CityNo int    `json:"key"`
	Name   string `json:"cityName"`
}

type YearCityResult struct {
	Lastname        string `json:"lastname"`
	FlaschenFuellen int    `json:"flaschenFuellen"`
	FlaschenTuev    int    `json:"flaschenTuev"`
	MaskenPruefen   int    `json:"maskenPruefen"`
	MaskenReinigen  int    `json:"maskenReinigen"`
	LaPruefen       int    `json:"laPruefen"`
	LaReinigen      int    `json:"laReinigen"`
	GeraetePruefen  int    `json:"geraetePruefen"`
	GeraeteReinigen int    `json:"geraeteReinigen"`
	DateWork        string `json:"dateWork"`
}
