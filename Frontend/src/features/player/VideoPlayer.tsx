import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Video } from 'lucide-react';
import { getMediaItemById } from '../../services/api/tuneVaultApi';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { MediaItem } from '../../types';

const formatTime = (seconds: number) => {
  const safeSeconds = Number.isFinite(seconds) ? Math.max(seconds, 0) : 0;
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = Math.floor(safeSeconds % 60);

  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
};

export default function VideoPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);

  useEffect(() => {
    if (!id) {
      return;
    }

    void getMediaItemById(id).then((item) => {
      if (item) {
        setMediaItem(item);
        playTrack(item, [item]);
      }
    });
  }, [id, playTrack]);

  // resolve src and try fallback if original 404s
  useEffect(() => {
    if (!mediaItem?.filePath) {
      setResolvedSrc(null);
      return;
    }

    (async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
      const backendBase = apiBase.replace(/\/api\/?$/, '');

      let candidate = mediaItem.filePath;
      if (!/^https?:\/\//i.test(candidate)) {
        if (!candidate.startsWith('/')) candidate = `/${candidate}`;
        candidate = `${backendBase}${candidate}`;
      }

      try {
        const head = await fetch(candidate, { method: 'HEAD' });
        if (head.ok) {
          setResolvedSrc(candidate);
          return;
        }
      } catch (e) {
        // ignore and try fallback
      }

      // fallback: try switching /video/ -> /audio/ if present
      if (candidate.includes('/storage/video/')) {
        const alt = candidate.replace('/storage/video/', '/storage/audio/');
        try {
          const head2 = await fetch(alt, { method: 'HEAD' });
          if (head2.ok) {
            setResolvedSrc(alt);
            return;
          }
        } catch (e) {
          // ignore
        }
      }

      // final fallback: set original candidate anyway (will show 404 in network)
      setResolvedSrc(candidate);
    })();
  }, [mediaItem]);

  if (!mediaItem) {
    return (
      <div className="p-6 text-white">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-neutral-300 hover:text-white transition mb-6">
          <ArrowLeft size={18} /> Quay lại
        </button>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <Video size={48} className="mx-auto mb-4 text-neutral-400" />
          <h1 className="text-2xl font-bold mb-2">Không tìm thấy video</h1>
          <p className="text-neutral-400">Video này chưa có trong dữ liệu mock hoặc id không hợp lệ.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-neutral-300 hover:text-white transition">
        <ArrowLeft size={18} /> Quay lại
      </button>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-950 to-neutral-900 p-4 md:p-6">
          <div className="aspect-video overflow-hidden rounded-2xl bg-black flex items-center justify-center border border-white/10">
            {resolvedSrc ? (
              <video key={resolvedSrc} controls className="h-full w-full object-contain" poster={mediaItem.coverImageUrl ?? undefined}>
                <source src={resolvedSrc} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            ) : mediaItem.filePath ? (
              <div className="text-center text-neutral-400">
                <Video size={48} className="mx-auto mb-4" />
                Đang tải video...
              </div>
            ) : (
              <div className="text-center text-neutral-400">
                <Video size={48} className="mx-auto mb-4" />
                Không có nguồn video
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-neutral-400">Video Player riêng biệt</p>
              <h1 className="text-3xl font-bold">{mediaItem.title}</h1>
              <p className="text-neutral-400 mt-1">{mediaItem.artistName ?? 'TuneVault'} • {formatTime(Number.parseInt(mediaItem.duration.split(':')[0], 10) * 60 + Number.parseInt(mediaItem.duration.split(':')[1], 10))}</p>
            </div>

            <button onClick={() => togglePlay()} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:scale-[1.02] transition w-fit">
              <Play size={16} />
              {isPlaying && currentTrack?.id === mediaItem.id ? 'Tạm dừng' : 'Phát'}
            </button>
          </div>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <h2 className="text-xl font-bold">Thông tin video</h2>
          <div className="space-y-3 text-sm text-neutral-300">
            <p><span className="text-neutral-500">Định dạng:</span> {mediaItem.mediaType}</p>
            <p><span className="text-neutral-500">Thời lượng:</span> {mediaItem.duration}</p>
            <p className="break-all"><span className="text-neutral-500">File:</span> {mediaItem.filePath}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}