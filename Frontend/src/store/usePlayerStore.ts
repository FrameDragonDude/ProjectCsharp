import { create } from 'zustand';
import type { MediaItem } from '../types';
import { useAuthStore } from './useAuthStore';
import { recordPlayHistory as recordPlayHistoryApi } from '../services/api/tuneVaultApi';
import { getUserIdFromToken } from '../utils/authUtils';

const fallbackUserId = '2';

const recordPlayHistory = (mediaItemId: string) => {
	void recordPlayHistoryApi(mediaItemId).catch((error) => {
		console.error('Khong luu duoc lich su nghe:', error);
	});
};

interface PlayerState {
	currentTrack: MediaItem | null;
	isVideoOpen: boolean;
	queue: MediaItem[];
	queueIndex: number;
	isPlaying: boolean;
	volume: number;
	progress: number;
	duration: number;
	songForDetail: MediaItem | null;
	songDetailModalOpen: boolean;
	openSongDetailModal: () => void;
	closeSongDetailModal: () => void;
	playTrack: (track: MediaItem, queue?: MediaItem[]) => void;
	playQueue: (tracks: MediaItem[], startIndex?: number) => void;
	openVideo: (track: MediaItem) => void;
	closeVideo: () => void;
	pause: () => void;
	resume: () => void;
	togglePlay: () => void;
	next: () => void;
	previous: () => void;
	setVolume: (volume: number) => void;
	setProgress: (progress: number) => void;
	setDuration: (duration: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
	currentTrack: null,
	isVideoOpen: false,
	queue: [],
	queueIndex: 0,
	isPlaying: false,
	volume: 0.8,
	progress: 0,
	duration: 0,
	songForDetail: null,
	songDetailModalOpen: false,
	openSongDetailModal: () => set({ songDetailModalOpen: true }),
	closeSongDetailModal: () => set({ songDetailModalOpen: false }),
	playTrack: (track, queue) => {
		recordPlayHistory(track.id);
		set({
			currentTrack: track,
			songForDetail: track,
			queue: queue ?? [track],
			queueIndex: queue?.findIndex((item) => item.id === track.id) ?? 0,
			isPlaying: true,
			progress: 0,
			duration: 0,
		});
	},
	playQueue: (tracks, startIndex = 0) => {
		const nextTrack = tracks[startIndex] ?? null;
		if (nextTrack) {
			recordPlayHistory(nextTrack.id);
		}

		set({
			currentTrack: nextTrack,
			queue: tracks,
			queueIndex: startIndex,
			isPlaying: Boolean(nextTrack),
			progress: 0,
			duration: 0,
		});
	},
	openVideo: (track) => {
		recordPlayHistory(track.id);
		set({ currentTrack: track, isVideoOpen: true, isPlaying: false, progress: 0, duration: 0 });
	},
	closeVideo: () => set({ isVideoOpen: false }),
	pause: () => set({ isPlaying: false }),
	resume: () => set({ isPlaying: Boolean(get().currentTrack) }),
	togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying && Boolean(state.currentTrack) })),
	next: () => {
		const { queue, queueIndex } = get();
		const nextIndex = queueIndex + 1;
		const nextTrack = queue[nextIndex] ?? null;

		if (nextTrack) {
			recordPlayHistory(nextTrack.id);
		}

		set({
			currentTrack: nextTrack,
			queueIndex: nextIndex < queue.length ? nextIndex : queueIndex,
			isPlaying: Boolean(nextTrack),
			progress: 0,
		});
	},
	previous: () => {
		const { queue, queueIndex } = get();
		const previousIndex = Math.max(queueIndex - 1, 0);
		const previousTrack = queue[previousIndex] ?? null;

		if (previousTrack) {
			recordPlayHistory(previousTrack.id);
		}

		set({
			currentTrack: previousTrack,
			queueIndex: previousIndex,
			isPlaying: Boolean(previousTrack),
			progress: 0,
		});
	},
	setVolume: (volume) => set({ volume }),
	setProgress: (progress) => set({ progress }),
	setDuration: (duration) => set({ duration }),
}));
