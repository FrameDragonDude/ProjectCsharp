import { useState, useEffect } from 'react';
import { Edit2, User } from 'lucide-react';
import EditProfileModal from './EditProfileModal';
import FollowingModal from './FollowingModal';
import { getProfile, getLibrarySummary } from '../../services/api/tuneVaultApi';
import { resolveAssetUrl } from '../../utils/resolveAsset';
import type { Playlist } from '../../types';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';

export default function Profile() {

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFollowingModalOpen, setIsFollowingModalOpen] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const [userProfile, setUserProfile] = useState({
    fullName: '',
    bio: '',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    website: '',
    followers: 0,
    following: 0,
    publicPlaylists: 0,
    avatarColor: 'bg-indigo-600',
    avatarUrl: '',
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const [data, libraryData] = await Promise.all([
          getProfile(),
          getLibrarySummary()
        ]);

        setUserProfile(prev => ({
          ...prev,
          fullName: data.fullName || '',
          bio: data.bio || '',
          avatarUrl: data.avatarUrl || '',
          followers: data.followersCount || 0,
          following: data.followingCount || 0,
          publicPlaylists: libraryData.playlists.filter(p => p.isPublic).length,
        }));
        setPlaylists(libraryData.playlists.filter(p => p.isPublic));
      } catch (error) {
        console.error("Lỗi tải thông tin user", error);
      }
    }
    fetchProfile();
  }, []);


  return (
    <div className="flex flex-col h-full overflow-y-auto text-white pb-24">
      <div className="bg-gradient-to-b from-neutral-600 to-neutral-900 p-6 md:p-10 flex flex-col md:flex-row items-end space-y-6 md:space-y-0 md:space-x-8 shrink-0">

        <div className={`w-40 h-40 md:w-52 md:h-52 rounded-full shadow-2xl flex-shrink-0 flex items-center justify-center ${userProfile.avatarColor} overflow-hidden`}>
          {userProfile.avatarUrl ? (
            <img src={resolveAssetUrl(userProfile.avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={80} className="text-white/50" />
          )}
        </div>

        <div className="flex flex-col flex-1 w-full text-white">
          <span className="text-sm font-semibold uppercase tracking-wider mb-2">Hồ sơ</span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight line-clamp-1">
            {userProfile.fullName}
          </h1>

          <div className="flex items-center text-sm font-medium text-neutral-300">
            <span>{userProfile.publicPlaylists} Danh sách phát công khai</span>
            <span className="mx-2">•</span>
            <span className="hover:underline cursor-pointer">{userProfile.followers} Người theo dõi</span>
            <span className="mx-2">•</span>
            <span
              className="hover:underline cursor-pointer"
              onClick={() => setIsFollowingModalOpen(true)}
            >
              Đang theo dõi {userProfile.following}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-10 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              className="bg-transparent border border-neutral-500 hover:border-white hover:scale-105 transition px-4 py-1.5 rounded-full text-sm font-bold flex items-center space-x-2"
              onClick={() => setIsEditModalOpen(true)}
            >
              <Edit2 size={16} />
              <span>Chỉnh sửa hồ sơ</span>
            </button>
          </div>
        </div>

        {userProfile.bio && (
          <div className="max-w-2xl bg-neutral-800/30 p-4 rounded-lg mb-10 border border-neutral-800">
            <p className="text-neutral-200 text-sm leading-relaxed whitespace-pre-wrap">
              {userProfile.bio}
            </p>
          </div>
        )}

        {playlists.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Danh sách phát công khai</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.map((playlist) => (
                <Link
                  to={`/playlist/${playlist.id}`}
                  key={playlist.id}
                  className="p-4 bg-neutral-800/40 hover:bg-neutral-800 rounded-md cursor-pointer transition group"
                >
                  <div className="w-full aspect-square mb-4 rounded shadow-lg bg-neutral-700 relative flex items-center justify-center overflow-hidden">
                    {playlist.coverImageUrl ? (
                      <img src={resolveAssetUrl(playlist.coverImageUrl)} alt={playlist.name} className="w-full h-full object-cover" />
                    ) : (
                      <Music size={40} className="text-neutral-500" />
                    )}
                    <div className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 rounded-full items-center justify-center text-black hidden group-hover:flex shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all">
                      ▶
                    </div>
                  </div>
                  <h4 className="font-semibold text-white truncate mb-1">{playlist.name}</h4>
                  <p className="text-sm text-neutral-400">{playlist.trackCount} bài hát</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentData={{
          fullName: userProfile.fullName,
          bio: userProfile.bio,
          avatarUrl: userProfile.avatarUrl
        }}
        onSaveSuccess={(updatedData) => {
          setUserProfile(prev => ({
            ...prev,
            fullName: updatedData.fullName,
            bio: updatedData.bio,
            avatarUrl: updatedData.avatarUrl
          }));
        }}
      />
      <FollowingModal
        isOpen={isFollowingModalOpen}
        onClose={() => setIsFollowingModalOpen(false)}
      />
    </div>
  );
}