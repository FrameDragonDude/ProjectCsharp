import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import PlayerBar from './PlayerBar';
import GlobalAudioPlayer from '../../components/GlobalAudioPlayer';

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Vùng phía trên chứa Sidebar, Main Content, và Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto bg-neutral-900 rounded-lg my-2 mr-2">
          <Outlet /> 
        </main>

        <aside className="w-72 bg-black hidden lg:flex flex-col p-4 border-l border-neutral-900 my-2">
          <h3 className="text-sm font-bold text-neutral-400 mb-4">Chi tiết nội dung</h3>
          <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm border-2 border-dashed border-neutral-800 rounded-lg px-4 text-center">
            Chọn một bài hát, album hoặc video để xem chi tiết ở đây.
          </div>
        </aside>
      </div>

      <PlayerBar />
      <GlobalAudioPlayer />
    </div>
  );
}