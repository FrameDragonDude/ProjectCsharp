import { useEffect, useState } from 'react';
import { X, User, Music } from 'lucide-react';
import { getFollowing } from '../../services/api/tuneVaultApi';
import type { FollowedEntity } from '../../types';
import { resolveAssetUrl } from '../../utils/resolveAsset';
import { useNavigate } from 'react-router-dom';

interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FollowingModal({ isOpen, onClose }: FollowingModalProps) {
  const [following, setFollowing] = useState<FollowedEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      const fetchFollowing = async () => {
        setLoading(true);
        try {
          const data = await getFollowing();
          setFollowing(data);
        } catch (error) {
          console.error('Lỗi khi tải danh sách đang theo dõi:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchFollowing();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEntityClick = (entity: FollowedEntity) => {
    if (entity.type === 'Artist') {
      navigate(`/artist/${entity.id}`);
      onClose();
    }
    // TODO: Add logic for 'User' if public profiles are implemented
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">Đang theo dõi</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : following.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              Bạn chưa theo dõi ai.
            </div>
          ) : (
            <div className="space-y-4">
              {following.map((entity) => (
                <div
                  key={`${entity.type}-${entity.id}`}
                  className="flex items-center justify-between p-2 hover:bg-neutral-800 rounded-md transition cursor-pointer group"
                  onClick={() => handleEntityClick(entity)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center shrink-0">
                      {entity.avatarUrl ? (
                        <img
                          src={resolveAssetUrl(entity.avatarUrl)}
                          alt={entity.name}
                          className="w-full h-full object-cover"
                        />
                      ) : entity.type === 'Artist' ? (
                        <Music size={20} className="text-neutral-400" />
                      ) : (
                        <User size={20} className="text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:underline">{entity.name}</h4>
                      <p className="text-xs text-neutral-400">{entity.type === 'Artist' ? 'Nghệ sĩ' : 'Người dùng'}</p>
                    </div>
                  </div>

                  <button
                    className="border border-neutral-500 rounded-full px-4 py-1 text-xs font-bold text-white hover:border-white transition"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    Đang theo dõi
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
