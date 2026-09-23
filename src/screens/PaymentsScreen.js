import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { Card, Button, Text, TextInput } from 'react-native-paper';
import { CardField, useConfirmPayment } from '@stripe/stripe-react-native';
import { paymentsApi } from '../services/api';
import { OfflineNotificationManager } from '../services/offlineNotifications';
import { ErrorHandler } from '../services/errorHandler';
import { DataSyncManager } from '../services/dataSync';
import NetInfo from '@react-native-community/netinfo';

export default function PaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const { confirmPayment } = useConfirmPayment();

  const loadPayments = async () => {
    try {
      const data = await paymentsApi.getPayments();
      setPayments(data.payments || data || []);
    } catch (error) {
      Alert.alert('Ошибка', ErrorHandler.getUserFriendlyMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handlePayment = async () => {
    if (!amount || !email) {
      Alert.alert('Ошибка', 'Заполните сумму и email');
      return;
    }

    try {
      const state = await NetInfo.fetch();
      const paymentData = {
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'usd',
        customer: { email }
      };

      if (!state.isConnected) {
        await DataSyncManager.queueOperation({ type: 'create_payment', payload: paymentData });
        await OfflineNotificationManager.addEvent('payment_success', { amount });
        Alert.alert('Оффлайн', 'Платеж добавлен в очередь синхронизации');
        return;
      }

      const response = await paymentsApi.createPayment(paymentData);

      const { error, paymentIntent } = await confirmPayment(response.clientSecret, {
        paymentMethodType: 'Card'
      });

      if (error) {
        await OfflineNotificationManager.addEvent('payment_failed', { amount, error: error.message });
        Alert.alert('Ошибка', error.message);
      } else {
        await OfflineNotificationManager.addEvent('payment_success', { amount, paymentId: paymentIntent.id });
        Alert.alert('Успех', `Платеж ${paymentIntent.id} выполнен`);
        setAmount('');
        setEmail('');
        loadPayments();
      }
    } catch (error) {
      Alert.alert('Ошибка', ErrorHandler.getUserFriendlyMessage(error));
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.form}>
        <Card.Content>
          <Text variant="titleMedium">Создать платеж</Text>
          <TextInput label="Сумма (USD)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" mode="outlined" style={styles.input} />
          <TextInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" mode="outlined" style={styles.input} />
          <CardField
            postalCodeEnabled={false}
            style={styles.cardField}
          />
          <Button mode="contained" onPress={handlePayment} style={styles.button}>
            Оплатить ${amount || '0'}
          </Button>
        </Card.Content>
      </Card>

      <FlatList
        data={payments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Card style={styles.item}>
            <Card.Content>
              <Text>${(item.amount / 100).toFixed(2)} — {item.status}</Text>
              <Text>{item.customer_email || item.email}</Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Платежей пока нет</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  form: { marginBottom: 16 },
  input: { marginBottom: 12 },
  cardField: { height: 50, marginVertical: 12 },
  button: { marginTop: 8 },
  item: { marginBottom: 8 },
  empty: { textAlign: 'center', marginTop: 32, color: '#666' }
});