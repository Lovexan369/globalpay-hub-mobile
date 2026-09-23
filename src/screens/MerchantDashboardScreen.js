import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Card, Button, Text, TextInput } from 'react-native-paper';
import { merchantApi } from '../services/api';
import { ErrorHandler } from '../services/errorHandler';
import { OfflineNotificationManager } from '../services/offlineNotifications';

export default function MerchantDashboardScreen() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBalance = async () => {
    try {
      const data = await merchantApi.getBalance();
      setBalance((data.available_balance || data.balance || 0) / 100);
    } catch (error) {
      Alert.alert('Ошибка', ErrorHandler.getUserFriendlyMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const handlePayout = async () => {
    if (!amount || parseFloat(amount) > balance) {
      Alert.alert('Ошибка', 'Недостаточно средств');
      return;
    }

    try {
      await merchantApi.createPayout({ amount: Math.round(parseFloat(amount) * 100) });
      await OfflineNotificationManager.addEvent('payout_requested', { amount });
      Alert.alert('Успех', 'Заявка на вывод создана');
      setAmount('');
      loadBalance();
    } catch (error) {
      Alert.alert('Ошибка', ErrorHandler.getUserFriendlyMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Баланс</Text>
          <Text variant="displayMedium" style={styles.balance}>${balance.toFixed(2)}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">Вывод средств</Text>
          <TextInput
            label="Сумма"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            mode="outlined"
            style={styles.input}
          />
          <Button mode="contained" onPress={handlePayout} disabled={!amount}>
            Создать заявку
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 16 },
  balance: { marginVertical: 12 },
  input: { marginBottom: 16 }
});