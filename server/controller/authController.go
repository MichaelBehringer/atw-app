package controller

import (
	"errors"
	. "ffAPI/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// ErrAnmeldungFehlgeschlagen steht fuer falsche Zugangsdaten - im Unterschied
// zu einem technischen Fehler, etwa einer nicht erreichbaren Datenbank.
var ErrAnmeldungFehlgeschlagen = errors.New("benutzername oder passwort falsch")

// DoLogin prueft die Zugangsdaten und gibt bei Erfolg ein Token zurueck.
//
// Vorher wurde der Fehler von Scan verworfen. Eine nicht erreichbare Datenbank
// sah dadurch genauso aus wie ein falsches Passwort - und schlimmer: die
// Funktion lief nach dem AbortWithStatus(401) weiter und gab trotzdem ein
// gueltiges Token zurueck, das der Handler mit Status 200 ausgeliefert hat.
func DoLogin(login Login) (AcessToken, error) {
	var treffer int
	// COUNT(*) in einen int, nicht in einen bool: bei mehr als einem Treffer
	// wuerde Scan in einen bool fehlschlagen.
	if scanErr := ExecuteSQLRow("SELECT COUNT(*) FROM pers WHERE UPPER(USERNAME)=UPPER(?) AND PASSWORD=?", login.Username, login.Password).Scan(&treffer); scanErr != nil {
		return AcessToken{}, scanErr
	}
	if treffer == 0 {
		return AcessToken{}, ErrAnmeldungFehlgeschlagen
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256,
		jwt.MapClaims{
			"user":         login.Username,
			"creationTime": time.Now().UnixNano(),
		})
	signiert, signErr := token.SignedString([]byte(Env("ATW_JWT_SECRET", "my_secret_key")))
	if signErr != nil {
		return AcessToken{}, signErr
	}

	return AcessToken{AccessToken: signiert}, nil
}

func CheckToken(c *gin.Context) AuthPerson {
	_, claims := ExtractToken(c)
	username, _ := claims["user"].(string)
	var person AuthPerson
	ExecuteSQLRow("SELECT CONCAT(FIRSTNAME, ' ', LASTNAME), PERS_NO, FUNCTION_NO FROM pers WHERE USERNAME=?", username).Scan(&person.Username, &person.PersNo, &person.FunctionNo)
	return person
}

func ExtractToken(c *gin.Context) (bool, jwt.MapClaims) {
	h := AuthHeader{}
	c.ShouldBindHeader(&h)
	idTokenHeader := strings.Split(h.IDToken, "Bearer ")
	if len(idTokenHeader) < 2 {
		return false, nil
	}
	return parseToken(idTokenHeader[1])
}

func parseToken(tokenStr string) (bool, jwt.MapClaims) {
	claims := jwt.MapClaims{}
	tkn, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(Env("ATW_JWT_SECRET", "my_secret_key")), nil
	})
	return (err == nil && tkn.Valid), claims
}
