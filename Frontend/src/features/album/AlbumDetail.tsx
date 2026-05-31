import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLibrarySummary } from '../../services/api/tuneVaultApi';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { Album, MediaItem } from '../../types';

export default function AlbumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const playTrack = usePlayerStore((s) => s.playTrack);

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    void (async () => {
      setLoading(true);
      try {
        const data = await getLibrarySummary();
        const found = data.albums.find((a) => a.id === id) ?? null;
        const albumTracks = data.songs.filter((s) => s.albumId === id);
        if (!mounted) return;
        setAlbum(found);
        setTracks(albumTracks);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  if (!id) return <div className="p-6 text-white">ID album không hợp lệ.</div>;

  if (loading) return <div className="p-6 text-white">Đang tải...</div>;

  if (!album) {
    return (
      <div className="p-6 text-white">
        <button onClick={() => navigate(-1)} className="mb-4 text-neutral-300 hover:text-white">Quay lại</button>
        <div>Không tìm thấy album.</div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-48 h-48 bg-neutral-800 rounded overflow-hidden flex items-center justify-center">
          {album.coverImageUrl ? <img src={album.coverImageUrl} alt={album.title} className="w-full h-full object-cover" /> : <div className="text-neutral-400">No cover</div>}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{album.title}</h1>
          <p className="text-neutral-400 mt-1">{album.artistName}</p>
          <p className="text-neutral-500 mt-2">{album.releaseDate}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
        <h2 className="text-xl font-bold mb-4">Danh sách bài hát</h2>
        {tracks.length === 0 ? (
          <div className="text-neutral-400">Không có bài hát trong album này.</div>
        ) : (
          <div className="flex flex-col space-y-2">
            {tracks.map((t, idx) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-neutral-900/40">
                <div>
                  <div className="font-medium">{idx + 1}. {t.title}</div>
                  <div className="text-sm text-neutral-400">{t.artistName ?? 'TuneVault'} • {t.duration}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => playTrack(t, tracks)} className="px-3 py-1 bg-white text-black rounded">Phát</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
