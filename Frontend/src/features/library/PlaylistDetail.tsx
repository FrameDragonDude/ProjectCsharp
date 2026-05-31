import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Heart, MoreHorizontal, Clock } from 'lucide-react';
import { getPlaylistById, getPlaylistTracks } from '../../services/api/tuneVaultApi';
import type { MediaItem, Playlist } from '../../types';

export default function PlaylistDetail() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!id) {
      return;
    }

    void Promise.all([getPlaylistById(id), getPlaylistTracks(id)]).then(([playlistData, trackData]) => {
      setPlaylist(playlistData ?? null);
      setTracks(trackData);
    });
  }, [id]);

  if (!playlist) {
    return (
      <div className="flex flex-col h-full overflow-hidden p-6 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-neutral-300">
          Không tìm thấy playlist.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-gradient-to-b from-blue-700 to-neutral-900 p-6 md:p-8 flex flex-col md:flex-row items-end space-y-4 md:space-y-0 md:space-x-6 shrink-0">
        <div className="w-48 h-48 md:w-56 md:h-56 bg-neutral-800 shadow-2xl rounded flex-shrink-0">
        </div>
        
        <div className="flex flex-col text-white">
          <span className="text-sm font-semibold uppercase tracking-wider mb-2">Playlist</span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 md:mb-6 line-clamp-2">{playlist.name}</h1>
          <p className="text-neutral-300 text-sm mb-2">{playlist.description ?? 'Không có mô tả'}</p>
          <div className="flex items-center text-sm font-medium">
            <span className="hover:underline cursor-pointer">{playlist.createdByUserId}</span>
            <span className="mx-1">•</span>
            <span>{playlist.isPublic ? 'Công khai' : 'Riêng tư'}</span>
            <span className="mx-1">•</span>
            <span>{tracks.length} bài hát</span>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/50 p-6 flex items-center space-x-6 shrink-0">
        <button className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-black hover:scale-105 hover:bg-green-400 transition transform shadow-lg">
          <Play size={24} className="ml-1" fill="black" />
        </button>
        <button className="text-neutral-400 hover:text-white transition">
          <Heart size={32} />
        </button>
        <button className="text-neutral-400 hover:text-white transition">
          <MoreHorizontal size={32} />
        </button>
      </div>

      <div className="px-6 pb-20 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[40px_minmax(200px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_60px] gap-4 px-4 py-2 border-b border-neutral-800 text-sm text-neutral-400 sticky top-0 bg-neutral-900 z-10">
          <div className="text-center">#</div>
          <div>Tiêu đề</div>
          <div className="hidden md:block">Album</div>
          <div className="hidden lg:block">Ngày thêm</div>
          <div className="flex justify-center"><Clock size={16} /></div>
        </div>

        <div className="mt-2 flex flex-col space-y-1">
          {tracks.map((track, index) => (
            <div 
              key={track.id} 
              className="grid grid-cols-[40px_minmax(200px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_60px] gap-4 px-4 py-3 rounded-md hover:bg-neutral-800/60 group transition items-center cursor-pointer text-sm"
            >
              <div className="text-center text-neutral-400 group-hover:hidden">
                {index + 1}
              </div>
              <div className="hidden group-hover:flex justify-center text-white">
                <Play size={16} fill="white" />
              </div>

              <div className="flex flex-col pr-4 overflow-hidden">
                <span className="text-white font-medium truncate">{track.title}</span>
                <span className="text-neutral-400 truncate hover:underline hover:text-white">{track.artistName ?? 'TuneVault'}</span>
              </div>

              <div className="hidden md:block text-neutral-400 truncate hover:underline hover:text-white">
                {track.albumTitle ?? '-'}
              </div>

              <div className="hidden lg:block text-neutral-400 truncate">
                {track.ownerId}
              </div>

              <div className="text-neutral-400 text-center">
                {track.duration}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}