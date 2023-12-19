package middleware

import (
	. "ffAPI/controller"
	. "ffAPI/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func AuthUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		isAllowed, claims := ExtractToken(c)
		if claims == nil {
			c.AbortWithStatusJSON(http.StatusBadRequest, ResponseText{Reason: "kein token"})
			return
		}
		if isAllowed {
			c.Next()
		} else {
			c.AbortWithStatus(http.StatusMethodNotAllowed)
			return
		}
	}
}
