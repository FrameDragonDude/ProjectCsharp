export type MediaType = 'Audio' | 'Video';

export interface User {
	id: string;
	username: string;
	fullName: string;
	email?: string;
	avatarUrl?: string | null;
}

export interface Artist {
	id: string;
	name: string;
	bio?: string | null;
	avatarUrl?: string | null;
}

export interface Album {
	id: string;
	title: string;
	coverImageUrl?: string | null;
	artistId: string;
	artistName?: string;
	releaseDate: string;
}

export interface MediaItem {
	id: string;
	title: string;
	filePath: string;
	duration: string;
	mediaType: MediaType;
	ownerId: string;
	albumId?: string | null;
	albumTitle?: string | null;
	artistName?: string | null;
	coverImageUrl?: string | null;
}

export interface Playlist {
	id: string;
	name: string;
	description?: string | null;
	isPublic: boolean;
	createdByUserId: string;
	trackCount: number;
}

export interface LibrarySummary {
	songs: MediaItem[];
	albums: Album[];
	playlists: Playlist[];
}

export interface SearchResult {
	id: string;
	title: string;
	subtitle: string;
	type: 'Song' | 'Album';
	mediaType?: MediaType;
	albumId?: string | null;
	filePath?: string;
	coverImageUrl?: string | null;
}
