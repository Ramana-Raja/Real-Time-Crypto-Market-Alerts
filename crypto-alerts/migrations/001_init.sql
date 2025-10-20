-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Alert rules table
CREATE TABLE alert_rules (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    threshold_type VARCHAR(10) NOT NULL CHECK (threshold_type IN ('above', 'below')),
    threshold_value DECIMAL(18,8) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Triggered alerts table
CREATE TABLE triggered_alerts (
    id SERIAL PRIMARY KEY,
    rule_id INT REFERENCES alert_rules(id) ON DELETE CASCADE,
    price DECIMAL(18,8) NOT NULL,
    triggered_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_alert_rules_user ON alert_rules(user_id);
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX idx_triggered_alerts_rule ON triggered_alerts(rule_id);

-- Insert initial products
INSERT INTO products (id, symbol, name) VALUES 
    (1, 'BTC-USD', 'Bitcoin'),
    (2, 'ETH-USD', 'Ethereum');
