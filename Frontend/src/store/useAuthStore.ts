import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role?: string | number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('tunevault_user') || 'null'),
  token: localStorage.getItem('tunevault_token'),
  isAuthenticated: !!localStorage.getItem('tunevault_token'),
  
  setAuth: (user, token) => {
    localStorage.setItem('tunevault_token', token);
    localStorage.setItem('tunevault_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('tunevault_token');
    localStorage.removeItem('tunevault_user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));