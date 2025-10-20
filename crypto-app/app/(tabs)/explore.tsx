import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useEffect, useState } from 'react';

const API_URL = 'http://10.18.34.229:8080/api';

type AlertRule = {
    id: number;
    product_id: number;
    threshold_type: string;
    threshold_value: number;
    is_active: boolean;
};

export default function AlertsScreen() {
    const [alerts, setAlerts] = useState<AlertRule[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        setRefreshing(true);
        try {
            const res = await fetch(`${API_URL}/alerts`);
            const data = await res.json();
            setAlerts(data || []);
        } catch (err) {
            console.error('Error fetching alerts:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const deleteAlert = async (id: number) => {
        Alert.alert(
            'Delete Alert',
            'Are you sure you want to delete this alert?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await fetch(`${API_URL}/alerts/${id}`, { method: 'DELETE' });
                            fetchAlerts();
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete alert');
                        }
                    }
                }
            ]
        );
    };

    const getProductName = (productId: number) => {
        if (productId === 1) return 'Bitcoin (BTC-USD)';
        if (productId === 2) return 'Ethereum (ETH-USD)';
        return `Product ${productId}`;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>My Alerts</Text>
                <TouchableOpacity onPress={fetchAlerts} style={styles.refreshButton}>
                    <Text style={styles.refreshText}>🔄 Refresh</Text>
                </TouchableOpacity>
            </View>

            {alerts.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No alerts yet</Text>
                    <Text style={styles.emptySubtext}>Create an alert from the Home tab</Text>
                </View>
            ) : (
                <FlatList
                    data={alerts}
                    keyExtractor={item => item.id.toString()}
                    onRefresh={fetchAlerts}
                    refreshing={refreshing}
                    renderItem={({item}) => (
                        <View style={styles.alertCard}>
                            <View style={styles.alertInfo}>
                                <Text style={styles.productName}>{getProductName(item.product_id)}</Text>
                                <Text style={styles.alertDetails}>
                                    Alert when price goes {item.threshold_type}
                                </Text>
                                <Text style={styles.threshold}>
                                    ${item.threshold_value.toLocaleString()}
                                </Text>
                                <Text style={styles.status}>
                                    {item.is_active ? '🟢 Active' : '🔴 Inactive'}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => deleteAlert(item.id)}
                            >
                                <Text style={styles.deleteText}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    refreshButton: {
        padding: 8,
    },
    refreshText: {
        fontSize: 16,
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
    alertCard: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        padding: 15,
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    alertInfo: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    alertDetails: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    threshold: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2196F3',
        marginBottom: 4,
    },
    status: {
        fontSize: 12,
        color: '#888',
    },
    deleteButton: {
        justifyContent: 'center',
        paddingLeft: 15,
    },
    deleteText: {
        fontSize: 24,
    },
});
