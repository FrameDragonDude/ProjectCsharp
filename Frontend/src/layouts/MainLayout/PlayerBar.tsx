import { Play, SkipBack, SkipForward, Volume2 } from 'lucide-react';

export default function PlayerBar() {
  return (
    <div className="h-24 bg-black border-t border-neutral-800 flex items-center justify-between px-4 shrink-0">
      {/* Khối bên trái: Thông tin bài hát đang phát */}
      <div className="flex items-center space-x-4 w-1/3">
        <div className="w-14 h-14 bg-neutral-800 rounded shadow-md"></div>
        <div>
          <h4 className="text-sm font-semibold text-white">Chưa phát bài nào</h4>
          <p className="text-xs text-neutral-400">...</p>
        </div>
      </div>

      {/* Khối ở giữa: Các nút điều khiển */}
      <div className="flex flex-col items-center justify-center w-1/3 space-y-2">
        <div className="flex items-center space-x-6">
          <button className="text-neutral-400 hover:text-white transition"><SkipBack size={20} /></button>
          <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition">
            <Play size={16} className="ml-1" />
          </button>
          <button className="text-neutral-400 hover:text-white transition"><SkipForward size={20} /></button>
        </div>
        {/* Thanh progress bar giả lập */}
        <div className="w-full max-w-md flex items-center space-x-2">
          <span className="text-xs text-neutral-400">0:00</span>
          <div className="h-1 flex-1 bg-neutral-600 rounded-full flex items-center cursor-pointer hover:bg-neutral-500">
             <div className="h-1 bg-white w-0 rounded-full"></div>
          </div>
          <span className="text-xs text-neutral-400">0:00</span>
        </div>
      </div>

      {/* Khối bên phải: Âm lượng */}
      <div className="flex items-center justify-end w-1/3 space-x-3 text-neutral-400">
        <Volume2 size={20} />
        <div className="w-24 h-1 bg-neutral-600 rounded-full cursor-pointer hover:bg-neutral-500">
           <div className="h-1 bg-white w-2/3 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}