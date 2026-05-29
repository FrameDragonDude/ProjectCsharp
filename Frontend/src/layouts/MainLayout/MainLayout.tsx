import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import PlayerBar from './PlayerBar';

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Vùng phía trên chứa Sidebar, Main Content, và Right Panel */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        
        {/* Vùng nội dung trung tâm (Cuộn độc lập) */}
        <main className="flex-1 overflow-y-auto bg-neutral-900 rounded-lg my-2 mr-2">
          {/* Component tương ứng với Route sẽ được render tại <Outlet /> */}
          <Outlet /> 
        </main>

        {/* Panel phải (ẩn trên màn hình nhỏ, hiện trên màn hình lớn) */}
        <aside className="w-72 bg-black hidden lg:flex flex-col p-4 border-l border-neutral-900 my-2">
           <h3 className="text-sm font-bold text-neutral-400 mb-4">Chi tiết bài hát</h3>
           <div className="flex-1 flex items-center justify-center text-neutral-600 text-sm border-2 border-dashed border-neutral-800 rounded-lg">
             Panel Phải
           </div>
        </aside>
      </div>

      {/* Vùng Player cố định phía dưới */}
      <PlayerBar />
    </div>
  );
}