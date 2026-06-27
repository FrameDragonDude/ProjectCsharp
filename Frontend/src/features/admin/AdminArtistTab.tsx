import { useState } from 'react';
import { Shield, Search, Music, CheckCircle2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { handleApiError } from '../../utils/errorHandler';
import { changeUserRole } from '../../services/api/tuneVaultApi';

export default function AdminArtistTab() {
  const [keyword, setKeyword] = useState('');
  const [action, setAction] = useState<'upgrade' | 'downgrade'>('upgrade');
  const [artistName, setArtistName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');

    try {
      const response = await changeUserRole(keyword, action, action === 'upgrade' ? artistName : undefined);
      
      setSuccessMessage(response.message || `Đã ${action === 'upgrade' ? 'cấp quyền' : 'hạ quyền'} thành công cho tài khoản "${keyword}"!`);
      // Reset form sau khi thành công
      setKeyword('');
      setArtistName('');
    } catch (error) {
      handleApiError(error, `Lỗi: Không thể ${action === 'upgrade' ? 'cấp' : 'hạ'} quyền.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
        <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Quản trị viên: Quản lý quyền Nghệ sĩ</h1>
          <p className="text-neutral-400 text-sm mt-1">Tìm kiếm người dùng bằng Username/Email để cấp hoặc hạ quyền Nghệ sĩ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cột Form */}
        <div className="lg:col-span-2">
          <form 
            onSubmit={handleSubmit} 
            className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-sm"
          >
            {/* Lựa chọn Hành động */}
            <div className="flex gap-4 mb-8">
              <button
                type="button"
                onClick={() => setAction('upgrade')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                  action === 'upgrade' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                    : 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <ArrowUpCircle size={18} />
                Nâng cấp (Artist)
              </button>
              <button
                type="button"
                onClick={() => setAction('downgrade')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all ${
                  action === 'downgrade' 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                    : 'bg-neutral-900 text-neutral-500 border border-neutral-800 hover:text-white hover:bg-neutral-800'
                }`}
              >
                <ArrowDownCircle size={18} />
                Giáng chức (User)
              </button>
            </div>

            {/* Thông báo thành công */}
            {successMessage && (
              <div className={`mb-6 p-4 border rounded-xl flex items-center gap-3 ${
                action === 'upgrade' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                <CheckCircle2 size={20} />
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            )}

            <div className="space-y-5">
              {/* Tìm kiếm người dùng */}
              <div className="space-y-1.5 group">
                <label className="text-sm font-medium text-neutral-400 group-focus-within:text-white transition-colors">
                  Tài khoản người dùng (Username hoặc Email)
                </label>
                <div className="relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-white placeholder-neutral-600 transition-all"
                    placeholder="Nhập username hoặc email..."
                  />
                </div>
              </div>

              {/* Chỉ hiện nhập Nghệ danh nếu chọn Nâng cấp */}
              {action === 'upgrade' && (
                <div className="space-y-1.5 group animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-neutral-400 group-focus-within:text-green-400 transition-colors">
                    Nghệ danh hiển thị (Artist Name)
                  </label>
                  <div className="relative">
                    <Music size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input
                      type="text"
                      required={action === 'upgrade'}
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 text-white placeholder-neutral-600 transition-all"
                      placeholder="Ví dụ: Sơn Tùng M-TP"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !keyword || (action === 'upgrade' && !artistName)}
              className={`w-full mt-8 py-3.5 px-4 font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 ${
                action === 'upgrade' 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black shadow-green-500/20' 
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-red-500/20'
              }`}
            >
              {isLoading ? (
                <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${action === 'upgrade' ? 'border-black' : 'border-white'}`} />
              ) : (
                <>
                  {action === 'upgrade' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                  Xác nhận {action === 'upgrade' ? 'Cấp quyền' : 'Hạ quyền'}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Cột Hướng dẫn */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
            <h3 className="text-white font-bold mb-3">Quy trình hệ thống</h3>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">1.</span>
                Nhập username hoặc email bạn muốn thực hiện thay đổi quyền của người dùng.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">2.</span>
                <strong>Nếu Cấp quyền:</strong> User được nâng lên role Artist.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">3.</span>
                <strong>Nếu Hạ quyền:</strong> Chuyển Artist về User thường.
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}