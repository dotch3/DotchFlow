// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';
import * as api from '../api/client';

// The backend always returns { error: "string" }, but other layers in front
// of it (Vercel's own platform 404, a proxy timeout, etc.) can return
// { error: { code, message } } or plain text instead. Normalize to a
// string so we never hand React an object as a child (React error #31).
function extractErrorMessage(err, fallback) {
  const raw = err.response?.data?.error;
  if (typeof raw === 'string' && raw) return raw;
  if (raw && typeof raw === 'object' && typeof raw.message === 'string') return raw.message;
  return fallback;
}

const useAuthStore = create(persist(
  (set, get) => ({
    user: null,
    token: null,
    isLoading: false,
    error: null,

    login: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const data = await api.login(email, password);
        localStorage.setItem('dotchflow_token', data.token);
        set({ user: data.user, token: data.token, isLoading: false });
        if (data.user?.language) {
          i18n.changeLanguage(data.user.language);
        }
        return data;
      } catch (err) {
        const msg = extractErrorMessage(err, i18n.t('auth.loginError', 'Error logging in'));
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    register: async (email, password) => {
      set({ isLoading: true, error: null });
      try {
        const data = await api.register(email, password);
        localStorage.setItem('dotchflow_token', data.token);
        set({ user: data.user, token: data.token, isLoading: false });
        if (data.user?.language) {
          i18n.changeLanguage(data.user.language);
        }
        return data;
      } catch (err) {
        const msg = extractErrorMessage(err, i18n.t('auth.registerError', 'Error registering'));
        set({ error: msg, isLoading: false });
        throw new Error(msg);
      }
    },

    logout: () => {
      localStorage.removeItem('dotchflow_token');
      set({ user: null, token: null });
    },

    refreshUser: async () => {
      try {
        const data = await api.getMe();
        set({ user: data.user });
      } catch (err) {
        // If error, token is likely invalid — log out
        get().logout();
      }
    },

    updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
  }),
  {
    name: 'dotchflow-auth',
    partialize: (state) => ({ token: state.token, user: state.user }),
  }
));

export default useAuthStore;
