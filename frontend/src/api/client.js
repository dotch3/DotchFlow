// src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dotchflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dotchflow_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const register = (email, password) =>
  api.post('/auth/register', { email, password }).then(r => r.data);
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then(r => r.data);
export const getMe = () =>
  api.get('/auth/me').then(r => r.data);
export const changeLanguage = (language) =>
  api.put('/auth/language', { language }).then(r => r.data);

// --- Gamification ---
export const checkin = () =>
  api.post('/gamification/checkin').then(r => r.data);
export const getGamificationStatus = () =>
  api.get('/gamification/status').then(r => r.data);

// --- Finance ---
export const getHealth = (year, month) =>
  api.get('/finance/health', { params: { year, month } }).then(r => r.data);
export const getForecast = () =>
  api.get('/finance/forecast').then(r => r.data);

// --- Transactions ---
export const getTransactions = (params = {}) =>
  api.get('/transactions', { params }).then(r => r.data);
export const createTransaction = (data) =>
  api.post('/transactions', data).then(r => r.data);
export const updateTransaction = (id, data) =>
  api.put(`/transactions/${id}`, data).then(r => r.data);
export const deleteTransaction = (id) =>
  api.delete(`/transactions/${id}`).then(r => r.data);

// --- Categories ---
export const getCategories = () =>
  api.get('/categories').then(r => r.data);
export const createCategory = (data) =>
  api.post('/categories', data).then(r => r.data);
export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data).then(r => r.data);
export const deleteCategory = (id) =>
  api.delete(`/categories/${id}`).then(r => r.data);

// --- Goals ---
export const getGoals = () =>
  api.get('/goals').then(r => r.data);
export const createGoal = (data) =>
  api.post('/goals', data).then(r => r.data);
export const depositGoal = (id, amount) =>
  api.post(`/goals/${id}/deposit`, { amount }).then(r => r.data);
export const deleteGoal = (id) =>
  api.delete(`/goals/${id}`).then(r => r.data);

// --- Store ---
export const getStore = () =>
  api.get('/store').then(r => r.data);
export const unlockItem = (store_item_id) =>
  api.post('/store/unlock', { store_item_id }).then(r => r.data);

export default api;
