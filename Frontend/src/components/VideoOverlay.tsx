import { useEffect, useRef, useState } from 'react';
import { X, Video } from 'lucide-react';
import { usePlayerStore } from '../store/usePlayerStore';
import { resolveAssetUrl } from '../utils/resolveAsset';

export default function VideoOverlay() {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isVideoOpen = usePlayerStore((state) => state.isVideoOpen);
  const closeVideo = usePlayerStore((state) => state.closeVideo);
  const pauseAudio = usePlayerStore((state) => state.pause);
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isVideoOpen || currentTrack?.mediaType !== 'Video' || !currentTrack.filePath) {
      setResolvedSrc(null);
      return;
    }

    void (async () => {
      const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
      const backendBase = apiBase.replace(/\/api\/?$/, '');

      let candidate = currentTrack.filePath;
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
      } catch {
        // ignore and try fallback
      }

      if (candidate.includes('/storage/video/')) {
        const alt = candidate.replace('/storage/video/', '/storage/audio/');
        try {
          const head2 = await fetch(alt, { method: 'HEAD' });
          if (head2.ok) {
            setResolvedSrc(alt);
            return;
          }
        } catch {
          // ignore
        }
      }

      setResolvedSrc(candidate);
    })();
  }, [isVideoOpen, currentTrack]);

  useEffect(() => {
    if (!isVideoOpen) {
      setIsVideoPlaying(false);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeVideo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    pauseAudio();

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isVideoOpen, closeVideo, pauseAudio]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      setIsVideoPlaying(true);
      pauseAudio();
    };
    const onPause = () => setIsVideoPlaying(false);
    const onEnded = () => setIsVideoPlaying(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  }, [pauseAudio, resolvedSrc]);

  if (!isVideoOpen || currentTrack?.mediaType !== 'Video') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Video Player</p>
            <h2 className="text-lg font-semibold text-white truncate">{currentTrack.title}</h2>
          </div>
          <button
            onClick={closeVideo}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 hover:text-white hover:border-white/30 transition"
          >
            <X size={16} />
            Đóng
          </button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] p-4 md:p-6">
          <section className="space-y-4 rounded-3xl border border-white/10 bg-gradient-to-br from-neutral-950 to-neutral-900 p-4 md:p-6">
            <div className="aspect-video overflow-hidden rounded-2xl bg-black flex items-center justify-center border border-white/10">
              {resolvedSrc ? (
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  className="h-full w-full object-contain"
                  poster={resolveAssetUrl(currentTrack.coverImageUrl) ?? undefined}
                >
                  <source src={resolvedSrc} type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              ) : (
                <div className="text-center text-neutral-400">
                  <Video size={48} className="mx-auto mb-4" />
                  Đang tải video...
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-neutral-400">Xem video ngay trong trang hiện tại</p>
                <h3 className="text-2xl font-bold">{currentTrack.title}</h3>
                <p className="text-neutral-400 mt-1">{currentTrack.artistName ?? 'TuneVault'} • {currentTrack.duration}</p>
              </div>

              <button
                onClick={() => {
                  const video = videoRef.current;
                  if (!video) return;

                  if (video.paused) {
                    void video.play().catch(() => {});
                  } else {
                    video.pause();
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black hover:scale-[1.02] transition w-fit"
              >
                {isVideoPlaying ? 'Tạm dừng' : 'Phát'}
              </button>
            </div>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h2 className="text-xl font-bold">Thông tin video</h2>
            <div className="space-y-3 text-sm text-neutral-300">
              <p><span className="text-neutral-500">Định dạng:</span> {currentTrack.mediaType}</p>
              <p><span className="text-neutral-500">Thời lượng:</span> {currentTrack.duration}</p>
              <p className="break-all"><span className="text-neutral-500">File:</span> {currentTrack.filePath}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
