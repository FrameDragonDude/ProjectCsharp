import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-neutral-950 overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.37)] p-8 z-10 transition-all duration-300 hover:shadow-green-500/10 hover:border-white/20">
        <div className="flex flex-col items-center justify-center mb-8 space-y-3">
          <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
            <span className="text-black font-extrabold text-2xl tracking-tighter">TV</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
            TuneVault
          </h1>
        </div>
        
        {/* Nội dung form (Login/Register) sẽ được render ở đây */}
        <Outlet />
      </div>
    </div>
  );
}