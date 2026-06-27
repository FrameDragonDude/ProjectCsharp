import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Plus, Upload, ListMusic, Video, Music, Play } from 'lucide-react';
import { addMediaToPlaylist, createPlaylist, getLibrarySummary, createAlbum, getPlaylistTracks, uploadMediaItem } from '../../services/api/tuneVaultApi';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { MediaItem, Playlist } from '../../types';
import { resolveAssetUrl } from '../../utils/resolveAsset';

export default function Library() {
  const [activeTab, setActiveTab] = useState<'playlists' | 'uploads'>('playlists');
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [songs, setSongs] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [playlistCovers, setPlaylistCovers] = useState<Record<string, string | null>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [createAlbumOpen, setCreateAlbumOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState<'Audio' | 'Video'>('Audio');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [createPlaylistError, setCreatePlaylistError] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumArtist, setAlbumArtist] = useState('');
  const [albumRelease, setAlbumRelease] = useState('');
  const [targetTrack, setTargetTrack] = useState<MediaItem | null>(null);
  const [targetPlaylistId, setTargetPlaylistId] = useState('');
  const playTrack = usePlayerStore((state) => state.playTrack);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const loadLibrary = async () => {
    try {
      setLoading(true);
      const data = await getLibrarySummary();
      setPlaylists(data.playlists);
      setSongs(data.songs);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Khong tai duoc du lieu tu API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLibrary();
  }, []);

  useEffect(() => {
    const fetchMissingCovers = async () => {
      const missing = playlists.filter((p) => !p.coverImageUrl);
      if (missing.length === 0) return;

      const updates: Record<string, string | null> = {};
      await Promise.all(
        missing.map(async (p) => {
          try {
            const tracks = await getPlaylistTracks(String(p.id));
            updates[String(p.id)] = tracks[0]?.coverImageUrl ?? null;
          } catch {
            updates[String(p.id)] = null;
          }
        })
      );

      setPlaylistCovers((prev) => ({ ...prev, ...updates }));
    };

    void fetchMissingCovers();
  }, [playlists]);

  const visibleUploads = useMemo(() => songs.slice(0, 8), [songs]);

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      setCreatePlaylistError('Vui long nhap ten playlist.');
      return;
    }

    try {
      setCreatePlaylistError('');
      await createPlaylist(playlistName.trim(), playlistDescription.trim());      
      setPlaylistName('');
      setPlaylistDescription('');
      setCreateOpen(false);
      await loadLibrary();
    } catch (requestError) {
      setCreatePlaylistError(requestError instanceof Error ? requestError.message : 'Khong tao duoc playlist.');
    }
  };

  const handleAddToPlaylist = async () => {
    if (!targetTrack || !targetPlaylistId) {
      return;
    }

    try {
      await addMediaToPlaylist(String(targetPlaylistId), String(targetTrack.id));
      setTargetTrack(null);
      setTargetPlaylistId('');
      await loadLibrary();
    } catch (requestError) {
      alert(requestError instanceof Error ? requestError.message : 'Khong them duoc bai vao playlist.');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadTitle.trim()) {
      setUploadError('Vui long nhap ten media va chon file.');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');
      const formData = new FormData();
      formData.append('Title', uploadTitle.trim());
      formData.append('MediaType', uploadType);
      formData.append('File', uploadFile);

      await uploadMediaItem(formData);
      setUploadOpen(false);
      setUploadTitle('');
      setUploadFile(null);
      setUploadType('Audio');
      await loadLibrary();
    } catch (requestError) {
      setUploadError(requestError instanceof Error ? requestError.message : 'Khong tai len duoc media.');
    } finally {
      setUploading(false);
    }
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
            Playlists
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeTab === 'uploads' ? 'bg-white text-black' : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
          >
            Uploads
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center space-x-2 bg-transparent border border-neutral-600 hover:border-white px-3 py-1.5 rounded-full text-sm font-medium transition"
          >
            <Plus size={16} />
            <span>Create Playlist</span>
          </button>
          <button
            onClick={() => setUploadOpen(true)}
            className="flex items-center space-x-2 bg-green-500 hover:bg-green-400 text-black px-3 py-1.5 rounded-full text-sm font-bold transition"
          >
            <Upload size={16} />
            <span>Upload Media</span>
          </button>
          <button
            onClick={() => setCreateAlbumOpen(true)}
            className="flex items-center space-x-2 bg-transparent border border-neutral-600 hover:border-white px-3 py-1.5 rounded-full text-sm font-medium transition"
          >
            <Plus size={16} />
            <span>Create Album</span>
          </button>
        </div>
      </div>

      <div className="mt-4">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            Could not load library from backend. {error}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="space-y-6">
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Loading data...</div>
            ) : playlists.length === 0 ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
                No playlists in the database yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => navigate(`/playlist/${playlist.id}`)}
                    className="p-4 bg-neutral-800/40 hover:bg-neutral-800 rounded-md cursor-pointer transition group"
                  >
                    <div
                      className={`w-full aspect-square mb-4 rounded overflow-hidden shadow-lg flex items-center justify-center ${
                        playlist.name.toLowerCase().includes('thich') ? 'bg-gradient-to-br from-indigo-600 to-blue-400' : 'bg-neutral-700'
                      }`}
                    >
                      {playlist.coverImageUrl ?? playlistCovers[String(playlist.id)] ? (
                        <img
                          src={resolveAssetUrl(playlist.coverImageUrl ?? playlistCovers[String(playlist.id)] ?? '')}
                          alt={playlist.name}
                          className="h-full w-full object-cover"
                        />
                      ) : playlist.name.toLowerCase().includes('thich') ? (
                        <Heart size={48} className="text-white" fill="white" />
                      ) : (
                        <ListMusic size={48} className="text-neutral-500" />
                      )}
                    </div>
                    <h4 className="font-semibold text-white truncate mb-1">{playlist.name}</h4>
                    <p className="text-sm text-neutral-400">{playlist.trackCount} tracks</p>
                  </div>
                ))}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Song list</h3>
                <p className="text-sm text-neutral-400">Press play or add to a playlist</p>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Loading data...</div>
              ) : songs.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
                  No songs in the database yet.
                </div>
              ) : (
                <div className="flex flex-col space-y-2">
                  {songs.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-md hover:bg-neutral-800/50 cursor-pointer group transition"
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="w-12 h-12 bg-neutral-700 rounded overflow-hidden flex items-center justify-center text-neutral-400 shrink-0">
                          {item.coverImageUrl ? (
                            <img src={resolveAssetUrl(item.coverImageUrl)} alt={item.title} className="h-full w-full object-cover" />
                          ) : item.mediaType === 'Audio' ? (
                            <Music size={24} />
                          ) : (
                            <Video size={24} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold truncate">{item.title}</p>
                          <p className="text-sm text-neutral-400 truncate">
                            {item.artistName ?? 'TuneVault'} • {item.duration}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => playTrack(item, songs)}
                          className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-black hover:scale-[1.02] transition"
                        >
                          <Play size={14} />
                          Play
                        </button>
                        <button
                          onClick={() => {
                            setTargetTrack(item);
                            const myPlaylists = playlists.filter(p => String(p.createdByUserId) === String(user?.id));
                            setTargetPlaylistId(String(myPlaylists[0]?.id ?? ''));
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-neutral-600 px-3 py-1.5 text-sm font-medium hover:border-white transition"
                        >
                          <Plus size={14} />
                          Add to playlist
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
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Loading data...</div>
            ) : visibleUploads.length > 0 ? (
              visibleUploads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-neutral-800/50 cursor-pointer group transition"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-12 h-12 bg-neutral-700 rounded overflow-hidden flex items-center justify-center text-neutral-400">
                      {item.coverImageUrl ? (
                        <img src={resolveAssetUrl(item.coverImageUrl)} alt={item.title} className="h-full w-full object-cover" />
                      ) : item.mediaType === 'Audio' ? (
                        <Music size={24} />
                      ) : (
                        <Video size={24} />
                      )}
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
                <p>You have not uploaded anything yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6">
            <h3 className="text-xl font-bold mb-4">Create Playlist</h3>
            <div className="space-y-4">
              {createPlaylistError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {createPlaylistError}
                </div>
              )}
              <input
                value={playlistName}
                onChange={(event) => {
                  setPlaylistName(event.target.value);
                  setCreatePlaylistError('');
                }}
                placeholder="Playlist name"
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <textarea
                value={playlistDescription}
                onChange={(event) => setPlaylistDescription(event.target.value)}
                placeholder="Description"
                rows={4}
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setCreateOpen(false)} className="rounded-full border border-neutral-700 px-4 py-2 text-sm hover:border-white transition">
                  Cancel
                </button>
                <button onClick={() => void handleCreatePlaylist()} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:scale-[1.02] transition">
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6">
            <h3 className="text-xl font-bold mb-4">Upload Media</h3>
            <div className="space-y-4">
              {uploadError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {uploadError}
                </div>
              )}
              <input
                value={uploadTitle}
                onChange={(event) => {
                  setUploadTitle(event.target.value);
                  setUploadError('');
                }}
                placeholder="Media title"
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <select
                value={uploadType}
                onChange={(event) => setUploadType(event.target.value as 'Audio' | 'Video')}
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="Audio">Audio</option>
                <option value="Video">Video</option>
              </select>
              <input
                type="file"
                accept={uploadType === 'Video' ? 'video/*' : 'audio/*'}
                onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)}
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-3 file:py-1 file:text-black file:font-semibold"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setUploadOpen(false)} className="rounded-full border border-neutral-700 px-4 py-2 text-sm hover:border-white transition">
                  Cancel
                </button>
                <button onClick={() => void handleUpload()} disabled={uploading} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:scale-[1.02] transition disabled:opacity-60">
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {createAlbumOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6">
            <h3 className="text-xl font-bold mb-4">Create Album</h3>
            <div className="space-y-4">
              <input
                value={albumTitle}
                onChange={(event) => setAlbumTitle(event.target.value)}
                placeholder="Album title"
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <input
                value={albumArtist}
                onChange={(event) => setAlbumArtist(event.target.value)}
                placeholder="Artist name"
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <input
                value={albumRelease}
                onChange={(event) => setAlbumRelease(event.target.value)}
                placeholder="Release date (YYYY-MM-DD)"
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <div className="flex justify-end gap-3">
                <button onClick={() => setCreateAlbumOpen(false)} className="rounded-full border border-neutral-700 px-4 py-2 text-sm hover:border-white transition">
                  Cancel
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
                      console.error('Create album failed', e);
                    }
                  }}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:scale-[1.02] transition"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {targetTrack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950 p-6">
            <h3 className="text-xl font-bold mb-2">Add to playlist</h3>
            <p className="text-sm text-neutral-400 mb-4 truncate">{targetTrack.title}</p>
            <div className="space-y-4">
              <select
                value={targetPlaylistId}
                onChange={(event) => setTargetPlaylistId(event.target.value)}
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                {playlists.filter(playlist => String(playlist.createdByUserId) === String(user?.id)).length === 0 ? (
                  <option value="" disabled>Bạn chưa tạo playlist nào</option>
                ) : (
                  playlists
                    .filter(playlist => String(playlist.createdByUserId) === String(user?.id))
                    .map((playlist) => (
                      <option key={playlist.id} value={String(playlist.id)}>
                        {playlist.name}
                      </option>
                    ))
                )}
              </select>
              <div className="flex justify-end gap-3">
                <button onClick={() => setTargetTrack(null)} className="rounded-full border border-neutral-700 px-4 py-2 text-sm hover:border-white transition">
                  Cancel
                </button>
                <button onClick={() => void handleAddToPlaylist()} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:scale-[1.02] transition">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
