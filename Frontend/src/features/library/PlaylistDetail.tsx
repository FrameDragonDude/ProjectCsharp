import { useParams } from 'react-router-dom';
import { Play, Heart, MoreHorizontal, Clock } from 'lucide-react';

export default function PlaylistDetail() {
  // Lấy ID từ URL (sẽ dùng để gọi API thật sau này)
  const { id } = useParams();
  void id; // Đánh dấu đã dùng để tránh cảnh báo 'declared but never used'

  // Dữ liệu mẫu (Mock data) cho Playlist
  const mockPlaylist = {
    title: 'Nhạc code đêm khuya',
    description: 'Những bản nhạc Lo-fi chill giúp bạn tập trung fix bug và hoàn thành đồ án.',
    creator: 'Vũ Lê',
    likes: '1,234',
    totalSongs: 15,
    duration: '1 giờ 12 phút',
    coverColor: 'from-blue-700', // Dùng cho gradient
  };

  // Dữ liệu mẫu cho danh sách bài hát
  const mockTracks = [
    { id: 1, title: 'Chill Study Beats', artist: 'Lo-fi Hacker', album: 'Late Night Code', dateAdded: '2 ngày trước', duration: '3:15' },
    { id: 2, title: 'Focus and Type', artist: 'Dev Music', album: 'Keyboard Sounds', dateAdded: '3 ngày trước', duration: '2:45' },
    { id: 3, title: 'Syntax Error (Remix)', artist: 'DJ Debug', album: 'Terminal Sessions', dateAdded: '1 tuần trước', duration: '4:20' },
    { id: 4, title: 'Coffee and C#', artist: 'The DotNet Crew', album: 'Visual Studio Vibes', dateAdded: '1 tuần trước', duration: '3:50' },
    { id: 5, title: 'Compile Time', artist: 'Build Success', album: 'Late Night Code', dateAdded: '2 tuần trước', duration: '5:10' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Phần Header Playlist với Gradient */}
      <div className={`bg-gradient-to-b ${mockPlaylist.coverColor} to-neutral-900 p-6 md:p-8 flex flex-col md:flex-row items-end space-y-4 md:space-y-0 md:space-x-6 shrink-0`}>
        <div className="w-48 h-48 md:w-56 md:h-56 bg-neutral-800 shadow-2xl rounded flex-shrink-0">
          {/* Ảnh bìa Playlist sẽ hiển thị ở đây */}
        </div>
        
        <div className="flex flex-col text-white">
          <span className="text-sm font-semibold uppercase tracking-wider mb-2">Playlist</span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 md:mb-6 line-clamp-2">{mockPlaylist.title}</h1>
          <p className="text-neutral-300 text-sm mb-2">{mockPlaylist.description}</p>
          <div className="flex items-center text-sm font-medium">
            <span className="hover:underline cursor-pointer">{mockPlaylist.creator}</span>
            <span className="mx-1">•</span>
            <span>{mockPlaylist.likes} lượt thích</span>
            <span className="mx-1">•</span>
            <span>{mockPlaylist.totalSongs} bài hát,</span>
            <span className="ml-1 text-neutral-300">{mockPlaylist.duration}</span>
          </div>
        </div>
      </div>

      {/* Vùng Action (Nút Play, Like, More) */}
      <div className="bg-neutral-900/50 p-6 flex items-center space-x-6 shrink-0">
        <button className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-black hover:scale-105 hover:bg-green-400 transition transform shadow-lg">
          <Play size={24} className="ml-1" fill="black" />
        </button>
        <button className="text-neutral-400 hover:text-white transition">
          <Heart size={32} />
        </button>
        <button className="text-neutral-400 hover:text-white transition">
          <MoreHorizontal size={32} />
        </button>
      </div>

      {/* Danh sách bài hát */}
      <div className="px-6 pb-20 flex-1 overflow-y-auto">
        {/* Header bảng */}
        <div className="grid grid-cols-[40px_minmax(200px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_60px] gap-4 px-4 py-2 border-b border-neutral-800 text-sm text-neutral-400 sticky top-0 bg-neutral-900 z-10">
          <div className="text-center">#</div>
          <div>Tiêu đề</div>
          <div className="hidden md:block">Album</div>
          <div className="hidden lg:block">Ngày thêm</div>
          <div className="flex justify-center"><Clock size={16} /></div>
        </div>

        {/* Các dòng bài hát */}
        <div className="mt-2 flex flex-col space-y-1">
          {mockTracks.map((track, index) => (
            <div 
              key={track.id} 
              className="grid grid-cols-[40px_minmax(200px,1fr)_minmax(120px,1fr)_minmax(120px,1fr)_60px] gap-4 px-4 py-3 rounded-md hover:bg-neutral-800/60 group transition items-center cursor-pointer text-sm"
            >
              {/* Cột Số thứ tự / Nút Play */}
              <div className="text-center text-neutral-400 group-hover:hidden">
                {index + 1}
              </div>
              <div className="hidden group-hover:flex justify-center text-white">
                <Play size={16} fill="white" />
              </div>

              {/* Cột Tiêu đề & Nghệ sĩ */}
              <div className="flex flex-col pr-4 overflow-hidden">
                <span className="text-white font-medium truncate">{track.title}</span>
                <span className="text-neutral-400 truncate hover:underline hover:text-white">{track.artist}</span>
              </div>

              {/* Cột Album (Ẩn trên mobile) */}
              <div className="hidden md:block text-neutral-400 truncate hover:underline hover:text-white">
                {track.album}
              </div>

              {/* Cột Ngày thêm (Ẩn trên màn hình nhỏ) */}
              <div className="hidden lg:block text-neutral-400 truncate">
                {track.dateAdded}
              </div>

              {/* Cột Thời lượng */}
              <div className="text-neutral-400 text-center">
                {track.duration}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}