import { usePlayerStore } from '../../store/usePlayerStore';
import { resolveAssetUrl } from '../../utils/resolveAsset';

export default function SongDetailModal() {
  const { songDetailModalOpen, songForDetail, closeSongDetailModal } = usePlayerStore();

  if (!songDetailModalOpen || !songForDetail) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-neutral-800 text-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold mb-4">{songForDetail.title}</h2>
          <button onClick={closeSongDetailModal} className="text-neutral-400 hover:text-white">
            &times;
          </button>
        </div>
        <div className="flex gap-4">
          <div className="w-24 h-24 bg-neutral-700 rounded overflow-hidden flex-shrink-0">
            {songForDetail.coverImageUrl && (
              <img
                src={resolveAssetUrl(songForDetail.coverImageUrl)}
                alt={songForDetail.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-neutral-300">{songForDetail.artistName ?? 'Unknown Artist'}</p>
            {songForDetail.albumTitle && <p className="text-sm text-neutral-400">{songForDetail.albumTitle}</p>}
            <p className="text-sm text-neutral-500">{songForDetail.duration}</p>
          </div>
        </div>
        {songForDetail.description && (
          <div className="mt-4">
            <h3 className="font-bold">Description</h3>
            <p className="text-neutral-300 whitespace-pre-wrap">{songForDetail.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
