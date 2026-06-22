import { create } from 'zustand';
import { getFavorites, toggleFavorite as apiToggleFavorite } from '../services/api/tuneVaultApi';
import type { MediaItem } from '../types';

interface FavoriteState {
  favorites: Record<string, boolean>;
  isLoading: boolean;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (mediaItemId: string) => Promise<void>;
  isFavorite: (mediaItemId: string) => boolean;
}

export const useFavoriteStore = create<FavoriteState>((set, get) => ({
  favorites: {},
  isLoading: false,
  fetchFavorites: async () => {
    set({ isLoading: true });
    try {
      const items = await getFavorites();
      const favMap: Record<string, boolean> = {};
      items.forEach((item: MediaItem) => {
        favMap[item.id] = true;
      });
      set({ favorites: favMap, isLoading: false });
    } catch (error) {
      console.error(error);
      set({ isLoading: false });
    }
  },
  toggleFavorite: async (mediaItemId: string) => {
    try {
      // Optimistic update
      const prev = get().favorites[mediaItemId];
      set((state) => ({
        favorites: {
          ...state.favorites,
          [mediaItemId]: !prev
        }
      }));

      const res = await apiToggleFavorite(mediaItemId);
      
      // Update with real server state
      set((state) => ({
        favorites: {
          ...state.favorites,
          [mediaItemId]: res.isFavorite
        }
      }));
    } catch (error) {
      console.error(error);
      // Revert on error
      const prev = get().favorites[mediaItemId];
      set((state) => ({
        favorites: {
          ...state.favorites,
          [mediaItemId]: !prev
        }
      }));
    }
  },
  isFavorite: (mediaItemId: string) => {
    return !!get().favorites[mediaItemId];
  }
}));
