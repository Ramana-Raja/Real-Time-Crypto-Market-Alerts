package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"

	"crypto-alerts/alerts"
	"crypto-alerts/api"
	"crypto-alerts/database"
	ws "crypto-alerts/websocket"
)

func corsMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}

func getProducts(db *database.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		products, err := db.GetProducts()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(products)
	}
}

func getAlerts(db *database.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get user_id from query param or use demo-user
		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			userID = "demo-user"
		}

		alerts, err := db.GetUserAlertRules(userID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(alerts)
	}
}

func createAlert(db *database.DB, engine *alerts.Engine) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var rule database.AlertRule
		err := json.NewDecoder(r.Body).Decode(&rule)
		if err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		// Use provided user_id or fallback to demo-user
		if rule.UserID == "" {
			rule.UserID = "demo-user"
		}

		err = db.CreateAlertRule(&rule)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Reload rules in engine
		engine.LoadRules()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(rule)
	}
}

// Handler to delete alert rule
func deleteAlert(db *database.DB, engine *alerts.Engine) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		idStr := vars["id"]
		id, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}
		err = db.DeleteAlertRule(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Reload rules in engine
		engine.LoadRules()

		w.WriteHeader(http.StatusNoContent)
	}
}

func main() {
	// Connect to PostgreSQL
	db, err := database.NewDB("localhost", "5432", "postgres", "password123", "crypto_alerts")
	if err != nil {
		log.Fatal("Database connection failed: ", err)
	}
	defer db.Close()

	// Initialize alert engine
	engine := alerts.NewEngine(db)

	// Initialize WebSocket hub
	hub := api.NewHub()
	go hub.Run()

	// Connect to Coinbase WebSocket
	client := ws.NewClient()
	err = client.Connect()
	if err != nil {
		log.Fatal("WebSocket connection failed:", err)
	}

	err = client.Subscribe([]string{"BTC-USD", "ETH-USD"})
	if err != nil {
		log.Fatal("Subscribe failed:", err)
	}

	// Channel for price updates
	priceChan := make(chan ws.PriceUpdate, 100)
	go client.ReadMessages(priceChan)

	// Goroutine: Price evaluator
	go func() {
		for price := range priceChan {
			productID := alerts.GetProductIDFromSymbol(price.Symbol)
			if productID > 0 {
				engine.EvaluatePrice(price, productID)
			}
		}
	}()

	// Goroutine: Alert handler - save to DB AND broadcast to clients
	alertChan := engine.GetAlertChannel()
	go func() {
		for alert := range alertChan {
			log.Printf("ALERT FIRED: %s hit $%.2f (threshold: $%.2f %s)",
				alert.Symbol, alert.Price, alert.Threshold, alert.Type)

			// Save to database
			db.SaveTriggeredAlert(alert.RuleID, alert.Price)

			// Broadcast to connected mobile clients
			hub.BroadcastAlert(alert)
		}
	}()

	// Reload rules periodically (every 30 seconds)
	ticker := time.NewTicker(30 * time.Second)
	go func() {
		for range ticker.C {
			engine.LoadRules()
		}
	}()

	// Setup HTTP router
	router := mux.NewRouter()
	router.HandleFunc("/api/products", getProducts(db)).Methods("GET")
	router.HandleFunc("/api/alerts", getAlerts(db)).Methods("GET")
	router.HandleFunc("/api/alerts", createAlert(db, engine)).Methods("POST")
	router.HandleFunc("/api/alerts/{id}", deleteAlert(db, engine)).Methods("DELETE")

	// WebSocket endpoint for real-time alerts
	router.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		api.ServeWs(hub, w, r)
	})

	// Start server
	fmt.Println("🚀 Server running on http://localhost:8080")
	fmt.Println("📡 WebSocket endpoint: ws://localhost:8080/ws")
	log.Fatal(http.ListenAndServe(":8080", corsMiddleware(router)))
}
