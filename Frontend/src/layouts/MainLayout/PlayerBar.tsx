import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pause, Play, SkipBack, SkipForward, Volume2, Video } from 'lucide-react';
import { usePlayerStore } from '../../store/usePlayerStore';

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function PlayerBar() {
  const navigate = useNavigate();
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const queue = usePlayerStore((state) => state.queue);
  const queueIndex = usePlayerStore((state) => state.queueIndex);
  const volume = usePlayerStore((state) => state.volume);
  const progress = usePlayerStore((state) => state.progress);
  const duration = usePlayerStore((state) => state.duration);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const setVolume = usePlayerStore((state) => state.setVolume);
  const setProgress = usePlayerStore((state) => state.setProgress);

  const canGoPrevious = useMemo(() => queue.length > 1 && queueIndex > 0, [queue.length, queueIndex]);
  const canGoNext = useMemo(() => queue.length > 1 && queueIndex < queue.length - 1, [queue.length, queueIndex]);

  return (
    <div className="h-24 bg-black border-t border-neutral-800 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center space-x-4 w-1/3 min-w-0">
        <div className="w-14 h-14 bg-neutral-800 rounded shadow-md flex items-center justify-center text-neutral-500 overflow-hidden shrink-0">
          {currentTrack?.mediaType === 'Video' ? <Video size={20} /> : <Play size={18} />}
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{currentTrack?.title ?? 'Chưa phát bài nào'}</h4>
          <p className="text-xs text-neutral-400 truncate">
            {currentTrack ? `${currentTrack.artistName ?? 'TuneVault'} • ${currentTrack.mediaType}` : 'Chọn một bài hát hoặc video để phát'}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center w-1/3 space-y-2">
        <div className="flex items-center space-x-6">
          <button disabled={!canGoPrevious} onClick={previous} className="text-neutral-400 hover:text-white transition disabled:opacity-30 disabled:hover:text-neutral-400">
            <SkipBack size={20} />
          </button>
          <button
            onClick={togglePlay}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition disabled:opacity-50"
            disabled={!currentTrack}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
          </button>
          <button disabled={!canGoNext} onClick={next} className="text-neutral-400 hover:text-white transition disabled:opacity-30 disabled:hover:text-neutral-400">
            <SkipForward size={20} />
          </button>
          {currentTrack?.mediaType === 'Video' && (
            <button
              onClick={() => navigate(`/video/${currentTrack.id}`)}
              className="text-xs font-semibold text-white/80 hover:text-white border border-neutral-700 rounded-full px-3 py-1 transition"
            >
              Mở video
            </button>
          )}
        </div>
        <div className="w-full max-w-md flex items-center space-x-2">
          <span className="text-xs text-neutral-400">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            value={progress}
            onChange={(event) => setProgress(Number(event.target.value))}
            className="h-1 flex-1 accent-white cursor-pointer"
            disabled={!currentTrack}
          />
          <span className="text-xs text-neutral-400">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-end w-1/3 space-x-3 text-neutral-400">
        <Volume2 size={20} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="w-24 accent-white cursor-pointer"
        />
      </div>
    </div>
  );
}