import { useEffect, useState, type MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Heart, Image as ImageIcon, MoreHorizontal, Play, Trash2 } from 'lucide-react';
import { getPlaylistById, getPlaylistTracks, removeMediaFromPlaylist } from '../../services/api/tuneVaultApi';
import type { MediaItem, Playlist } from '../../types';
import { usePlayerStore } from '../../store/usePlayerStore';
import { resolveAssetUrl } from '../../utils/resolveAsset';

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<MediaItem[]>([]);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const playlistId = id ? String(id) : '';

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      try {
        const [playlistData, trackData] = await Promise.all([getPlaylistById(playlistId), getPlaylistTracks(playlistId)]);
        setPlaylist(playlistData ?? null);
        setTracks(trackData);
      } catch (error) {
        console.error('Failed to load playlist data:', error);
      }
    };

    void loadData();
  }, [id, playlistId]);

  const handleRemoveTrack = async (e: MouseEvent<HTMLButtonElement>, mediaItemId: string) => {
    e.stopPropagation();
    if (!playlistId) return;

    try {
      await removeMediaFromPlaylist(playlistId, mediaItemId);
      setTracks((prev) => prev.filter((t) => String(t.id) !== String(mediaItemId)));
    } catch (error) {
      console.error('Failed to remove track:', error);
      alert('Failed to remove track.');
    }
  };

  const handlePlayTrack = (track: MediaItem) => {
    playTrack(track, tracks);
  };

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrack(tracks[0], tracks);
    }
  };

  if (!playlist) {
    return (
      <div className="flex flex-col h-full overflow-hidden p-6 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-neutral-300">
          Khong tim thay playlist.
        </div>
      </div>
    );
  }

  const coverUrl = playlist.coverImageUrl
    ? resolveAssetUrl(playlist.coverImageUrl)
    : tracks[0]?.coverImageUrl
      ? resolveAssetUrl(tracks[0].coverImageUrl)
      : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="bg-gradient-to-b from-blue-700 to-neutral-900 p-6 md:p-8 flex flex-col md:flex-row items-end space-y-4 md:space-y-0 md:space-x-6 shrink-0 relative pt-12">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition"
          title="Quay lai"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="w-48 h-48 md:w-56 md:h-56 bg-neutral-800 shadow-2xl rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
          {coverUrl ? (
            <img src={coverUrl} alt={playlist.name} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon size={64} className="text-neutral-600" />
          )}
        </div>

        <div className="flex flex-col text-white">
          <span className="text-sm font-semibold uppercase tracking-wider mb-2">Playlist</span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 md:mb-6 line-clamp-2">{playlist.name}</h1>
          <p className="text-neutral-300 text-sm mb-2">{playlist.description ?? 'Khong co mo ta'}</p>
          <div className="flex items-center text-sm font-medium">
            <span className="hover:underline cursor-pointer">{playlist.createdByUserId}</span>
            <span className="mx-1">•</span>
            <span>{playlist.isPublic ? 'Cong khai' : 'Rieng tu'}</span>
            <span className="mx-1">•</span>
            <span>{tracks.length} bai hat</span>
          </div>
        </div>
      </div>

      <div className="bg-neutral-900/50 p-6 flex items-center space-x-6 shrink-0">
        <button
          onClick={handlePlayAll}
          className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-black hover:scale-105 hover:bg-green-400 transition transform shadow-lg"
          title="Phat tat ca"
        >
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
        <div className="grid grid-cols-[40px_minmax(200px,1fr)_minmax(120px,1fr)_60px_40px] gap-4 px-4 py-2 border-b border-neutral-800 text-sm text-neutral-400 sticky top-0 bg-neutral-900 z-10">
          <div className="text-center">#</div>
          <div>Tieu de</div>
          <div className="hidden md:block">Album</div>
          <div className="flex justify-center">
            <Clock size={16} />
          </div>
          <div></div>
        </div>

        <div className="mt-2 flex flex-col space-y-1">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              onClick={() => handlePlayTrack(track)}
              className="grid grid-cols-[40px_minmax(200px,1fr)_minmax(120px,1fr)_60px_40px] gap-4 px-4 py-3 rounded-md hover:bg-neutral-800/60 group transition items-center cursor-pointer text-sm"
            >
              <div className="text-center text-neutral-400 group-hover:hidden">{index + 1}</div>
              <div className="hidden group-hover:flex justify-center text-white">
                <Play size={16} fill="white" />
              </div>

              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-10 h-10 bg-neutral-800 rounded shrink-0 flex items-center justify-center overflow-hidden">
                  {track.coverImageUrl ? (
                    <img src={resolveAssetUrl(track.coverImageUrl)} alt={track.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={16} className="text-neutral-500" />
                  )}
                </div>
                <div className="flex flex-col pr-4 overflow-hidden">
                  <span className="text-white font-medium truncate">{track.title}</span>
                  <span className="text-neutral-400 truncate hover:underline hover:text-white">{track.artistName ?? 'TuneVault'}</span>
                </div>
              </div>

              <div className="hidden md:block text-neutral-400 truncate hover:underline hover:text-white">{track.albumTitle ?? '-'}</div>

              <div className="text-neutral-400 text-center">{track.duration}</div>

              <div className="flex justify-center">
                <button
                  onClick={(e) => void handleRemoveTrack(e, String(track.id))}
                  className="text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  title="Xoa khoi playlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
