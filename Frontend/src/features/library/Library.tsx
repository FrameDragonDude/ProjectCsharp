import { useState } from 'react';
import { Heart, Plus, Upload, ListMusic, Video, Music } from 'lucide-react';

export default function Library() {
  const [activeTab, setActiveTab] = useState<'playlists' | 'uploads'>('playlists');

  // Dữ liệu mẫu cho Playlist
  const mockPlaylists = [
    { id: 1, title: 'Bài hát đã thích', type: 'playlist', count: 142, isLikedSongs: true },
    { id: 2, title: 'Nhạc code đêm khuya', type: 'playlist', count: 25, isLikedSongs: false },
    { id: 3, title: 'Lofi Chill', type: 'playlist', count: 40, isLikedSongs: false },
  ];

  // Dữ liệu mẫu cho Uploads (Audio & Video)
  const mockUploads = [
    { id: 1, title: 'Bản thu âm Demo 1', type: 'audio', duration: '3:45' },
    { id: 2, title: 'Video Project C#', type: 'video', duration: '12:20' },
  ];

  return (
    <div className="p-6 space-y-6 flex flex-col h-full text-white">
      {/* Header: Tabs & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeTab === 'playlists' ? 'bg-white text-black' : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
          >
            Danh sách phát
          </button>
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              activeTab === 'uploads' ? 'bg-white text-black' : 'bg-neutral-800 hover:bg-neutral-700'
            }`}
          >
            Đã tải lên
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button className="flex items-center space-x-2 bg-transparent border border-neutral-600 hover:border-white px-3 py-1.5 rounded-full text-sm font-medium transition">
            <Plus size={16} />
            <span>Tạo Playlist</span>
          </button>
          <button className="flex items-center space-x-2 bg-green-500 hover:bg-green-400 text-black px-3 py-1.5 rounded-full text-sm font-bold transition">
            <Upload size={16} />
            <span>Tải Media lên</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="mt-4">
        {activeTab === 'playlists' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {mockPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="p-4 bg-neutral-800/40 hover:bg-neutral-800 rounded-md cursor-pointer transition group"
              >
                <div className={`w-full aspect-square mb-4 rounded shadow-lg flex items-center justify-center ${
                  playlist.isLikedSongs ? 'bg-gradient-to-br from-indigo-600 to-blue-400' : 'bg-neutral-700'
                }`}>
                  {playlist.isLikedSongs ? (
                    <Heart size={48} className="text-white" fill="white" />
                  ) : (
                    <ListMusic size={48} className="text-neutral-500" />
                  )}
                </div>
                <h4 className="font-semibold text-white truncate mb-1">{playlist.title}</h4>
                <p className="text-sm text-neutral-400">{playlist.count} bài hát</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'uploads' && (
          <div className="flex flex-col space-y-2">
            {mockUploads.length > 0 ? (
              mockUploads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-neutral-800/50 cursor-pointer group transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-neutral-700 rounded flex items-center justify-center text-neutral-400">
                      {item.type === 'audio' ? <Music size={24} /> : <Video size={24} />}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{item.title}</p>
                      <p className="text-sm text-neutral-400 capitalize">{item.type}</p>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-400">{item.duration}</div>
                </div>
              ))
            ) : (
              <div className="text-center text-neutral-400 mt-10">
                <Upload size={48} className="mx-auto mb-4 opacity-50" />
                <p>Bạn chưa tải lên nội dung nào.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}