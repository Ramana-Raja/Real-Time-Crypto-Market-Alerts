import { StyleSheet, Text, View, ScrollView, Alert as RNAlert } from 'react-native';
import { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

const WS_URL = 'ws://10.18.34.229:8080/ws'; // Use YOUR IP

type Alert = {
  rule_id: number;
  product_id: number;
  symbol: string;
  price: number;
  threshold: number;
  type: string;
  time: string;
};

export default function LiveAlertsScreen() {
  const { lastAlert, isConnected } = useWebSocket(WS_URL);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);
  
  useEffect(() => {
    if (lastAlert) {
      // Show popup notification
      RNAlert.alert(
        '🚨 Price Alert!',
        `${lastAlert.symbol} hit $${lastAlert.price.toFixed(2)}\n(Threshold: $${lastAlert.threshold.toFixed(2)} ${lastAlert.type})`,
        [{ text: 'OK' }]
      );
      
      // Add to history
      setAlertHistory(prev => [lastAlert, ...prev].slice(0, 20)); // Keep last 20
    }
  }, [lastAlert]);
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Alerts</Text>
        <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
        <Text style={styles.statusText}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>
      
      {alertHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No alerts yet</Text>
          <Text style={styles.emptySubtext}>
            {isConnected 
              ? 'Waiting for price alerts...' 
              : 'Connecting to server...'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.alertList}>
          {alertHistory.map((alert, index) => (
            <View key={index} style={styles.alertCard}>
              <Text style={styles.alertSymbol}>{alert.symbol}</Text>
              <Text style={styles.alertPrice}>
                Price: ${alert.price.toFixed(2)}
              </Text>
              <Text style={styles.alertThreshold}>
                Threshold: ${alert.threshold.toFixed(2)} {alert.type}
              </Text>
              <Text style={styles.alertTime}>
                {new Date(alert.time).toLocaleTimeString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#F44336',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
  },
  alertList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  alertCard: {
    backgroundColor: '#FFF9C4',
    padding: 15,
    marginBottom: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  alertSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  alertPrice: {
    fontSize: 16,
    color: '#2196F3',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  alertThreshold: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
  },
});
