import { useState } from 'react';
import { Bell, Share2, UserPlus, Music, Check, Circle } from 'lucide-react';

// Định nghĩa kiểu dữ liệu cho Thông báo
interface NotificationItem {
  id: string;
  type: 'share' | 'follow' | 'system';
  content: string;
  sender: string;
  time: string;
  isRead: boolean;
}

export default function Notifications() {
  // Dữ liệu mẫu
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      type: 'share',
      content: 'đã chia sẻ playlist "Nhạc code đêm khuya" với bạn.',
      sender: 'Tuấn Ngọc',
      time: '2 phút trước',
      isRead: false,
    },
    {
      id: '2',
      type: 'follow',
      content: 'đã bắt đầu theo dõi bạn.',
      sender: 'Lan Anh',
      time: '1 giờ trước',
      isRead: false,
    },
    {
      id: '3',
      type: 'share',
      content: 'đã gửi cho bạn bài hát "Noi Dau Muon Mang".',
      sender: 'Hải Đăng',
      time: 'Hôm qua',
      isRead: true,
    },
    {
      id: '4',
      type: 'system',
      content: 'Chào mừng bạn đến với TuneVault! Hãy bắt đầu khám phá âm nhạc.',
      sender: 'Hệ thống',
      time: '3 ngày trước',
      isRead: true,
    }
  ]);

  // Đếm số thông báo chưa đọc
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Hàm đánh dấu 1 thông báo đã đọc
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
    );
  };

  // Hàm đánh dấu tất cả đã đọc
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
  };

  // Hàm chọn icon dựa trên loại thông báo
  const getIcon = (type: string) => {
    switch (type) {
      case 'share': return <Share2 size={20} className="text-blue-400" />;
      case 'follow': return <UserPlus size={20} className="text-green-400" />;
      case 'system': return <Music size={20} className="text-purple-400" />;
      default: return <Bell size={20} className="text-neutral-400" />;
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto flex flex-col h-full text-white">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Thông báo</h1>
          <p className="text-neutral-400">
            Bạn có {unreadCount} thông báo chưa đọc
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center space-x-2 text-sm text-neutral-400 hover:text-white transition"
          >
            <Check size={16} />
            <span>Đánh dấu tất cả đã đọc</span>
          </button>
        )}
      </div>

      {/* Danh sách thông báo */}
      <div className="flex flex-col space-y-2">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div 
              key={notif.id}
              onClick={() => markAsRead(notif.id)}
              className={`flex items-start p-4 rounded-lg cursor-pointer transition ${
                notif.isRead 
                  ? 'bg-transparent hover:bg-neutral-800/50' 
                  : 'bg-neutral-800/80 hover:bg-neutral-700/80'
              }`}
            >
              {/* Icon / Avatar */}
              <div className="w-12 h-12 rounded-full bg-neutral-700 flex items-center justify-center shrink-0 mr-4">
                {getIcon(notif.type)}
              </div>

              {/* Nội dung */}
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-base text-neutral-200">
                  <span className="font-bold text-white">{notif.sender}</span> {notif.content}
                </p>
                <p className="text-sm text-neutral-500 mt-1">{notif.time}</p>
              </div>

              {/* Dấu chấm xanh (Unread indicator) */}
              {!notif.isRead && (
                <div className="flex items-center justify-center h-full pt-2">
                  <Circle size={12} fill="#22c55e" className="text-green-500" />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-neutral-500 flex flex-col items-center">
            <Bell size={64} className="mb-4 opacity-20" />
            <p className="text-lg">Bạn không có thông báo nào.</p>
          </div>
        )}
      </div>
    </div>
  );
}