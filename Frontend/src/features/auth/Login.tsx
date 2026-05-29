import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function Login() {
  const [email, setEmail] = useState('');
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
      // TODO: Thay thế bằng API call thực tế qua Axios
      // const response = await axiosClient.post('/auth/login', { email, password });
      
      // MOCK API DELAY: Giả lập thời gian chờ server
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (email === 'test@sg.edu.vn' && password === '123456') {
        const mockUser = { id: '1', email, fullName: 'Sinh Viên SGU' };
        const mockToken = 'jwt-fake-token-123';
        
        setAuth(mockUser, mockToken);
        navigate('/'); // Chuyển về trang chủ sau khi login thành công
      } else {
        throw new Error('Email hoặc mật khẩu không đúng!');
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
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
        {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
      </button>

      <p className="text-center text-sm text-neutral-400 mt-6">
        Chưa có tài khoản?{' '}
        <a href="#" className="text-white hover:underline font-medium">
          Đăng ký ngay
        </a>
      </p>
    </form>
  );
}