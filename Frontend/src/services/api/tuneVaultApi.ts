import axiosClient from './axiosClient';
import type { LibrarySummary, MediaItem, Playlist, SearchResult } from '../../types';

export async function getLibrarySummary(): Promise<LibrarySummary> {
  const response = await axiosClient.get<LibrarySummary>('/library/summary');
  return response.data;
}

export async function getMediaItemById(id: string): Promise<MediaItem | undefined> {
  const response = await axiosClient.get<MediaItem>(`/media/${id}`);
  return response.data;
}

export async function getPlaylistTracks(playlistId: string): Promise<MediaItem[]> {
  const response = await axiosClient.get<MediaItem[]>(`/playlists/${playlistId}/tracks`);
  return response.data;
}

export async function getPlaylistById(playlistId: string): Promise<Playlist | undefined> {
  const response = await axiosClient.get<Playlist>(`/playlists/${playlistId}`);
  return response.data;
}

export async function searchCatalog(query: string): Promise<SearchResult[]> {
  const response = await axiosClient.get<SearchResult[]>('/search', {
    params: { query },
  });

  return response.data;
}

export async function createPlaylist(name: string, description: string, createdByUserId = '22222222-2222-2222-2222-222222222222'): Promise<Playlist> {
  const response = await axiosClient.post<Playlist>('/playlists', {
    name,
    description,
    createdByUserId,
  });

  return response.data;
}

export async function addMediaToPlaylist(playlistId: string, mediaItemId: string): Promise<Playlist[]> {
  await axiosClient.post(`/playlists/${playlistId}/tracks`, {
    mediaItemId,
  });

  const response = await axiosClient.get<LibrarySummary>('/library/summary');
  return response.data.playlists;
}

export async function getVideoItems(): Promise<MediaItem[]> {
  const response = await axiosClient.get<MediaItem[]>('/media/video');
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