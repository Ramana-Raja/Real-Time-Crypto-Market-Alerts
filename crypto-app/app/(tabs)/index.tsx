import { StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, Alert as RNAlert } from 'react-native';
import { useEffect, useState } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

const API_URL = 'http://10.18.34.229:8080/api';
const WS_URL = 'ws://10.18.34.229:8080/ws';

type Product = {
    id: number;
    symbol: string;
    name: string;
};

type Alert = {
    rule_id: number;
    product_id: number;
    symbol: string;
    price: number;
    threshold: number;
    type: string;
    time: string;
};

export default function HomeScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [thresholds, setThresholds] = useState<{[key: number]: string}>({});
    const [error, setError] = useState('');

    const { lastAlert, isConnected } = useWebSocket(WS_URL);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (lastAlert) {
            RNAlert.alert(
                '🚨 Price Alert!',
                `${lastAlert.symbol} hit $${lastAlert.price.toFixed(2)}\n(Threshold: $${lastAlert.threshold.toFixed(2)} ${lastAlert.type})`,
                [{ text: 'OK' }]
            );
        }
    }, [lastAlert]);

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/products`);
            const data = await res.json();
            setProducts(data);
            setError('');
        } catch (err) {
            setError('Failed to load products');
            console.error(err);
        }
    };

    const createAlert = async (productId: number, symbol: string) => {
        const threshold = thresholds[productId];
        if (!threshold || threshold.trim() === '') {
            RNAlert.alert('Error', 'Please enter a threshold value');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/alerts`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    product_id: productId,
                    threshold_type: 'above',
                    threshold_value: parseFloat(threshold)
                })
            });

            if (res.ok) {
                RNAlert.alert('Success', `Alert created for ${symbol}!`);
                setThresholds({...thresholds, [productId]: ''});
            } else {
                RNAlert.alert('Error', 'Failed to create alert');
            }
        } catch (err) {
            RNAlert.alert('Error', 'Network error');
            console.error(err);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Create Price Alerts</Text>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
                    <Text style={styles.statusText}>
                        {isConnected ? 'Live' : 'Offline'}
                    </Text>
                </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <FlatList
                data={products}
                keyExtractor={item => item.id.toString()}
                renderItem={({item}) => (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.symbol}>{item.symbol}</Text>
                            <Text style={styles.name}>{item.name}</Text>
                        </View>

                        <View style={styles.alertForm}>
                            <Text style={styles.label}>Alert when price goes above:</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter price (e.g., 51000)"
                                keyboardType="numeric"
                                value={thresholds[item.id] || ''}
                                onChangeText={(text) => setThresholds({...thresholds, [item.id]: text})}
                            />
                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => createAlert(item.id, item.symbol)}
                            >
                                <Text style={styles.buttonText}>Create Alert</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 20,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    connected: {
        backgroundColor: '#4CAF50',
    },
    disconnected: {
        backgroundColor: '#F44336',
    },
    statusText: {
        fontSize: 12,
        color: '#666',
    },
    error: {
        color: 'red',
        marginBottom: 10,
        textAlign: 'center',
    },
    card: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        marginBottom: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    cardHeader: {
        marginBottom: 15,
    },
    symbol: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    name: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    alertForm: {
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        paddingTop: 10,
    },
    label: {
        fontSize: 14,
        color: '#555',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
