import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';

export default function GlobalAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const volume = usePlayerStore((s) => s.volume);
  const setProgress = usePlayerStore((s) => s.setProgress);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const next = usePlayerStore((s) => s.next);
  const pause = usePlayerStore((s) => s.pause);
  const resume = usePlayerStore((s) => s.resume);
  const progress = usePlayerStore((s) => s.progress);

  // Resolve backend base (remove trailing /api if present)
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';
  const backendBase = apiBase.replace(/\/api\/?$/, '');

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress(Math.floor(audio.currentTime));
    const onLoaded = () => setDuration(Math.floor(audio.duration) || 0);
    const onPlay = () => resume();
    const onPause = () => pause();
    const onEnded = () => {
      // advance to next track when current ended
      next();
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [setProgress, setDuration]);

  // Sync store.progress -> audio.currentTime to support seeking from UI
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const target = Number.isFinite(progress) ? progress : 0;
    // only adjust when difference is noticeable to avoid feedback loops
    if (Math.abs(audio.currentTime - target) > 0.5) {
      try {
        audio.currentTime = target;
        // if store indicates playing, ensure audio resumes after seek
        if (isPlaying) {
          void audio.play().catch((e) => console.warn('play after seek failed', e));
        }
      } catch (e) {
        // some browsers may throw if not allowed; ignore
        console.warn('Failed to set currentTime', e);
      }
    }
  }, [progress, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // compute src
    if (!currentTrack?.filePath) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      return;
    }

    let src = currentTrack.filePath;
    if (!/^https?:\/\//i.test(src)) {
      // ensure leading slash
      if (!src.startsWith('/')) src = `/${src}`;
      src = `${backendBase}${src}`;
    }

    if (audio.src !== src) {
      audio.src = src;
      audio.load();
    }

    if (isPlaying) {
      void audio.play().catch((e) => {
        // swallow play errors (autoplay policies) but keep state
        console.warn('Audio play error', e);
      });
    } else {
      audio.pause();
    }
  }, [currentTrack, isPlaying, backendBase]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume));
  }, [volume]);

  return <audio ref={audioRef} style={{ display: 'none' }} />;
}
