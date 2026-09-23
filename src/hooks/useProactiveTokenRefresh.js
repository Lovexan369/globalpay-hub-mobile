import { useEffect } from 'react';
import AuthService from '../services/auth';

export const useProactiveTokenRefresh = () => {
  useEffect(() => {
    let interval;

    const start = async () => {
      await AuthService.proactiveRefreshToken();
      interval = setInterval(() => {
        AuthService.proactiveRefreshToken().catch(console.error);
      }, 120000);
    };

    start();
    return () => clearInterval(interval);
  }, []);
};