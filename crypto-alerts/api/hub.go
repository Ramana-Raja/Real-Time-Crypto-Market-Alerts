package api

import (
	"encoding/json"
	"log"
	"sync"

	"crypto-alerts/alerts"
)

type Hub struct {
	clients    map[*Client]bool
	broadcast  chan alerts.Alert
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan alerts.Alert, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("📱 Client connected. Total clients: %d", len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				log.Printf("📱 Client disconnected. Total clients: %d", len(h.clients))
			}
			h.mu.Unlock()

		case alert := <-h.broadcast:
			h.mu.RLock()
			message, _ := json.Marshal(alert)
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
			h.mu.RUnlock()
			log.Printf("📤 Broadcasted alert to %d clients", len(h.clients))
		}
	}
}

func (h *Hub) BroadcastAlert(alert alerts.Alert) {
	h.broadcast <- alert
}
