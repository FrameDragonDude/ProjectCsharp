import { useEffect, useState } from 'react';
import { Album, Music2, Play, Plus, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLibrarySummary } from '../../services/api/tuneVaultApi';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { Album as AlbumType, MediaItem } from '../../types';

export default function Home() {
  const [songs, setSongs] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<AlbumType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const playTrack = usePlayerStore((state) => state.playTrack);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const data = await getLibrarySummary();
        setSongs(data.songs);
        setAlbums(data.albums);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Không tải được dữ liệu từ API');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-10 text-white">
      <section>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-400 mb-2">Tuần này</p>
            <h2 className="text-3xl font-bold">Danh sách bài hát</h2>
          </div>
          <Link to="/library" className="text-sm text-neutral-300 hover:text-white transition">
            Mở thư viện
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            Không tải được dữ liệu bài hát. {error}
          </div>
        ) : songs.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
            Chưa có bài hát nào trong database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {songs.slice(0, 6).map((song) => (
            <div key={song.id} className="group rounded-2xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shrink-0">
                  {song.mediaType === 'Video' ? <Video size={24} /> : <Music2 size={24} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold truncate">{song.title}</p>
                  <p className="text-sm text-neutral-400 truncate">{song.artistName ?? 'TuneVault'} • {song.duration}</p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => playTrack(song, songs)}
                      className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:scale-[1.02] transition"
                    >
                      <Play size={16} /> Phát
                    </button>
                    <Link
                      to={song.mediaType === 'Video' ? `/video/${song.id}` : '/library'}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 hover:text-white hover:border-white/30 transition"
                    >
                      <Plus size={16} />
                      {song.mediaType === 'Video' ? 'Xem video' : 'Thêm vào playlist'}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-400 mb-2">Album</p>
            <h3 className="text-2xl font-bold">Danh sách Album</h3>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            Không tải được dữ liệu album. {error}
          </div>
        ) : albums.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
            Chưa có album nào trong database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {albums.map((album) => (
            <Link key={album.id} to={`/album/${album.id}`} className="block rounded-2xl border border-white/5 bg-neutral-950/60 p-4 hover:bg-neutral-950 transition">
              <div className="aspect-square rounded-xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center text-neutral-400">
                {album.coverImageUrl ? (
                  <img src={album.coverImageUrl} alt={album.title} className="h-full w-full object-cover" />
                ) : (
                  <Album size={42} />
                )}
              </div>
              <p className="text-lg font-semibold truncate">{album.title}</p>
              <p className="text-sm text-neutral-400 truncate">{album.artistName ?? 'TuneVault'} • {album.releaseDate}</p>
            </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}