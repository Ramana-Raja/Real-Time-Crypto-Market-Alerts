package main

import (
	"crypto-alerts/database"
	"fmt"
	"log"
)

func main() {
	// Connect to database
	db, err := database.NewDB("localhost", "5432", "postgres", "password123", "crypto_alerts")
	if err != nil {
		log.Fatal("Connection failed:", err)
	}
	defer db.Close()

	fmt.Println("\n=== TEST 1: Get Products ===")
	products, err := db.GetProducts()
	if err != nil {
		log.Fatal(err)
	}
	for _, p := range products {
		fmt.Printf("ID: %d, Symbol: %s, Name: %s\n", p.ID, p.Symbol, p.Name)
	}

	fmt.Println("\n=== TEST 2: Create Alert Rule ===")
	rule := &database.AlertRule{
		UserID:         "test-user",
		ProductID:      1,
		ThresholdType:  "above",
		ThresholdValue: 51000,
	}
	err = db.CreateAlertRule(rule)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("Created rule with ID: %d\n", rule.ID)

	fmt.Println("\n=== TEST 3: Get Active Rules ===")
	rules, err := db.GetActiveAlertRules()
	if err != nil {
		log.Fatal(err)
	}
	for _, r := range rules {
		fmt.Printf("Rule ID: %d, Product: %d, Type: %s, Value: %.2f\n",
			r.ID, r.ProductID, r.ThresholdType, r.ThresholdValue)
	}

	fmt.Println("\n=== TEST 4: Get User Rules ===")
	userRules, err := db.GetUserAlertRules("test-user")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("User 'test-user' has %d rules\n", len(userRules))

	fmt.Println("\nALL TESTS PASSED!")
}
