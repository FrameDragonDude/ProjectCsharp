import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { register } from '../../services/api/tuneVaultApi';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      setError('Vui lòng sử dụng địa chỉ email @gmail.com hợp lệ.');
      return false;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(password)) {
      setError('Mật khẩu phải có ít nhất 6 ký tự, bao gồm ít nhất 1 chữ cái, 1 chữ số và 1 ký tự đặc biệt.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      await register(username, email, password, fullName);
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in zoom-in duration-500">
      <h2 className="text-2xl font-bold text-center mb-6 text-white tracking-wide">Tạo tài khoản mới</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center animate-in slide-in-from-top-2">
            {error}
          </div>
        )}
        
        <div className="space-y-1.5 group">
          <label className="text-sm font-medium text-neutral-400 group-focus-within:text-green-400 transition-colors">Tên đăng nhập</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 text-white placeholder-neutral-600 transition-all"
            placeholder="username123"
          />
        </div>

        <div className="space-y-1.5 group">
          <label className="text-sm font-medium text-neutral-400 group-focus-within:text-green-400 transition-colors">Họ và tên</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 text-white placeholder-neutral-600 transition-all"
            placeholder="Ví dụ: Nguyễn Văn A"
          />
        </div>

        <div className="space-y-1.5 group">
          <label className="text-sm font-medium text-neutral-400 group-focus-within:text-green-400 transition-colors">Email (@gmail.com)</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 text-white placeholder-neutral-600 transition-all"
            placeholder="name@gmail.com"
          />
        </div>
        
        <div className="space-y-1.5 group">
          <label className="text-sm font-medium text-neutral-400 group-focus-within:text-green-400 transition-colors">Mật khẩu</label>
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
          ) : 'Đăng ký tài khoản'}
        </button>

        <p className="text-center text-sm text-neutral-400 mt-6">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-green-400 hover:text-green-300 hover:underline font-semibold transition-colors">
            Đăng nhập ngay
          </Link>
        </p>
      </form>
    </div>
  );
}

