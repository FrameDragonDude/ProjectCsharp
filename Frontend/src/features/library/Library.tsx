import { useEffect, useMemo, useState } from 'react';
import { Heart, Plus, Upload, ListMusic, Video, Music, Play } from 'lucide-react';
import { addMediaToPlaylist, createPlaylist, getLibrarySummary, createAlbum } from '../../services/api/tuneVaultApi';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { MediaItem, Playlist } from '../../types';

export default function Library() {
  const [activeTab, setActiveTab] = useState<'playlists' | 'uploads'>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songs, setSongs] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumArtist, setAlbumArtist] = useState('');
  const [albumRelease, setAlbumRelease] = useState('');
  const [targetTrack, setTargetTrack] = useState<MediaItem | null>(null);
  const [targetPlaylistId, setTargetPlaylistId] = useState('');
  const playTrack = usePlayerStore((state) => state.playTrack);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const data = await getLibrarySummary();
      setPlaylists(data.playlists);
      setSongs(data.songs);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không tải được dữ liệu từ API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLibrary();
  }, []);

  const visibleUploads = useMemo(() => songs.slice(0, 8), [songs]);

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      return;
    }

    await createPlaylist(playlistName.trim(), playlistDescription.trim());
    setPlaylistName('');
    setPlaylistDescription('');
    setCreateOpen(false);
    await loadLibrary();
  };

  const handleAddToPlaylist = async () => {
    if (!targetTrack || !targetPlaylistId) {
      return;
    }

    await addMediaToPlaylist(targetPlaylistId, targetTrack.id);
    setTargetTrack(null);
    setTargetPlaylistId('');
    await loadLibrary();
  };

  return (
    <div className="p-6 space-y-6 flex flex-col h-full text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeTab === 'playlists' ? 'bg-white text-black' : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
          >
            Danh sách phát
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeTab === 'uploads' ? 'bg-white text-black' : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
          >
            Đã tải lên
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center space-x-2 bg-transparent border border-neutral-600 hover:border-white px-3 py-1.5 rounded-full text-sm font-medium transition"
          >
            <Plus size={16} />
            <span>Tạo Playlist</span>
          </button>
          <button className="flex items-center space-x-2 bg-green-500 hover:bg-green-400 text-black px-3 py-1.5 rounded-full text-sm font-bold transition">
            <Upload size={16} />
            <span>Tải Media lên</span>
          </button>
          <button
            onClick={() => setCreateAlbumOpen(true)}
            className="flex items-center space-x-2 bg-transparent border border-neutral-600 hover:border-white px-3 py-1.5 rounded-full text-sm font-medium transition"
          >
            <Plus size={16} />
            <span>Tạo Album</span>
          </button>
        </div>
      </div>

      <div className="mt-4">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            Không tải được thư viện từ backend. {error}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="space-y-6">
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
            ) : playlists.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
                Chưa có playlist nào trong database.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="p-4 bg-neutral-800/40 hover:bg-neutral-800 rounded-md cursor-pointer transition group"
                >
                  <div className={`w-full aspect-square mb-4 rounded shadow-lg flex items-center justify-center ${
                    playlist.name.toLowerCase().includes('thích') ? 'bg-gradient-to-br from-indigo-600 to-blue-400' : 'bg-neutral-700'
                  }`}>
                    {playlist.name.toLowerCase().includes('thích') ? (
                      <Heart size={48} className="text-white" fill="white" />
                    ) : (
                      <ListMusic size={48} className="text-neutral-500" />
                    )}
                  </div>
                  <h4 className="font-semibold text-white truncate mb-1">{playlist.name}</h4>
                  <p className="text-sm text-neutral-400">{playlist.trackCount} bài hát</p>
                </div>
                ))}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Danh sách bài hát</h3>
                <p className="text-sm text-neutral-400">Bấm phát hoặc thêm vào playlist</p>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
              ) : songs.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
                  Chưa có bài hát nào trong database.
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  {songs.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-neutral-800/50 cursor-pointer group transition"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="w-12 h-12 bg-neutral-700 rounded flex items-center justify-center text-neutral-400 shrink-0">
                        {item.mediaType === 'Audio' ? <Music size={24} /> : <Video size={24} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-semibold truncate">{item.title}</p>
                        <p className="text-sm text-neutral-400 truncate">{item.artistName ?? 'TuneVault'} • {item.duration}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => playTrack(item, songs)}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-black hover:scale-[1.02] transition"
                      >
                        <Play size={14} />
                        Phát
                      </button>
                      <button
                        onClick={() => {
                          setTargetTrack(item);
                          setTargetPlaylistId(playlists[0]?.id ?? '');
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-neutral-600 px-3 py-1.5 text-sm font-medium hover:border-white transition"
                      >
                        <Plus size={14} />
                        Thêm vào danh sách phát
                      </button>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'uploads' && (
          <div className="flex flex-col space-y-2">
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
            ) : visibleUploads.length > 0 ? (
              visibleUploads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-neutral-800/50 cursor-pointer group transition"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-12 h-12 bg-neutral-700 rounded flex items-center justify-center text-neutral-400">
                      {item.mediaType === 'Audio' ? <Music size={24} /> : <Video size={24} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-semibold truncate">{item.title}</p>
                      <p className="text-sm text-neutral-400 capitalize truncate">{item.mediaType}</p>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-400">{item.duration}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-400 mt-10">
                <Upload size={48} className="mx-auto mb-4 opacity-50" />
                <p>Bạn chưa tải lên nội dung nào.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6">
            <h3 className="text-xl font-bold mb-4">Tạo Playlist</h3>
            <div className="space-y-4">
              <input
                value={playlistName}
                onChange={(event) => setPlaylistName(event.target.value)}
                placeholder="Tên playlist"
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <textarea
                value={playlistDescription}
                onChange={(event) => setPlaylistDescription(event.target.value)}
                placeholder="Mô tả"
                rows={4}
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setCreateOpen(false)} className="rounded-full border border-neutral-700 px-4 py-2 text-sm hover:border-white transition">
                  Hủy
                </button>
                <button onClick={() => void handleCreatePlaylist()} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:scale-[1.02] transition">
                  Tạo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {createAlbumOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6">
            <h3 className="text-xl font-bold mb-4">Tạo Album</h3>
            <div className="space-y-4">
              <input
                value={albumTitle}
                onChange={(event) => setAlbumTitle(event.target.value)}
                placeholder="Tên album"
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <input
                value={albumArtist}
                onChange={(event) => setAlbumArtist(event.target.value)}
                placeholder="Tên nghệ sĩ"
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <input
                value={albumRelease}
                onChange={(event) => setAlbumRelease(event.target.value)}
                placeholder="Ngày phát hành (YYYY-MM-DD)"
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setCreateAlbumOpen(false)} className="rounded-full border border-neutral-700 px-4 py-2 text-sm hover:border-white transition">
                  Hủy
                </button>
                <button
                  onClick={async () => {
                    if (!albumTitle.trim() || !albumArtist.trim()) return;
                    try {
                      await createAlbum(albumTitle.trim(), albumArtist.trim(), undefined, albumRelease.trim() || undefined);
                      setAlbumTitle('');
                      setAlbumArtist('');
                      setAlbumRelease('');
                      setCreateAlbumOpen(false);
                      await loadLibrary();
                    } catch (e) {
                      console.error('Tạo album thất bại', e);
                    }
                  }}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:scale-[1.02] transition"
                >
                  Tạo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {targetTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6">
            <h3 className="text-xl font-bold mb-2">Thêm vào danh sách phát</h3>
            <p className="text-sm text-neutral-400 mb-4 truncate">{targetTrack.title}</p>
            <div className="space-y-4">
              <select
                value={targetPlaylistId}
                onChange={(event) => setTargetPlaylistId(event.target.value)}
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {playlists.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>{playlist.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-3">
                <button onClick={() => setTargetTrack(null)} className="rounded-full border border-neutral-700 px-4 py-2 text-sm hover:border-white transition">
                  Hủy
                </button>
                <button onClick={() => void handleAddToPlaylist()} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:scale-[1.02] transition">
                  Thêm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}