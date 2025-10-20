package alerts

import (
	"crypto-alerts/database"
	"crypto-alerts/websocket"
	"log"
	"strings"
	"sync"
	"time"
)

type Alert struct {
	RuleID    int       `json:"rule_id"`
	ProductID int       `json:"product_id"`
	Symbol    string    `json:"symbol"`
	Price     float64   `json:"price"`
	Threshold float64   `json:"threshold"`
	Type      string    `json:"type"`
	Time      time.Time `json:"time"`
}

type Engine struct {
	db            *database.DB
	rules         []database.AlertRule
	rulesMux      sync.RWMutex
	alertChan     chan Alert
	lastTriggered map[int]time.Time
	cooldown      time.Duration
}

func NewEngine(db *database.DB) *Engine {
	engine := &Engine{
		db:            db,
		rules:         []database.AlertRule{},
		alertChan:     make(chan Alert, 100),
		lastTriggered: make(map[int]time.Time),
		cooldown:      5 * time.Minute, // Don't spam same alert within 5 minutes
	}

	engine.LoadRules()
	return engine
}

func (e *Engine) LoadRules() {
	e.rulesMux.Lock()
	defer e.rulesMux.Unlock()

	rules, err := e.db.GetActiveAlertRules()
	if err != nil {
		log.Println("❌ Error loading rules:", err)
		return
	}

	e.rules = rules
	log.Printf("✅ Loaded %d active alert rules", len(rules))
}

func (e *Engine) EvaluatePrice(price websocket.PriceUpdate, productID int) {
	e.rulesMux.RLock()
	defer e.rulesMux.RUnlock()

	for _, rule := range e.rules {
		if rule.ProductID != productID {
			continue
		}

		triggered := false
		if rule.ThresholdType == "above" && price.Price > rule.ThresholdValue {
			triggered = true
		} else if rule.ThresholdType == "below" && price.Price < rule.ThresholdValue {
			triggered = true
		}

		if triggered && e.shouldTrigger(rule.ID) {
			alert := Alert{
				RuleID:    rule.ID,
				ProductID: productID,
				Symbol:    price.Symbol,
				Price:     price.Price,
				Threshold: rule.ThresholdValue,
				Type:      rule.ThresholdType,
				Time:      time.Now(),
			}

			e.alertChan <- alert
			e.lastTriggered[rule.ID] = time.Now()
		}
	}
}

func (e *Engine) shouldTrigger(ruleID int) bool {
	lastTime, exists := e.lastTriggered[ruleID]
	if !exists {
		return true
	}
	return time.Since(lastTime) > e.cooldown
}

func (e *Engine) GetAlertChannel() <-chan Alert {
	return e.alertChan
}

func GetProductIDFromSymbol(symbol string) int {
	if strings.Contains(symbol, "BTC") {
		return 1
	} else if strings.Contains(symbol, "ETH") {
		return 2
	}
	return 0
}
