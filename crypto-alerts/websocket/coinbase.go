package websocket

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	conn *websocket.Conn
	URL  string
}

type PriceUpdate struct {
	Symbol string
	Price  float64
	Time   time.Time
}

func NewClient() *Client {
	return &Client{
		URL: "wss://advanced-trade-ws.coinbase.com",
	}
}

func (c *Client) Connect() error {
	conn, _, err := websocket.DefaultDialer.Dial(c.URL, nil)
	if err != nil {
		return err
	}
	c.conn = conn
	log.Println("✅ Connected to Coinbase WebSocket")
	return nil
}

func (c *Client) Subscribe(products []string) error {
	msg := map[string]interface{}{
		"type":        "subscribe",
		"product_ids": products,
		"channel":     "ticker",
	}
	return c.conn.WriteJSON(msg)
}

func (c *Client) ReadMessages(priceChan chan PriceUpdate) {
	defer c.conn.Close()

	for {
		var msg map[string]interface{}
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			log.Println("❌ Read error:", err)
			return
		}

		// Parse ticker events
		if msg["channel"] == "ticker" {
			events, ok := msg["events"].([]interface{})
			if !ok {
				continue
			}

			for _, e := range events {
				event := e.(map[string]interface{})
				tickers, ok := event["tickers"].([]interface{})
				if !ok {
					continue
				}

				for _, t := range tickers {
					ticker := t.(map[string]interface{})
					priceStr, _ := ticker["price"].(string)

					var price float64
					json.Unmarshal([]byte(priceStr), &price)

					productID, _ := ticker["product_id"].(string)

					priceChan <- PriceUpdate{
						Symbol: productID,
						Price:  price,
						Time:   time.Now(),
					}
				}
			}
		}
	}
}
