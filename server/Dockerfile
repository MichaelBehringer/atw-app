# Build-Stage
FROM golang:1.27-alpine AS build

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY ./ ./

RUN CGO_ENABLED=0 GOOS=linux go build -o ./server

# Laufzeit-Image: distroless/static reicht, weil ohne CGO gebaut wird
FROM gcr.io/distroless/static

COPY --from=build /app/server /app/server
COPY --from=build /app/ressources/ /app/ressources/

WORKDIR /app

EXPOSE 8080

CMD ["./server"]
