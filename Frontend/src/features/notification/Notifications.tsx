import { Bell, Share2, UserPlus, Music, Check, Circle } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';

// Định nghĩa kiểu dữ liệu cho Thông báo

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore();

  // Hàm chọn icon dựa trên loại thông báo
  const getIcon = (type: string) => {
    switch (type) {
      case 'share': return <Share2 size={20} className="text-blue-400" />;
      case 'follow': return <UserPlus size={20} className="text-green-400" />;
      case 'system': return <Music size={20} className="text-purple-400" />;
      default: return <Bell size={20} className="text-neutral-400" />;
    }
  };

  const parsePayload = (type: string, jsonString: string) => {
    try {
      const payload = JSON.parse(jsonString);
      
      switch (type) {
        case 'Share':
          const isSong = payload.MediaItemId !== null && payload.MediaItemId !== undefined;
          const senderName = payload.SenderName || payload.senderName || "Một người bạn";
          
          return (
            <span>
              <strong className="text-white">{senderName}</strong> vừa chia sẻ một 
              {isSong ? " bài hát " : " playlist "} 
              với bạn.
            </span>
          );
          
        case 'Follow':
          const followerName = payload.SenderName || payload.senderName || "Ai đó";
          return (
            <span>
              <strong className="text-white">{followerName}</strong> đã bắt đầu theo dõi bạn.
            </span>
          );
          
        case 'System':
          return <span>{payload.message}</span>;
          
        default:
          return <span>Bạn có một thông báo mới.</span>;
      }
    } catch {
      return <span>Bạn có một thông báo mới.</span>;
    }
  };
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { 
      hour: '2-digit', minute: '2-digit', 
      day: '2-digit', month: '2-digit', year: 'numeric' 
    });
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
            onClick={() => markAllAsRead()}
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
                  {parsePayload(notif.type, notif.payloadJson)}
                </p>
                <p className="text-sm text-neutral-500 mt-1">{formatTime(notif.createdAt)}</p>
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