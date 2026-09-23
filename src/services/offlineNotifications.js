import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const KEY = 'offline_events';

export const OfflineNotificationManager = {
  async addEvent(type, data) {
    const event = {
      id: `${type}_${Date.now()}`,
      type,
      data,
      timestamp: Date.now(),
      isProcessed: false
    };

    const events = [event, ...(await this.getEvents())].slice(0, 50);
    await AsyncStorage.setItem(KEY, JSON.stringify(events));

    await Notifications.scheduleNotificationAsync({
      content: {
        title: this.getTitle(type),
        body: this.getBody(type, data),
        data: event
      },
      trigger: null
    });

    return event;
  },

  async getEvents() {
    try {
      const data = await AsyncStorage.getItem(KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async syncEvents() {
    const events = await this.getEvents();
    const pending = events.filter(e => !e.isProcessed);
    let synced = 0;

    for (const event of pending) {
      try {
        synced++;
      } catch {}
    }

    if (synced > 0) {
      const remaining = events.filter(e => !e.isProcessed);
      await AsyncStorage.setItem(KEY, JSON.stringify(remaining));
    }

    return { synced };
  },

  getTitle(type) {
    const map = {
      payment_success: 'Платеж выполнен',
      payment_failed: 'Ошибка платежа',
      payout_requested: 'Заявка на вывод',
      low_balance: 'Низкий баланс'
    };
    return map[type] || 'Событие';
  },

  getBody(type, data) {
    switch (type) {
      case 'payment_success': return `Платеж на $${data.amount} успешен`;
      case 'payment_failed': return data.error || 'Ошибка платежа';
      case 'payout_requested': return `Заявка на $${data.amount} создана`;
      case 'low_balance': return 'Баланс меньше $100';
      default: return 'Новое событие';
    }
  }
};