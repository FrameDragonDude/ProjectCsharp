import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { register } from '../../services/api/tuneVaultApi';

export default function Register() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await register(username, email, password, fullName);
      
      // Redirect to login after successful registration
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data || err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 rounded text-sm text-center">
          {error}
        </div>
      )}
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-300">Tên đăng nhập</label>
        <input
          type="text"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-neutral-500"
          placeholder="username123"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-300">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-neutral-500"
          placeholder="name@sg.edu.vn"
        />
      </div>
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-300">Họ và tên</label>
        <input
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-neutral-500"
          placeholder="Vũ Lê Đức Anh"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-300">Mật khẩu</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-neutral-500"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
      >
        {isLoading ? 'Đang xử lý...' : 'Đăng ký'}
      </button>

      <p className="text-center text-sm text-neutral-400 mt-6">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-white hover:underline font-medium">
          Đăng nhập ngay
        </Link>
      </p>
    </form>
  );
}
