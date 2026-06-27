import { create } from 'zustand';
import { getUserRoleFromToken } from '../utils/authUtils';

interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('tunevault_token'),
  isAuthenticated: !!localStorage.getItem('tunevault_token'),
  role: getUserRoleFromToken(),
  
  setAuth: (user, token) => {
    localStorage.setItem('tunevault_token', token);
    set({ user, token, isAuthenticated: true, role: getUserRoleFromToken() });
  },
  
  logout: () => {
    localStorage.removeItem('tunevault_token');
    set({ user: null, token: null, isAuthenticated: false, role: null });
  },
}));