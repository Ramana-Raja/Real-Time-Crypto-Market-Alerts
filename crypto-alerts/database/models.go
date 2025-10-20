package database

import "time"

type Product struct {
	ID     int    `json:"id"`
	Symbol string `json:"symbol"`
	Name   string `json:"name"`
}

type AlertRule struct {
	ID             int     `json:"id"`
	UserID         string  `json:"user_id"`
	ProductID      int     `json:"product_id"`
	ThresholdType  string  `json:"threshold_type"`
	ThresholdValue float64 `json:"threshold_value"`
	IsActive       bool    `json:"is_active"`
}

type TriggeredAlert struct {
	ID          int       `json:"id"`
	RuleID      int       `json:"rule_id"`
	Price       float64   `json:"price"`
	TriggeredAt time.Time `json:"triggered_at"`
}
