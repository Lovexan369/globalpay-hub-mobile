import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ErrorHandler } from './errorHandler';
import api from './api';

const SYNC_QUEUE_KEY = 'sync_queue';
const MAX_RETRY = 5;

export const DataSyncManager = {
  async queueOperation(operation) {
    const queue = await this.getQueue();
    const newOp = {
      id: `${operation.type}_${Date.now()}`,
      type: operation.type,
      payload: operation.payload,
      timestamp: Date.now(),
      attempts: 0,
      status: 'pending'
    };
    const updated = [newOp, ...queue].slice(0, 200);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
    return newOp;
  },

  async sync() {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return { synced: 0, failed: 0 };

    const queue = await this.getQueue();
    const pending = queue.filter(op => op.status === 'pending');
    if (pending.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const op of pending) {
      try {
        await this.execute(op);
        synced++;
      } catch (error) {
        ErrorHandler.logError(error, { opId: op.id });
        if (ErrorHandler.shouldRetry(error) && op.attempts < MAX_RETRY) {
          await this.markRetry(op.id);
        } else {
          await this.markFailed(op.id);
          failed++;
        }
      }
    }

    await this.cleanup();
    return { synced, failed };
  },

  async execute(op) {
    switch (op.type) {
      case 'create_payment':
        await api.post('/payments/create', op.payload);
        break;
      case 'create_payout':
        await api.post('/merchants/payout', op.payload);
        break;
      default:
        throw new Error(`Unknown operation: ${op.type}`);
    }
    await this.markSuccess(op.id);
  },

  async getQueue() {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async markSuccess(id) {
    const queue = await this.getQueue();
    const updated = queue.map(op => op.id === id ? { ...op, status: 'synced' } : op);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  },

  async markFailed(id) {
    const queue = await this.getQueue();
    const updated = queue.map(op => {
      if (op.id === id) {
        const attempts = (op.attempts || 0) + 1;
        return { ...op, status: attempts >= MAX_RETRY ? 'failed' : 'pending', attempts };
      }
      return op;
    });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  },

  async markRetry(id) {
    const queue = await this.getQueue();
    const updated = queue.map(op => op.id === id ? { ...op, attempts: (op.attempts || 0) + 1 } : op);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  },

  async cleanup() {
    const queue = await this.getQueue();
    const pending = queue.filter(op => op.status === 'pending');
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(pending));
  },

  async getStatus() {
    const queue = await this.getQueue();
    return {
      pending: queue.filter(op => op.status === 'pending').length,
      failed: queue.filter(op => op.status === 'failed').length
    };
  }
};