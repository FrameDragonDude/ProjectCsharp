import { Home, Search, Library, Bell, User, Send, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useEffect } from 'react';
import { getUserIdFromToken } from '../../utils/authUtils';

export default function Sidebar() {
  const { unreadCount, connectSignalR, fetchNotifications } = useNotificationStore(); 
  const user = useAuthStore((state) => state.user); 
  const currentUser = user?.id || getUserIdFromToken();
  const navigate = useNavigate();
  const logout = useAuthStore(state => state.logout);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      connectSignalR(currentUser.toString());
    }
  }, [currentUser, fetchNotifications, connectSignalR]);

  return (
    <aside className="w-60 bg-black border-r border-neutral-800 flex flex-col p-6 space-y-8 select-none">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
          <span className="text-black font-bold text-sm">TV</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">TuneVault</h1>
      </div>

      {/* Menu Navigation */}
      <nav className="flex flex-col space-y-5">
        <Link to="/" className="flex items-center space-x-4 text-neutral-400 hover:text-white transition-colors duration-200">
          <Home size={24} />
          <span className="font-semibold">Trang chủ</span>
        </Link>
        <Link to="/search" className="flex items-center space-x-4 text-neutral-400 hover:text-white transition-colors duration-200">
          <Search size={24} />
          <span className="font-semibold">Tìm kiếm</span>
        </Link>
        <Link to="/library" className="flex items-center space-x-4 text-neutral-400 hover:text-white transition-colors duration-200">
          <Library size={24} />
          <span className="font-semibold">Thư viện</span>
        </Link>
        <Link to="/share" className="flex items-center space-x-4 text-neutral-400 hover:text-white transition-colors duration-200">
          <Send size={24} />
          <span className="font-semibold">Hộp thư chia sẻ</span>
        </Link>
        <Link to="/notifications" className="flex items-center space-x-4 text-neutral-400 hover:text-white transition-colors duration-200 relative">
          <div className="relative">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="font-semibold">Thông báo</span>
        </Link>
      </nav>
        
      {/* Footer Area */}
      <div className="mt-auto pt-6 border-t border-neutral-800 space-y-4">
        <Link to="/profile" className="flex items-center space-x-3 text-neutral-400 hover:text-white transition-colors duration-200 group">
          <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center group-hover:bg-neutral-700 transition">
            <User size={16} />
          </div>
          <span className="font-semibold text-sm">Hồ sơ của tôi</span>
        </Link>

        <button onClick={handleLogout} className="flex items-center space-x-3 text-neutral-400 hover:text-red-500 transition-colors duration-200 group w-full text-left">
          <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center group-hover:bg-red-400/20 transition">
            <LogOut size={16} />
          </div>
          <span className="font-semibold text-sm">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}