import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLibrarySummary, assignMediaToAlbum } from '../../services/api/tuneVaultApi';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { Album, MediaItem } from '../../types';
import { resolveAssetUrl } from '../../utils/resolveAsset';

export default function AlbumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<MediaItem[]>([]);
  const [allSongs, setAllSongs] = useState<MediaItem[]>([]);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const playTrack = usePlayerStore((s) => s.playTrack);
  // assignMediaToAlbum imported from services above

  useEffect(() => {
    if (!id) return;
    let mounted = true;

    void (async () => {
      setLoading(true);
      try {
        const data = await getLibrarySummary();
        const found = data.albums.find((a) => a.id === id) ?? null;
        const albumTracks = data.songs.filter((s) => s.albumId === id);
        const otherSongs = data.songs.filter((s) => s.albumId !== id);
        if (!mounted) return;
        setAlbum(found);
        setTracks(albumTracks);
        setAllSongs(otherSongs);
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
          {album.coverImageUrl ? <img src={resolveAssetUrl(album.coverImageUrl)} alt={album.title} className="w-full h-full object-cover" /> : <div className="text-neutral-400">No cover</div>}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{album.title}</h1>
          <p className="text-neutral-400 mt-1">{album.artistName}</p>
          <p className="text-neutral-500 mt-2">{album.releaseDate}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
        <h2 className="text-xl font-bold mb-4">Danh sách bài hát</h2>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Tìm bài để thêm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-neutral-800 text-white p-2 rounded flex-1"
            />
            <button
              disabled={!selectedSong || adding}
              onClick={async () => {
                if (!selectedSong) return;
                setAdding(true);
                try {
                  await assignMediaToAlbum(id, selectedSong);
                  const data = await getLibrarySummary();
                  setTracks(data.songs.filter((s) => s.albumId === id));
                  setAllSongs(data.songs.filter((s) => s.albumId !== id));
                  setSelectedSong(null);
                  setSearchTerm('');
                } catch (err) {
                  console.error(err);
                  const message = (err as any)?.response?.data ?? (err as any)?.message ?? 'Thêm bài vào album thất bại';
                  alert(String(message));
                } finally {
                  setAdding(false);
                }
              }}
              className="px-3 py-1 bg-white text-black rounded"
            >Thêm vào album</button>
          </div>

          <div className="mt-2 max-h-48 overflow-auto rounded bg-neutral-900/20">
            {(allSongs.filter((s) => {
              if (!searchTerm) return true;
              const q = searchTerm.toLowerCase();
              return s.title.toLowerCase().includes(q) || (s.artistName ?? '').toLowerCase().includes(q);
            }).slice(0, 200)).map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedSong(s.id)}
                className={`p-2 cursor-pointer flex items-center justify-between hover:bg-neutral-800/40 ${selectedSong === s.id ? 'bg-neutral-800/60' : ''}`}
              >
                <div className="truncate">{s.title} <span className="text-neutral-400">— {s.artistName ?? 'TuneVault'}</span></div>
                <div className="text-sm text-neutral-400">{s.duration}</div>
              </div>
            ))}
          </div>
          <div className="mt-1 text-sm text-neutral-400">{selectedSong ? `Đã chọn: ${allSongs.find(a => a.id === selectedSong)?.title ?? selectedSong}` : 'Chưa chọn bài'}</div>
        </div>
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
