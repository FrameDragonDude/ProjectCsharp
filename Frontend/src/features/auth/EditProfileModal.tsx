import { useState, useRef } from 'react';
import { X, Camera, Save } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: {
    fullName: string;
    bio: string;
    avatarUrl?: string;
  };
  onSuccess?: () => void;
}

export default function EditProfileModal({ isOpen, onClose, currentData, onSuccess }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(currentData.fullName);
  const [bio, setBio] = useState(currentData.bio);
  const [avatarUrl, setAvatarUrl] = useState(currentData.avatarUrl || '');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('tunevault_token'); 
      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('bio', bio);
      if (selectedFile) {
        formData.append('avatarFile', selectedFile); 
      }

      const response = await fetch('http://localhost:5000/api/User/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.Message || errorData?.message || `Lỗi máy chủ (${response.status})`;
        throw new Error(errorMessage);
      }

      alert('Cập nhật hồ sơ thành công!');
      if (onSuccess) onSuccess(); 
      onClose();
    } catch (error: any) {
      console.error('Lỗi khi cập nhật:', error);
      alert(error.message || 'Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch (error) {
      console.error('Lỗi khi tải ảnh lên:', error);
      alert('Không thể tải ảnh lên. Vui lòng thử lại sau.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white">Chỉnh sửa hồ sơ</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white hover:bg-neutral-800 p-2 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="flex flex-col items-center justify-center space-y-4">
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*" 
            />

            {}
            <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
              <div className="w-32 h-32 rounded-full bg-neutral-800 border-2 border-neutral-700 overflow-hidden flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                ) : avatarUrl ? (
                  <img src={resolveAssetUrl(avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👨‍💻</span>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={24} className="text-white mb-1" />
                <span className="text-xs font-semibold text-white">Chọn ảnh</span>
              </div>
            </div>
            
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-neutral-300">Tên hiển thị</label>
            <input
              type="text"
              required
              maxLength={256}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 text-white placeholder-neutral-500 transition"
              placeholder="Nhập tên của bạn..."
            />
          </div>

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

          <div className="pt-4 flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-full font-semibold text-white hover:bg-neutral-800 transition">
              Hủy
            </button>
            <button type="submit" disabled={isLoading} className="px-6 py-2 rounded-full font-bold bg-white text-black hover:scale-105 transition flex items-center space-x-2 disabled:opacity-70 disabled:hover:scale-100">
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