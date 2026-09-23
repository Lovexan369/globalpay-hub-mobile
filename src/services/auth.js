import * as SecureStore from 'expo-secure-store';
import { authApi } from './api';

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

const JwtUtils = {
  decodeToken(token) {
    try {
      if (!token) return null;
      const payload = token.split('.')[1];
      if (!payload) return null;
      const padded = this.padBase64(payload);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  },

  padBase64(str) {
    switch (str.length % 4) {
      case 2: return str + '==';
      case 3: return str + '=';
      default: return str;
    }
  },

  getTokenPayload(token) {
    const payload = this.decodeToken(token);
    if (!payload) return null;
    return {
      userId: payload.sub || payload.userId,
      email: payload.email,
      role: payload.role,
      merchantId: payload.merchantId,
      exp: payload.exp,
      iat: payload.iat
    };
  },

  isTokenValid(token) {
    const payload = this.decodeToken(token);
    if (!payload?.exp) return false;
    return payload.exp > Math.floor(Date.now() / 1000);
  },

  shouldRefreshToken(token) {
    const payload = this.decodeToken(token);
    if (!payload?.exp) return false;
    return payload.exp - Math.floor(Date.now() / 1000) < 300;
  }
};

export const AuthService = {
  async login(email, password) {
    const response = await authApi.login({ email, password });
    if (!response.token) throw new Error('Токен не получен');

    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    if (response.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
    }

    const userInfo = JwtUtils.getTokenPayload(response.token);
    if (userInfo) {
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userInfo));
    }

    return { success: true, userInfo };
  },

  async register(userData) {
    const response = await authApi.register(userData);
    if (!response.token) throw new Error('Токен не получен');

    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    if (response.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
    }

    const userInfo = JwtUtils.getTokenPayload(response.token);
    if (userInfo) {
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userInfo));
    }

    return { success: true, userInfo };
  },

  async refreshToken() {
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('Нет refresh токена');

    const response = await authApi.refresh({ refreshToken });
    if (!response.token) throw new Error('Не удалось обновить токен');

    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    if (response.refreshToken) {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, response.refreshToken);
    }

    const userInfo = JwtUtils.getTokenPayload(response.token);
    if (userInfo) {
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(userInfo));
    }

    return true;
  },

  async proactiveRefreshToken() {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token || !JwtUtils.shouldRefreshToken(token)) return false;
    return this.refreshToken();
  },

  async getValidToken() {
    let token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return null;

    if (JwtUtils.shouldRefreshToken(token)) {
      try {
        await this.proactiveRefreshToken();
        token = await SecureStore.getItemAsync(TOKEN_KEY);
      } catch {
        return null;
      }
    }

    return token;
  },

  async isAuthenticated() {
    const token = await this.getValidToken();
    return !!token && JwtUtils.isTokenValid(token);
  },

  async getCurrentUserInfo() {
    const token = await this.getValidToken();
    return token ? JwtUtils.getTokenPayload(token) : null;
  },

  async isMerchant() {
    const info = await this.getCurrentUserInfo();
    return info?.role === 'merchant';
  },

  async logout() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_DATA_KEY);
  },

  async clearAuthData() {
    await this.logout();
  }
};

export default AuthService;