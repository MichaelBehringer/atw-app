package models

type SearchParam struct {
	PersNo int `json:"persNo"`
}

type SearchParamExtra struct {
	PersNo     int  `json:"persNo"`
	IsExternal bool `json:"isExternal"`
}

type SearchResult struct {
	DataNo          int     `json:"key"`
	City            string  `json:"city"`
	DateWork        string  `json:"dateWork"`
	TimeWork        float32 `json:"timeWork"`
	FlaschenFuellen int     `json:"flaschenFuellen"`
	FlaschenTuev    int     `json:"flaschenTUEV"`
	MaskenReinigen  int     `json:"maskenReinigen"`
	MaskenPruefen   int     `json:"maskenPruefen"`
	LaReinigen      int     `json:"laReinigen"`
	LaPruefen       int     `json:"laPruefen"`
	GeraetePruefen  int     `json:"gereatPruefen"`
	GeraeteReinigen int     `json:"gereatReinigen"`
	Bemerkung       string  `json:"bemerkung"`
}

type SearchResultOpen struct {
	DataNo   int    `json:"key"`
	City     string `json:"city"`
	CityNo   int    `json:"cityNo"`
	DateWork string `json:"dateWork"`
	State    string `json:"state"`
	// Die offenen Nummern je Arbeitsart. Damit kann die Oberflaeche direkt aus
	// der Liste die Zusammenfassung und die Abarbeiten-Checkliste bauen, ohne
	// pro Auftrag zusaetzlich /entry/:id abzufragen. Die Schluesselnamen sind
	// dieselben wie in EntryObj.
	FlaschenFuellenNr string `json:"flaschenFuellenNr"`
	FlaschenTuevNr    string `json:"flaschenTUEVNr"`
	MaskenPruefenNr   string `json:"maskenPruefenNr"`
	MaskenReinigenNr  string `json:"maskenReinigenNr"`
	LaPruefenNr       string `json:"laPruefenNr"`
	LaReinigenNr      string `json:"laReinigenNr"`
	GeraetePruefenNr  string `json:"geraetePruefenNr"`
	GeraeteReinigenNr string `json:"geraeteReinigenNr"`
}

type EntryObj struct {
	DataNo            int     `json:"dataNo"`
	City              int     `json:"city"`
	User              int     `json:"user"`
	DateWork          string  `json:"dateWork"`
	TimeWork          float32 `json:"arbeitszeit"`
	FlaschenFuellen   int     `json:"flaschenFuellen"`
	FlaschenTuev      int     `json:"flaschenTUEV"`
	MaskenReinigen    int     `json:"maskenReinigen"`
	MaskenPruefen     int     `json:"maskenPruefen"`
	LaReinigen        int     `json:"laReinigen"`
	LaPruefen         int     `json:"laPruefen"`
	GeraetePruefen    int     `json:"geraetePruefen"`
	GeraeteReinigen   int     `json:"geraeteReinigen"`
	Bemerkung         string  `json:"bemerkung"`
	FlaschenFuellenNr string  `json:"flaschenFuellenNr"`
	FlaschenTuevNr    string  `json:"flaschenTUEVNr"`
	MaskenReinigenNr  string  `json:"maskenReinigenNr"`
	MaskenPruefenNr   string  `json:"maskenPruefenNr"`
	LaReinigenNr      string  `json:"laReinigenNr"`
	LaPruefenNr       string  `json:"laPruefenNr"`
	GeraetePruefenNr  string  `json:"geraetePruefenNr"`
	GeraeteReinigenNr string  `json:"geraeteReinigenNr"`
}

type NrObjList struct {
	FlaschenFuellenNr []string `json:"flaschenFuellenNr"`
	FlaschenTuevNr    []string `json:"flaschenTUEVNr"`
	MaskenReinigenNr  []string `json:"maskenReinigenNr"`
	MaskenPruefenNr   []string `json:"maskenPruefenNr"`
	LaReinigenNr      []string `json:"laReinigenNr"`
	LaPruefenNr       []string `json:"laPruefenNr"`
	GeraetePruefenNr  []string `json:"geraetePruefenNr"`
	GeraeteReinigenNr []string `json:"geraeteReinigenNr"`
}

type EntryObjTree struct {
	DataNo        int      `json:"dataNo"`
	WorkingPoints []string `json:"workingPoints"`
	User          int      `json:"user"`
	City          int      `json:"city"`
	DateWork      string   `json:"dateWork"`
	TimeWork      float32  `json:"timeWork"`
}

type YearSumDataResult struct {
	FlaschenFuellen int `json:"flaschenFuellen"`
	FlaschenTuev    int `json:"flaschenTUEV"`
	MaskenReinigen  int `json:"maskenReinigen"`
	MaskenPruefen   int `json:"maskenPruefen"`
	LaReinigen      int `json:"laReinigen"`
	LaPruefen       int `json:"laPruefen"`
	GeraetePruefen  int `json:"geraetePruefen"`
	GeraeteReinigen int `json:"geraeteReinigen"`
}
