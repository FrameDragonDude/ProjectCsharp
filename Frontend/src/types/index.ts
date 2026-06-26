export type MediaType = 'Audio' | 'Video';

export interface User {
	id: number;
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

export interface ArtistSummary extends Artist {
	albumCount: number;
	trackCount: number;
	coverImageUrl?: string | null;
	isFollowing?: boolean;
}

export interface Album {
	id: string;
	title: string;
	coverImageUrl?: string | null;
	description?: string | null;
	artistId: string;
	artistName?: string;
	releaseDate: string;
}

export interface MediaItem {
	id: string;
	title: string;
	filePath: string;
	description?: string | null;
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
	coverImageUrl?: string | null;
}

export interface LibrarySummary {
	songs: MediaItem[];
	albums: Album[];
	playlists: Playlist[];
}

export interface ArtistDetail {
	artist: ArtistSummary;
	albums: Album[];
	songs: MediaItem[];
}

export interface PlayHistory {
	id: string;
	mediaItemId: string;
	mediaTitle?: string | null;
	artistName?: string | null;
	coverImageUrl?: string | null;
	playedAt: string;
}

export interface SearchResult {
	id: string;
	title: string;
	subtitle: string;
	type: 'Song' | 'Video' | 'Album' | 'Playlist';
	mediaType?: MediaType;
	albumId?: string | null;
	filePath?: string;
	coverImageUrl?: string | null;
}

export interface FollowedEntity {
	id: number;
	name: string;
	avatarUrl: string | null;
	type: 'User' | 'Artist';
}
