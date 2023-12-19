package controller

import (
	"archive/zip"
	"bytes"
	. "ffAPI/models"
	"io"
	"os"
	"strconv"
	"time"

	"github.com/go-pdf/fpdf"
)

func CreateCityPDFs(cityNos []int, year int) (string, string) {
	currentTime := time.Now()
	timeString := currentTime.Format("20060102_150405")
	pathZip := "generated/pdfs/"
	fileZip := "Auswertung_" + timeString + ".zip"
	zipData := new(bytes.Buffer)
	zipWriter := zip.NewWriter(zipData)

	for _, cityNo := range cityNos {
		cityName := GetCityname(cityNo)
		filename := cityName + ".pdf"
		pdf := createCityPDF(filename, cityName, cityNo, year)
		addPDFToZip(zipWriter, filename, pdf)
	}

	zipWriter.Close()
	zipDataBytes := zipData.Bytes()
	saveZipToFile(zipDataBytes, pathZip+fileZip)
	return pathZip, fileZip
}

func createCityPDF(filename string, cityName string, cityNo int, year int) *fpdf.Fpdf {
	yearCityResults := GetYearCityResults(cityNo, year)
	yearCityResultsSum := GetYearCityResultsSum(cityNo, year)
	pdf := fpdf.New("P", "mm", "A4", "")
	pdf.AddUTF8Font("myArial", "", "ressources/arial-unicode-ms.ttf")
	pdf.AddUTF8Font("myArial", "B", "ressources/arial-unicode-ms-bold.ttf")
	pdf.SetHeaderFunc(func() { header(pdf, year, cityName, true) })
	pdf.SetFooterFunc(func() { footer(pdf) })

	// Füge eine neue Seite hinzu
	pdf.AddPage()
	mainData(pdf, yearCityResults, yearCityResultsSum)

	return pdf
}

func header(pdf *fpdf.Fpdf, year int, cityName string, withTableHeader bool) {
	pdf.SetFont("myArial", "B", 20)
	pdf.Cell(0, 10, cityName)
	pdf.Ln(10)
	pdf.SetFont("myArial", "B", 14)
	pdf.Cell(0, 10, "Abrechnung "+strconv.Itoa(year))
	pdf.Ln(10)
	pdf.SetX(135)
	pdf.Cell(0, 10, "Atemschutzwerkstatt Jura")

	pdf.Image("ressources/LogoHeader.jpg", 140.0, 5.0, 60.0, 0.0, false, "", 0, "")

	pdf.Ln(10)

	if withTableHeader {
		headerDetail := []string{"füllen", "TÜV", "prüfen", "reinigen", "prüfen", "reinigen", "prüfen", "reinigen"}
		headerMain := []string{"Flaschen", "Masken", "LA", "Geräte"}

		grayColor := 200
		pdf.SetFillColor(grayColor, grayColor, grayColor)

		pdf.SetFont("myArial", "B", 12.0)
		for _, str := range headerMain {
			pdf.CellFormat(31.5, 7, str, "1", 0, "C", true, 0, "")
		}
		pdf.CellFormat(63, 7, "", "1", 0, "C", true, 0, "")
		pdf.Ln(7)

		pdf.SetFont("myArial", "B", 10.0)
		for _, str := range headerDetail {
			pdf.CellFormat(15.75, 7, str, "1", 0, "C", true, 0, "")
		}
		pdf.CellFormat(31.5, 7, "Datum", "1", 0, "C", true, 0, "")
		pdf.CellFormat(31.5, 7, "Name", "1", 0, "C", true, 0, "")
		pdf.Ln(7)
	}
}

func footer(pdf *fpdf.Fpdf) {
	pdf.Image("ressources/LogoFooter.jpg", 0.0, 285.0, 210.0, 0.0, false, "", 0, "")
}

func mainData(pdf *fpdf.Fpdf, yearCityResults []YearCityResult, yearCityResultsSum YearCityResult) {
	dataFontSize := 10.0
	fontFamily := "myArial"
	pdf.SetFont(fontFamily, "", dataFontSize)
	for _, yearCityResult := range yearCityResults {
		pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResult.FlaschenFuellen), "1", 0, "C", false, 0, "")
		pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResult.FlaschenTuev), "1", 0, "C", false, 0, "")
		pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResult.MaskenPruefen), "1", 0, "C", false, 0, "")
		pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResult.MaskenReinigen), "1", 0, "C", false, 0, "")
		pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResult.LaPruefen), "1", 0, "C", false, 0, "")
		pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResult.LaReinigen), "1", 0, "C", false, 0, "")
		pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResult.GeraetePruefen), "1", 0, "C", false, 0, "")
		pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResult.GeraeteReinigen), "1", 0, "C", false, 0, "")
		pdf.CellFormat(31.5, 7, yearCityResult.DateWork, "1", 0, "L", false, 0, "")
		pdf.CellFormat(31.5, 7, yearCityResult.Lastname, "1", 0, "L", false, 0, "")
		pdf.Ln(7)
	}
	pdf.CellFormat(189, 2, "", "1", 0, "L", false, 0, "")
	pdf.Ln(2)

	grayColor := 200
	pdf.SetFillColor(grayColor, grayColor, grayColor)
	pdf.SetFont(fontFamily, "B", dataFontSize)

	pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResultsSum.FlaschenFuellen), "1", 0, "C", true, 0, "")
	pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResultsSum.FlaschenTuev), "1", 0, "C", true, 0, "")
	pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResultsSum.MaskenPruefen), "1", 0, "C", true, 0, "")
	pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResultsSum.MaskenReinigen), "1", 0, "C", true, 0, "")
	pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResultsSum.LaPruefen), "1", 0, "C", true, 0, "")
	pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResultsSum.LaReinigen), "1", 0, "C", true, 0, "")
	pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResultsSum.GeraetePruefen), "1", 0, "C", true, 0, "")
	pdf.CellFormat(15.75, 7, strconv.Itoa(yearCityResultsSum.GeraeteReinigen), "1", 0, "C", true, 0, "")
	pdf.CellFormat(31.5, 7, "", "1", 0, "L", true, 0, "")
	pdf.CellFormat(31.5, 7, "", "1", 0, "L", true, 0, "")
}

func addPDFToZip(zipWriter *zip.Writer, filename string, pdf *fpdf.Fpdf) error {
	pdfData := new(bytes.Buffer)

	err := pdf.Output(pdfData)
	if err != nil {
		return err
	}
	fileWriter, err := zipWriter.Create(filename)
	if err != nil {
		return err
	}
	_, err = io.Copy(fileWriter, pdfData)
	if err != nil {
		return err
	}
	return nil
}

func saveZipToFile(zipData []byte, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(zipData)
	if err != nil {
		return err
	}
	return nil
}
