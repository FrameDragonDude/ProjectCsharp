import { useState } from 'react';
import { Settings, Edit2, MapPin, Link as LinkIcon, User } from 'lucide-react';
import EditProfileModal from './EditProfileModal'; // 1. Import Component vừa tạo

export default function Profile() {

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Dữ liệu mẫu cho người dùng (Mock data)
  const [userProfile] = useState({
    fullName: 'Vũ Lê Đức Anh',
    bio: 'Sinh viên CNTT - Đại học Sài Gòn (SGU) ',
    location: 'TP. Hồ Chí Minh, Việt Nam',
    website: 'github.com/rickk_astley_fake',
    followers: 128,
    following: 45,
    publicPlaylists: 4,
    avatarColor: 'bg-indigo-600',
    avatarUrl: '', // Thêm thuộc tính avatarUrl (có thể là URL hoặc rỗng)
  });

  // Dữ liệu mẫu cho Playlist công khai của user
  const mockPublicPlaylists = [
    { id: 1, title: 'Nhạc code đêm khuya', followers: 56 },
    { id: 2, title: 'Đồ án mệt quá', followers: 12 },
    { id: 3, title: 'Thư giãn cuối tuần', followers: 89 },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto text-white pb-24">
      {/* Phần Header Profile với Gradient mờ */}
      <div className="bg-gradient-to-b from-neutral-600 to-neutral-900 p-6 md:p-10 flex flex-col md:flex-row items-end space-y-6 md:space-y-0 md:space-x-8 shrink-0">
        
        {/* Avatar */}
        <div className={`w-40 h-40 md:w-52 md:h-52 rounded-full shadow-2xl flex-shrink-0 flex items-center justify-center ${userProfile.avatarColor}`}>
          <User size={80} className="text-white/50" />
        </div>
        
        {/* Thông tin chính */}
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
            <span className="hover:underline cursor-pointer">Đang theo dõi {userProfile.following}</span>
          </div>
        </div>
      </div>

      {/* Vùng Action (Nút Chỉnh sửa) và Thông tin Bio */}
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
            <button className="text-neutral-400 hover:text-white transition">
              <Settings size={28} />
            </button>
          </div>
        </div>

        {/* Cột thông tin chi tiết */}
        <div className="max-w-2xl bg-neutral-800/30 p-4 rounded-lg mb-10 border border-neutral-800">
          <p className="text-neutral-200 text-sm mb-4 leading-relaxed">
            {userProfile.bio}
          </p>
          <div className="flex flex-col space-y-2 text-xs text-neutral-400 font-medium">
            <div className="flex items-center space-x-2">
              <MapPin size={14} />
              <span>{userProfile.location}</span>
            </div>
            <div className="flex items-center space-x-2">
              <LinkIcon size={14} />
              <a href="#" className="hover:underline hover:text-white transition">{userProfile.website}</a>
            </div>
          </div>
        </div>

        {/* Danh sách Playlist công khai */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Danh sách phát công khai</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mockPublicPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="p-4 bg-neutral-800/40 hover:bg-neutral-800 rounded-md cursor-pointer transition group"
              >
                <div className="w-full aspect-square mb-4 rounded shadow-lg bg-neutral-700 relative">
                  {/* Nút Play hiển thị khi hover */}
                  <div className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 rounded-full items-center justify-center text-black hidden group-hover:flex shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all">
                    ▶
                  </div>
                </div>
                <h4 className="font-semibold text-white truncate mb-1">{playlist.title}</h4>
                <p className="text-sm text-neutral-400">{playlist.followers} người theo dõi</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        currentData={{
          fullName: userProfile.fullName,
          bio: userProfile.bio,
          avatarUrl: userProfile.avatarUrl
        }}
      />
    </div>
  );
}