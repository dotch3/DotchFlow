// src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '../api/client';

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
        return data;
      } catch (err) {
        const msg = err.response?.data?.error || 'Erro ao fazer login';
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
        return data;
      } catch (err) {
        const msg = err.response?.data?.error || 'Erro ao registrar';
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
