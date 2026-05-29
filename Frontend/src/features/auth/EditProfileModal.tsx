import { useState } from 'react';
import { X, Camera, Save } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Truyền dữ liệu hiện tại vào để hiển thị sẵn trên form
  currentData: {
    fullName: string;
    bio: string;
    avatarUrl?: string;
  };
}

export default function EditProfileModal({ isOpen, onClose, currentData }: EditProfileModalProps) {
  // Khởi tạo state dựa trên dữ liệu thật từ bảng UserProfiles
  const [fullName, setFullName] = useState(currentData.fullName);
  const [bio, setBio] = useState(currentData.bio);
  const [avatarUrl, setAvatarUrl] = useState(currentData.avatarUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Thay thế bằng lệnh gọi API thực tế tới Backend (UPDATE UserProfiles)
      // payload: { fullName, bio, avatarUrl }
      await new Promise(resolve => setTimeout(resolve, 800)); // Giả lập delay mạng
      
      console.log('Dữ liệu chuẩn bị gửi đi:', { fullName, bio, avatarUrl });
      alert('Cập nhật hồ sơ thành công!');
      onClose();
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">Chỉnh sửa hồ sơ</h2>
          <button 
            onClick={onClose}
            className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-2 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body (Form) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Vùng sửa Avatar */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full bg-neutral-800 border-2 border-neutral-700 overflow-hidden flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👨‍💻</span>
                )}
              </div>
              {/* Lớp phủ hover để đổi ảnh */}
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white mb-1" />
                <span className="text-xs font-semibold text-white">Chọn ảnh</span>
              </div>
            </div>
            {/* Input phụ để nhập URL tạm thời (Trong thực tế bạn sẽ dùng file input) */}
            <input 
              type="text" 
              placeholder="Hoặc nhập URL ảnh đại diện (Tùy chọn)"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="w-full text-sm px-3 py-2 bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:border-green-500"
            />
          </div>

          {/* Trường FullName */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Tên hiển thị</label>
            <input
              type="text"
              required
              maxLength={256} // Khớp với VARCHAR(256) trong CSDL
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-white placeholder-neutral-500 transition"
              placeholder="Nhập tên của bạn..."
            />
          </div>

          {/* Trường Bio */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Tiểu sử (Bio)</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-white placeholder-neutral-500 transition resize-none"
              placeholder="Viết một chút về bản thân..."
            />
          </div>

          {/* Nút Submit */}
          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-full font-semibold text-white hover:bg-neutral-800 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 rounded-full font-bold bg-white text-black hover:scale-105 transition flex items-center space-x-2 disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <Save size={18} />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}