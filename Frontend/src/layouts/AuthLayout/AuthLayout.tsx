import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-black text-white rounded-lg shadow-2xl p-8 border border-neutral-800">
        <div className="flex flex-col items-center justify-center mb-8 space-y-2">
          {/* Logo giả lập */}
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-black font-bold text-xl">TV</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">TuneVault</h1>
        </div>
        
        {/* Nội dung form (Login/Register) sẽ được render ở đây */}
        <Outlet />
      </div>
    </div>
  );
}