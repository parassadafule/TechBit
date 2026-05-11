import axios from 'axios';
import { getResolvedApiBaseUrl } from './apiEnv';

const API_URL = getResolvedApiBaseUrl();
const AUTH_TOKEN_KEY = 'techbit_auth_token';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 10 seconds timeout
});

api.interceptors.request.use(
  (config) => {
    const token = window.localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authTokenKey = AUTH_TOKEN_KEY;
export default api;
