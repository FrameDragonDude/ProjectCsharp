import { create } from 'zustand';
import type { MediaItem } from '../types';

interface PlayerState {
	currentTrack: MediaItem | null;
	queue: MediaItem[];
	queueIndex: number;
	isPlaying: boolean;
	volume: number;
	progress: number;
	duration: number;
	playTrack: (track: MediaItem, queue?: MediaItem[]) => void;
	playQueue: (tracks: MediaItem[], startIndex?: number) => void;
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
	queue: [],
	queueIndex: 0,
	isPlaying: false,
	volume: 0.8,
	progress: 0,
	duration: 0,
	playTrack: (track, queue) => set({
		currentTrack: track,
		queue: queue ?? [track],
		queueIndex: queue?.findIndex((item) => item.id === track.id) ?? 0,
		isPlaying: true,
		progress: 0,
		duration: 0,
	}),
	playQueue: (tracks, startIndex = 0) => {
		const nextTrack = tracks[startIndex] ?? null;

		set({
			currentTrack: nextTrack,
			queue: tracks,
			queueIndex: startIndex,
			isPlaying: Boolean(nextTrack),
			progress: 0,
			duration: 0,
		});
	},
	pause: () => set({ isPlaying: false }),
	resume: () => set({ isPlaying: Boolean(get().currentTrack) }),
	togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying && Boolean(state.currentTrack) })),
	next: () => {
		const { queue, queueIndex } = get();
		const nextIndex = queueIndex + 1;
		const nextTrack = queue[nextIndex] ?? null;

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
