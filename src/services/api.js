import axios from 'axios';
import AuthService from './auth';
import { API_BASE_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000
});

api.interceptors.request.use(async (config) => {
  const token = await AuthService.getValidToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await AuthService.refreshToken();
      } catch {
        await AuthService.clearAuthData();
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  refresh: (data) => api.post('/auth/refresh', data).then(r => r.data)
};

export const paymentsApi = {
  createPayment: (data) => api.post('/payments/create', data).then(r => r.data),
  getPayments: (params) => api.get('/payments', { params }).then(r => r.data),
  getPayment: (id) => api.get(`/payments/${id}`).then(r => r.data)
};

export const merchantApi = {
  getBalance: () => api.get('/merchants/balance').then(r => r.data),
  createPayout: (data) => api.post('/merchants/payout', data).then(r => r.data)
};

export default api;