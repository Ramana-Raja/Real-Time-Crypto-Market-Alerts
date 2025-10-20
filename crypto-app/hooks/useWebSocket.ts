import { useEffect, useState, useRef } from 'react';

type Alert = {
    rule_id: number;
    product_id: number;
    symbol: string;
    price: number;
    threshold: number;
    type: string;
    time: string;
};

export function useWebSocket(url: string) {
    const [lastAlert, setLastAlert] = useState<Alert | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef<WebSocket | null>(null);
    const reconnectTimeout = useRef<number | null>(null);  // Changed: initialize with null and use number type

    useEffect(() => {
        const connect = () => {
            try {
                ws.current = new WebSocket(url);

                ws.current.onopen = () => {
                    console.log('✅ WebSocket connected');
                    setIsConnected(true);
                };

                ws.current.onmessage = (event) => {
                    try {
                        const alert = JSON.parse(event.data);
                        console.log('🚨 Received alert:', alert);
                        setLastAlert(alert);
                    } catch (err) {
                        console.error('Error parsing alert:', err);
                    }
                };

                ws.current.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                };

                ws.current.onclose = () => {
                    console.log('🔴 WebSocket disconnected, reconnecting in 5s...');
                    setIsConnected(false);

                    // Reconnect after 5 seconds
                    reconnectTimeout.current = setTimeout(() => {
                        connect();
                    }, 5000) as unknown as number;  // Cast for React Native compatibility
                };
            } catch (err) {
                console.error('Connection error:', err);
                setIsConnected(false);
            }
        };

        connect();

        return () => {
            if (reconnectTimeout.current !== null) {
                clearTimeout(reconnectTimeout.current);
            }
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [url]);

    return { lastAlert, isConnected };
}
