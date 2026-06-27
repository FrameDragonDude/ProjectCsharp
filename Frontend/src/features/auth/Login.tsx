import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { login, getProfile } from '../../services/api/tuneVaultApi';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginResponse = await login(username, password);

      localStorage.setItem('tunevault_token', loginResponse.token);

      const profile = await getProfile();

      const user = {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        role: profile.role || profile.roleId // THÊM DÒNG NÀY ĐỂ BẮT ROLE TỪ API
      };

      setAuth(user, loginResponse.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in zoom-in duration-500">
      <h2 className="text-2xl font-bold text-center mb-6 text-white tracking-wide">Chào mừng trở lại</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        <div className="space-y-1.5 group">
          <label className="text-sm font-medium text-neutral-400 group-focus-within:text-green-400 transition-colors">Email hoặc Tên đăng nhập</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 text-white placeholder-neutral-600 transition-all"
            placeholder="Nhập email hoặc tên đăng nhập"
          />
        </div>

        <div className="space-y-1.5 group">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-neutral-400 group-focus-within:text-green-400 transition-colors">Mật khẩu</label>
            <a href="#" className="text-xs text-neutral-500 hover:text-white transition-colors">Quên mật khẩu?</a>
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 text-white placeholder-neutral-600 transition-all pr-12"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 mt-6"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Đang xử lý...
            </span>
          ) : 'Đăng nhập'}
        </button>

        <p className="text-center text-sm text-neutral-400 mt-8">
          Chưa có tài khoản?{' '}
          <a href="/register" className="text-green-400 hover:text-green-300 hover:underline font-semibold transition-colors">
            Đăng ký ngay
          </a>
        </p>
      </form>
    </div>
  );
}