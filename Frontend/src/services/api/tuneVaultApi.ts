import axiosClient from './axiosClient';
import type { ArtistDetail, ArtistSummary, LibrarySummary, MediaItem, Playlist, PlayHistory, SearchResult, FollowedEntity } from '../../types';

export async function getLibrarySummary(): Promise<LibrarySummary> {
  const response = await axiosClient.get<LibrarySummary>('/library/summary');
  return response.data;
}

export async function getMediaItemById(id: string | number): Promise<MediaItem | undefined> {
  const response = await axiosClient.get<MediaItem>(`/media/${id}`);
  return response.data;
}

export async function getPlaylistTracks(playlistId: string | number): Promise<MediaItem[]> {
  const response = await axiosClient.get<MediaItem[]>(`/playlists/${playlistId}/tracks`);
  return response.data;
}

export async function getPlaylistById(playlistId: string | number): Promise<Playlist | undefined> {
  const response = await axiosClient.get<Playlist>(`/playlists/${playlistId}`);
  return response.data;
}

export async function getArtists(): Promise<ArtistSummary[]> {
  const response = await axiosClient.get<ArtistSummary[]>('/artists');
  return response.data;
}

export async function getArtistById(id: string | number): Promise<ArtistDetail> {
  const response = await axiosClient.get<ArtistDetail>(`/artists/${id}`);
  return response.data;
}

export async function searchCatalog(query: string): Promise<SearchResult[]> {
  const response = await axiosClient.get<SearchResult[]>('/search', {
    params: { query },
  });

  return response.data;
}

export async function createPlaylist(name: string, description: string): Promise<Playlist> {
  const response = await axiosClient.post<Playlist>('/playlists/user', {
    name,
    description,
  });

  return response.data;
}

export async function getMyPlaylists(): Promise<Playlist[]> {
  const response = await axiosClient.get<Playlist[]>('/playlists/my-playlists');
  return response.data;
}

export async function addMediaToPlaylist(playlistId: string | number, mediaItemId: string | number): Promise<void> {
  await axiosClient.post('/playlists/add-track', {
    playlistId: Number(playlistId),
    mediaItemId: Number(mediaItemId),
  });
}

export async function removeMediaFromPlaylist(playlistId: string | number, mediaItemId: string | number): Promise<void> {
  await axiosClient.delete('/playlists/remove-track', {
    params: { playlistId: String(playlistId), mediaItemId: String(mediaItemId) },
  });
}

export async function getVideoItems(): Promise<MediaItem[]> {
  const response = await axiosClient.get<MediaItem[]>('/media/video');
  return response.data;
}

export async function recordPlayHistory(mediaItemId: string | number): Promise<void> {
  await axiosClient.post('/play-histories', {
    mediaItemId: Number(mediaItemId),
  });
}

export async function getRecentPlayHistories(): Promise<PlayHistory[]> {
  const response = await axiosClient.get<PlayHistory[]>('/play-histories/recent');
  return response.data;
}

export async function createAlbum(title: string, artistName: string, coverImageUrl?: string, releaseDate?: string) {
  const response = await axiosClient.post('/albums', {
    title,
    artistName,
    coverImageUrl: coverImageUrl ?? null,
    releaseDate: releaseDate ?? null,
  });

  return response.data as any;
}

export async function assignMediaToAlbum(albumId: string | number, mediaItemId: string | number) {
  await axiosClient.post(`/albums/${albumId}/tracks`, {
    mediaItemId: String(mediaItemId),
  });

  const response = await axiosClient.get('/library/summary');
  return response.data as any;
}

export async function uploadMediaItem(formData: FormData) {
  const response = await axiosClient.post('/mediaitems', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as any;
}

export async function login(emailOrUsername: string, password: string) {
  const response = await axiosClient.post('/auth/login', {
    emailOrUsername,
    password,
  });
  return response.data as { token: string; message: string };
}

export async function register(username: string, email: string, password: string, fullName: string) {
  const response = await axiosClient.post('/auth/register', {
    username,
    email,
    password,
    fullName,
  });
  return response.data as { userId: string; message: string };
}

export async function getProfile() {
  const response = await axiosClient.get('/user/profile');
  return response.data as { 
    id: string; 
    username: string; 
    email: string; 
    fullName: string; 
    bio: string; 
    avatarUrl: string; 
    location?: string; 
    website?: string; 
    followersCount: number; 
    followingCount: number;
    role?: string;
    roleId?: number;
  };
}

export async function updateProfile(fullName: string, bio: string, avatarUrl: string) {
  const response = await axiosClient.put('/user/profile', {
    fullName,
    bio,
    avatarUrl,
  });
  return response.data;
}

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await axiosClient.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.avatarUrl;
}

export async function getFavorites(): Promise<MediaItem[]> {
  const response = await axiosClient.get<MediaItem[]>('/favorites');
  return response.data;
}

export async function toggleFavorite(mediaItemId: string): Promise<{ isFavorite: boolean }> {
  const response = await axiosClient.post<{ isFavorite: boolean }>(`/favorites/toggle/${mediaItemId}`);
  return response.data;
}

export async function toggleFollow(targetId: string, type: 'User' | 'Artist' = 'Artist') {
  const response = await axiosClient.post(`/follow/${targetId}`, null, {
    params: { type },
  });
  return response.data;
}

export async function getFollowing(): Promise<FollowedEntity[]> {
  const response = await axiosClient.get<FollowedEntity[]>('/user/following');
  return response.data;
}

export async function changeUserRole(keyword: string, action: 'upgrade' | 'downgrade', artistName?: string) {
  const response = await axiosClient.post('/admin/change-role', {
    keyword,      
    action,
    artistName
  });
  return response.data;
}