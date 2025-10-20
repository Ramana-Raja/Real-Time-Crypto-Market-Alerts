package database

import "log"

func (db *DB) GetProducts() ([]Product, error) {
	rows, err := db.conn.Query("SELECT id, symbol, name FROM products ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Symbol, &p.Name); err != nil {
			return nil, err
		}
		products = append(products, p)
	}

	return products, nil
}

func (db *DB) CreateAlertRule(rule *AlertRule) error {
	query := `
        INSERT INTO alert_rules (user_id, product_id, threshold_type, threshold_value)
        VALUES ($1, $2, $3, $4)
        RETURNING id
    `

	err := db.conn.QueryRow(
		query,
		rule.UserID,
		rule.ProductID,
		rule.ThresholdType,
		rule.ThresholdValue,
	).Scan(&rule.ID)

	if err != nil {
		return err
	}

	log.Printf("Created alert rule ID: %d", rule.ID)
	return nil
}

func (db *DB) GetActiveAlertRules() ([]AlertRule, error) {
	query := `
        SELECT id, user_id, product_id, threshold_type, threshold_value, is_active
        FROM alert_rules
        WHERE is_active = true
    `

	rows, err := db.conn.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []AlertRule
	for rows.Next() {
		var r AlertRule
		err := rows.Scan(
			&r.ID,
			&r.UserID,
			&r.ProductID,
			&r.ThresholdType,
			&r.ThresholdValue,
			&r.IsActive,
		)
		if err != nil {
			return nil, err
		}
		rules = append(rules, r)
	}

	return rules, nil
}

func (db *DB) GetUserAlertRules(userID string) ([]AlertRule, error) {
	query := `
        SELECT id, user_id, product_id, threshold_type, threshold_value, is_active
        FROM alert_rules
        WHERE user_id = $1
        ORDER BY created_at DESC
    `

	rows, err := db.conn.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []AlertRule
	for rows.Next() {
		var r AlertRule
		err := rows.Scan(
			&r.ID,
			&r.UserID,
			&r.ProductID,
			&r.ThresholdType,
			&r.ThresholdValue,
			&r.IsActive,
		)
		if err != nil {
			return nil, err
		}
		rules = append(rules, r)
	}

	return rules, nil
}

func (db *DB) DeleteAlertRule(id int) error {
	query := "DELETE FROM alert_rules WHERE id = $1"
	_, err := db.conn.Exec(query, id)
	if err != nil {
		log.Printf("Error deleting rule %d: %v", id, err)
		return err
	}
	log.Printf("Deleted alert rule ID: %d", id)
	return nil
}

func (db *DB) SaveTriggeredAlert(ruleID int, price float64) error {
	query := `
        INSERT INTO triggered_alerts (rule_id, price)
        VALUES ($1, $2)
    `
	_, err := db.conn.Exec(query, ruleID, price)
	if err != nil {
		return err
	}
	log.Printf("Saved triggered alert for rule %d at price $%.2f", ruleID, price)
	return nil
}
