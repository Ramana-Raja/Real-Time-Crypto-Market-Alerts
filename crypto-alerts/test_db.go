package main

import (
	"crypto-alerts/database"
	"fmt"
	"log"
)

func main() {
	db, err := database.NewDB("localhost", "5432", "postgres", "password123", "crypto_alerts")
	if err != nil {
		log.Fatal("Connection failed:", err)
	}
	defer db.Close()

	fmt.Println("test 1:get products")
	products, err := db.GetProducts()
	if err != nil {
		log.Fatal(err)
	}
	for _, p := range products {
		fmt.Printf("ID: %d, Symbol: %s, Name: %s\n", p.ID, p.Symbol, p.Name)
	}

	fmt.Println("test 2: get products")
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

	fmt.Println("test 3: get rules")
	rules, err := db.GetActiveAlertRules()
	if err != nil {
		log.Fatal(err)
	}
	for _, r := range rules {
		fmt.Printf("Rule ID: %d, Product: %d, Type: %s, Value: %.2f\n",
			r.ID, r.ProductID, r.ThresholdType, r.ThresholdValue)
	}

	fmt.Println("test 4: get user rules")
	userRules, err := db.GetUserAlertRules("test-user")
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("User 'test-user' has %d rules\n", len(userRules))

	fmt.Println("\nALL TESTS PASSED!")
}
