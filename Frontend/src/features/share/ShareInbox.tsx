import { useState } from 'react';
import { Inbox, Send, Play, Music, Video, ListMusic, Clock } from 'lucide-react';

// Định nghĩa kiểu dữ liệu cho item chia sẻ
interface SharedItem {
  id: string;
  mediaType: 'audio' | 'video' | 'playlist';
  mediaTitle: string;
  user: string; // Người gửi (nếu ở tab Inbox) hoặc Người nhận (nếu ở tab Sent)
  time: string;
  message?: string;
}

export default function ShareInbox() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');

  // Dữ liệu mẫu: Được chia sẻ với tôi
  const mockInbox: SharedItem[] = [
    { id: '1', mediaType: 'playlist', mediaTitle: 'Nhạc code đêm khuya', user: 'Tuấn Ngọc', time: '2 giờ trước', message: 'Nghe thử list này đi, code mượt lắm!' },
    { id: '2', mediaType: 'audio', mediaTitle: 'Noi Dau Muon Mang', user: 'Hải Đăng', time: 'Hôm qua' },
    { id: '3', mediaType: 'video', mediaTitle: 'Demo Project C#', user: 'Lan Anh', time: '3 ngày trước', message: 'Phần thuyết trình nhóm mình nè.' },
  ];

  // Dữ liệu mẫu: Tôi đã chia sẻ
  const mockSent: SharedItem[] = [
    { id: '4', mediaType: 'audio', mediaTitle: 'Lofi Chill', user: 'Nhóm trưởng', time: '1 tuần trước' },
  ];

  const currentData = activeTab === 'inbox' ? mockInbox : mockSent;

  // Hàm chọn icon theo loại media
  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Music size={20} className="text-blue-400" />;
      case 'video': return <Video size={20} className="text-purple-400" />;
      case 'playlist': return <ListMusic size={20} className="text-green-400" />;
      default: return <Music size={20} className="text-neutral-400" />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto flex flex-col h-full text-white">
      {/* Header & Tabs */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">Hộp thư Chia sẻ</h1>
        
        <div className="flex space-x-4 border-b border-neutral-800 pb-px">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`flex items-center space-x-2 pb-3 px-2 text-sm font-semibold transition border-b-2 ${
              activeTab === 'inbox' ? 'border-green-500 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Inbox size={18} />
            <span>Được chia sẻ với tôi</span>
          </button>
          
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center space-x-2 pb-3 px-2 text-sm font-semibold transition border-b-2 ${
              activeTab === 'sent' ? 'border-green-500 text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Send size={18} />
            <span>Tôi đã chia sẻ</span>
          </button>
        </div>
      </div>

      {/* Danh sách nội dung */}
      <div className="flex flex-col space-y-3">
        {currentData.length > 0 ? (
          currentData.map((item) => (
            <div 
              key={item.id}
              className="flex items-center p-4 bg-neutral-800/40 hover:bg-neutral-800 rounded-lg group transition cursor-pointer border border-transparent hover:border-neutral-700"
            >
              {/* Cột 1: Icon Media & Nút Play (hiện khi hover) */}
              <div className="w-14 h-14 bg-neutral-700 rounded mr-4 relative flex-shrink-0 flex items-center justify-center shadow-md">
                <div className="group-hover:hidden">
                  {getMediaIcon(item.mediaType)}
                </div>
                <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center rounded">
                  <Play fill="white" size={24} className="text-white" />
                </div>
              </div>

              {/* Cột 2: Thông tin chính */}
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-base font-bold text-white truncate">{item.mediaTitle}</h3>
                <p className="text-sm text-neutral-400 mt-0.5">
                  <span className="capitalize">{item.mediaType}</span>
                  <span className="mx-2">•</span>
                  {activeTab === 'inbox' ? `Từ: ${item.user}` : `Đến: ${item.user}`}
                </p>
                {item.message && (
                  <p className="text-sm text-neutral-300 italic mt-2 border-l-2 border-neutral-600 pl-3">
                    "{item.message}"
                  </p>
                )}
              </div>

              {/* Cột 3: Thời gian */}
              <div className="hidden md:flex items-center text-sm text-neutral-500 whitespace-nowrap">
                <Clock size={14} className="mr-1.5" />
                {item.time}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-neutral-500 flex flex-col items-center">
            {activeTab === 'inbox' ? (
              <Inbox size={48} className="mb-4 opacity-20" />
            ) : (
              <Send size={48} className="mb-4 opacity-20" />
            )}
            <p className="text-lg">Không có mục nào ở đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}