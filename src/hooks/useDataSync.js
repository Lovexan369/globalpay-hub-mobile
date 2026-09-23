import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { DataSyncManager } from '../services/dataSync';

export const useDataSync = () => {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        DataSyncManager.sync();
      }
    });

    DataSyncManager.sync();
    return () => unsubscribe();
  }, []);
};