import { create } from 'zustand';
import type { MediaItem } from '../types';
import { useAuthStore } from './useAuthStore';

const API_BASE_URL = 'http://localhost:5000/api';

const recordPlayHistory = (mediaItemId: string) => {
	const userId = useAuthStore.getState().user?.id;
	if (!userId) return;

	fetch(`${API_BASE_URL}/play-histories`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			userId: userId,
			mediaItemId: mediaItemId
		})
	}).catch(err => console.error("Lỗi khi lưu lịch sử nghe:", err));
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
	playTrack: (track, queue) => {
		console.log("Đã bấm nút Play! Đang chuẩn bị gọi API cho bài:", track.id); //test thu
		recordPlayHistory(track.id); // goi api luu lichsu
		set({
		currentTrack: track,
		queue: queue ?? [track],
		queueIndex: queue?.findIndex((item) => item.id === track.id) ?? 0,
		isPlaying: true,
		progress: 0,
		duration: 0,
	});
},
	playQueue: (tracks, startIndex = 0) => {
		const nextTrack = tracks[startIndex] ?? null;
		if(nextTrack) recordPlayHistory(nextTrack.id);

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

		if (nextTrack) recordPlayHistory(nextTrack.id);

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

		if (previousTrack) recordPlayHistory(previousTrack.id);

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
