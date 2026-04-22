FROM golang:1.22-alpine AS builder

WORKDIR /app
RUN apk add --no-cache git ca-certificates
COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o server ./main.go

FROM gcr.io/distroless/base-debian12

WORKDIR /app
COPY --from=builder /app/server /app/server


EXPOSE 8080

ENTRYPOINT ["/app/server"]
