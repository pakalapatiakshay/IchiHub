import { create } from 'zustand';
import { api, setAccessToken } from '../lib/api';
import { useDataStore } from './dataStore';

export type Role = 'customer' | 'vendor' | 'admin';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone: string;
  lat?: number;
  lng?: number;
}

interface AuthState {
  user: User | null;
  isRestoring: boolean;
  login: (user: User) => void;
  authenticate: (input: { email: string; password: string; role: Role; name?: string; phone?: string; mode: 'login' | 'register' }) => Promise<User>;
  restoreSession: () => Promise<User | null>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null, // Start unauthenticated
  isRestoring: true,
  login: (user) => set({ user }),
  authenticate: async (input) => {
    const path = input.mode === 'login' ? '/auth/login' : '/auth/register';
    const payload = input.mode === 'login'
      ? { email: input.email, password: input.password, role: input.role }
      : { name: input.name, email: input.email, password: input.password, phone: input.phone, role: input.role };
    const response = await api<{ token: string; user: User }>(path, { method: 'POST', body: JSON.stringify(payload) });
    setAccessToken(response.token);
    set({ user: response.user, isRestoring: false });
    return response.user;
  },
  restoreSession: async () => {
    try {
      const response = await api<{ user: User }>('/auth/me');
      set({ user: response.user, isRestoring: false });
      return response.user;
    } catch {
      setAccessToken(null);
      set({ user: null, isRestoring: false });
      return null;
    }
  },
  logout: () => { useDataStore.getState().stopRealtime(); setAccessToken(null); set({ user: null, isRestoring: false }); },
}));
