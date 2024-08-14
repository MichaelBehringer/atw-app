package controller

import (
	. "ffAPI/models"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func DoLogin(login Login, c *gin.Context) AcessToken {
	var (
		key []byte
		t   *jwt.Token
		s   string
	)

	var isAllowed bool
	ExecuteSQLRow("SELECT COUNT(*) FROM pers WHERE UPPER(USERNAME)=UPPER(?) AND PASSWORD=?", login.Username, login.Password).Scan(&isAllowed)
	if !isAllowed {
		c.AbortWithStatus(http.StatusUnauthorized)
	}

	key = []byte("my_secret_key")
	t = jwt.NewWithClaims(jwt.SigningMethodHS256,
		jwt.MapClaims{
			"user":         login.Username,
			"creationTime": time.Now().UnixNano(),
		})
	s, _ = t.SignedString(key)

	return AcessToken{AccessToken: s}
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
		return []byte("my_secret_key"), nil
	})
	return (err == nil && tkn.Valid), claims
}

func ntfyNoticeAnlieferung(topic string, source string, message string) {
	req, _ := http.NewRequest("POST", "https://ntfy.sh/"+topic,
		strings.NewReader("Bestandteile:"+message))
	req.Header.Set("Title", source+" - Anlieferung")
	http.DefaultClient.Do(req)
}

func ntfyNoticeBearbeitung(topic string, header string, message string) {
	req, _ := http.NewRequest("POST", "https://ntfy.sh/Info_"+topic,
		strings.NewReader(message))
	req.Header.Set("Title", header)
	http.DefaultClient.Do(req)
}
