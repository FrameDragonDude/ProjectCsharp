import { Home, Search, Library, Bell, User, Send } from 'lucide-react';
import { Link } from 'react-router-dom';


export default function Sidebar() {
  return (
    <aside className="w-60 bg-black flex flex-col p-6 space-y-8">
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
        <Link to="/notifications" className="flex items-center space-x-4 text-neutral-400 hover:text-white transition-colors duration-200 mt-6">
          <Bell size={24} />
          <span className="font-semibold">Thông báo</span>
        </Link>

      </nav>

      <div className="mt-auto pt-6 border-t border-neutral-800">
        <Link to="/profile" className="flex items-center space-x-3 text-neutral-400 hover:text-white transition-colors duration-200 group">
          <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center group-hover:bg-neutral-600 transition">
            <User size={16} />
          </div>
          <span className="font-semibold text-sm">Hồ sơ của tôi</span>
        </Link>
      </div>
    </aside>
  );
}