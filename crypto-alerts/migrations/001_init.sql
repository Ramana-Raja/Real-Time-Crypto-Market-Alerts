-- Create products table if not exists
CREATE TABLE IF NOT EXISTS products (
                                        id SERIAL PRIMARY KEY,
                                        symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
    );

-- Create alert_rules table if not exists
CREATE TABLE IF NOT EXISTS alert_rules (
                                           id SERIAL PRIMARY KEY,
                                           product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    target_price DECIMAL(20, 8) NOT NULL,
    condition VARCHAR(10) NOT NULL CHECK (condition IN ('above', 'below')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Create triggered_alerts table if not exists
CREATE TABLE IF NOT EXISTS triggered_alerts (
                                                id SERIAL PRIMARY KEY,
                                                alert_id INTEGER NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,
    triggered_price DECIMAL(20, 8) NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_alert_rules_product_id ON alert_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_triggered_alerts_alert_id ON triggered_alerts(alert_id);

-- Insert initial products (safe to run multiple times)
INSERT INTO products (symbol, name)
VALUES ('BTC-USD', 'Bitcoin')
    ON CONFLICT (symbol) DO NOTHING;

INSERT INTO products (symbol, name)
VALUES ('ETH-USD', 'Ethereum')
    ON CONFLICT (symbol) DO NOTHING;
