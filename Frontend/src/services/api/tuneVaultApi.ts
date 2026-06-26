import axiosClient from './axiosClient';
import type { ArtistDetail, ArtistSummary, LibrarySummary, MediaItem, Playlist, PlayHistory, SearchResult } from '../../types';

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

export async function createPlaylist(name: string, description: string, createdByUserId?: string | number): Promise<Playlist> {
  const response = await axiosClient.post<Playlist>('/playlists', {
    name,
    description,
    createdByUserId: createdByUserId === undefined || createdByUserId === null ? null : Number(createdByUserId),
  });

  return response.data;
}

export async function addMediaToPlaylist(playlistId: string | number, mediaItemId: string | number): Promise<Playlist[]> {
  await axiosClient.post(`/playlists/${playlistId}/tracks`, {
    mediaItemId: String(mediaItemId),
  });

  const response = await axiosClient.get<LibrarySummary>('/library/summary');
  return response.data.playlists;
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

export async function recordPlayHistory(mediaItemId: string | number, userId?: string | number): Promise<void> {
  await axiosClient.post('/play-histories', {
    userId: userId === undefined || userId === null ? null : Number(userId),
    mediaItemId: Number(mediaItemId),
  });
}

export async function getRecentPlayHistories(userId: string | number = ''): Promise<PlayHistory[]> {
  const response = await axiosClient.get<PlayHistory[]>(`/play-histories/${String(userId)}/recent`);
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
  return response.data as { id: string; username: string; email: string; fullName: string; bio: string; avatarUrl: string; location?: string; website?: string };
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

export async function toggleFollow(targetId: string, type: 'User' | 'Artist' = 'Artist') {
  const response = await axiosClient.post(`/follow/${targetId}`, null, {
    params: { type },
  });
  return response.data;
}
