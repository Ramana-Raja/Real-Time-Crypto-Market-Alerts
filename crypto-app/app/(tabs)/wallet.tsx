import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { useWeb3Modal, useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers5-react-native';

export default function WalletScreen() {
    const { open } = useWeb3Modal();
    const { address, isConnected } = useWeb3ModalAccount();
    const { walletProvider } = useWeb3ModalProvider();

    const formatAddress = (addr: string) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const handleConnect = async () => {
        try {
            await open();
        } catch (error) {
            console.error('Connection error:', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Wallet Settings</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Connection Status</Text>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
                    <Text style={styles.statusText}>
                        {isConnected ? 'Connected' : 'Not Connected'}
                    </Text>
                </View>
            </View>

            {isConnected && address ? (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your Wallet Address</Text>
                    <View style={styles.addressContainer}>
                        <Text style={styles.addressFull}>{address}</Text>
                        <Text style={styles.addressShort}>{formatAddress(address)}</Text>
                    </View>
                    <Text style={styles.infoText}>
                        This address is used as your user ID for alerts.
                    </Text>
                </View>
            ) : null}

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Wallet Connection</Text>
                <Text style={styles.description}>
                    {isConnected
                        ? 'Your wallet is connected. You can now create personalized alerts.'
                        : 'Connect your Web3 wallet (Coinbase Wallet, MetaMask, etc.) to personalize your alerts.'}
                </Text>
                <TouchableOpacity
                    style={[styles.button, isConnected && styles.buttonSecondary]}
                    onPress={handleConnect}
                >
                    <Text style={[styles.buttonText, isConnected && styles.buttonTextSecondary]}>
                        {isConnected ? 'Change Wallet' : 'Connect Wallet'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Supported Wallets</Text>
                <Text style={styles.walletItem}>• Coinbase Wallet</Text>
                <Text style={styles.walletItem}>• MetaMask</Text>
                <Text style={styles.walletItem}>• Trust Wallet</Text>
                <Text style={styles.walletItem}>• Rainbow</Text>
                <Text style={styles.walletItem}>• And many more...</Text>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Why connect a wallet?</Text>
                <Text style={styles.infoText}>
                    • Your alerts are tied to your wallet address{'\n'}
                    • No email or password required{'\n'}
                    • Your data stays with you{'\n'}
                    • Works across devices
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    connected: {
        backgroundColor: '#4CAF50',
    },
    disconnected: {
        backgroundColor: '#F44336',
    },
    statusText: {
        fontSize: 16,
        color: '#666',
    },
    addressContainer: {
        backgroundColor: '#f9f9f9',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    addressFull: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#333',
        marginBottom: 8,
    },
    addressShort: {
        fontSize: 18,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        color: '#2196F3',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginBottom: 15,
        lineHeight: 20,
    },
    button: {
        backgroundColor: '#2196F3',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonSecondary: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#2196F3',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonTextSecondary: {
        color: '#2196F3',
    },
    walletItem: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        paddingLeft: 10,
    },
    infoBox: {
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976D2',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 22,
    },
});
