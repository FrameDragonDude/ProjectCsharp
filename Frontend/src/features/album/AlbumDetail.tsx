import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { assignMediaToAlbum, getLibrarySummary } from '../../services/api/tuneVaultApi';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { Album, MediaItem } from '../../types';
import { resolveAssetUrl } from '../../utils/resolveAsset';
import { Send } from 'lucide-react';
import ShareModal from '../../components/ShareModal';

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
  const albumId = id ? String(id) : '';
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    void (async () => {
      setLoading(true);
      try {
        const data = await getLibrarySummary();
        const found = data.albums.find((a) => String(a.id) === albumId) ?? null;
        const albumTracks = data.songs.filter((s) => String(s.albumId ?? '') === albumId);
        const otherSongs = data.songs.filter((s) => String(s.albumId ?? '') !== albumId);

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
  }, [id, albumId]);

  if (!id) return <div className="p-6 text-white">Album id is invalid.</div>;
  if (loading) return <div className="p-6 text-white">Dang tai...</div>;

  if (!album) {
    return (
      <div className="p-6 text-white">
        <button onClick={() => navigate(-1)} className="mb-4 text-neutral-300 hover:text-white">
          Quay lai
        </button>
        <div>Khong tim thay album.</div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white">
      <div className="flex items-center gap-6 mb-6">
        <div className="w-48 h-48 bg-neutral-800 rounded overflow-hidden flex items-center justify-center">
          {album.coverImageUrl || tracks[0]?.coverImageUrl ? (
            <img
              src={resolveAssetUrl(album.coverImageUrl ?? tracks[0]?.coverImageUrl ?? '')}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-neutral-400">No cover</div>
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{album.title}</h1>
            <button
              onClick={() => setIsShareOpen(true)}
              className="p-1.5 text-neutral-400 hover:text-green-500 bg-neutral-800/50 hover:bg-neutral-800 rounded transition"
              title="Chia sẻ album"
            >
              <Send size={16} />
            </button>
          </div>

          <p className="text-neutral-400 mt-1">{album.artistName}</p>
          <p className="text-neutral-500 mt-2">{album.releaseDate}</p>
          {album.description && <p className="text-neutral-300 mt-2">{album.description}</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
        <h2 className="text-xl font-bold mb-4">Danh sach bai hat</h2>
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <input
              type="search"
              placeholder="Tim bai de them..."
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
                  await assignMediaToAlbum(albumId, selectedSong);
                  const data = await getLibrarySummary();
                  setTracks(data.songs.filter((s) => String(s.albumId ?? '') === albumId));
                  setAllSongs(data.songs.filter((s) => String(s.albumId ?? '') !== albumId));
                  setSelectedSong(null);
                  setSearchTerm('');
                } catch (err) {
                  console.error(err);
                  const message = (err as any)?.response?.data ?? (err as any)?.message ?? 'Them bai vao album that bai';
                  alert(String(message));
                } finally {
                  setAdding(false);
                }
              }}
              className="px-3 py-1 bg-white text-black rounded"
            >
              Them vao album
            </button>
          </div>

          <div className="mt-2 max-h-48 overflow-auto rounded bg-neutral-900/20">
            {allSongs
              .filter((s) => {
                if (!searchTerm) return true;
                const q = searchTerm.toLowerCase();
                return s.title.toLowerCase().includes(q) || (s.artistName ?? '').toLowerCase().includes(q);
              })
              .slice(0, 200)
              .map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedSong(String(s.id))}
                  className={`p-2 cursor-pointer flex items-center justify-between hover:bg-neutral-800/40 ${selectedSong === String(s.id) ? 'bg-neutral-800/60' : ''}`}
                >
                  <div className="truncate">
                    {s.title} <span className="text-neutral-400">- {s.artistName ?? 'TuneVault'}</span>
                  </div>
                  <div className="text-sm text-neutral-400">{s.duration}</div>
                </div>
              ))}
          </div>
          <div className="mt-1 text-sm text-neutral-400">
            {selectedSong ? `Da chon: ${allSongs.find((a) => String(a.id) === selectedSong)?.title ?? selectedSong}` : 'Chua chon bai'}
          </div>
        </div>

        {tracks.length === 0 ? (
          <div className="text-neutral-400">Khong co bai hat trong album nay.</div>
        ) : (
          <div className="flex flex-col space-y-2">
            {tracks.map((t, idx) => (
              <div key={t.id} className="flex items-center justify-between p-2 rounded hover:bg-neutral-900/40">
                <div>
                  <div className="font-medium">
                    {idx + 1}. {t.title}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {t.artistName ?? 'TuneVault'} • {t.duration}
                  </div>
                  {t.description && <div className="text-sm text-neutral-500">{t.description}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => playTrack(t, tracks)} className="px-3 py-1 bg-white text-black rounded">
                    Phat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

        <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        albumId={id}
        mediaTitle={album?.title || "Album"}
      />

    </div>
  );
}
