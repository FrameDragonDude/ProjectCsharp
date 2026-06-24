import { usePlayerStore } from '../../store/usePlayerStore';
import { resolveAssetUrl } from '../../utils/resolveAsset';

export default function SongDetailPanel() {
  const { songForDetail } = usePlayerStore();

  if (!songForDetail) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm border-2 border-dashed border-neutral-800 rounded-lg px-4 text-center">
        Chọn một bài hát, album hoặc video để xem chi tiết ở đây.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4">
      <div className="w-full aspect-square bg-neutral-800 rounded-lg overflow-hidden">
        {songForDetail.coverImageUrl && (
          <img
            src={resolveAssetUrl(songForDetail.coverImageUrl)}
            alt={songForDetail.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div>
        <h3 className="text-xl font-bold">{songForDetail.title}</h3>
        <p className="text-neutral-400">{songForDetail.artistName}</p>
        {songForDetail.albumTitle && (
          <p className="text-sm text-neutral-500">{songForDetail.albumTitle}</p>
        )}
      </div>
      {songForDetail.description && (
        <div>
          <h4 className="font-bold text-neutral-300">Nội dung</h4>
          <p className="text-sm text-neutral-400 whitespace-pre-wrap">
            {songForDetail.description}
          </p>
        </div>
      )}
    </div>
  );
}
