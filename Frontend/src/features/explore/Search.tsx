import { useState } from 'react';
import { Search as SearchIcon, Play } from 'lucide-react';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');

  // Dữ liệu mẫu cho các danh mục (Thể loại nhạc)
  const browseCategories = [
    { id: 1, title: 'Electronic', color: 'bg-blue-600' },
    { id: 2, title: 'Trance', color: 'bg-purple-600' },
    { id: 3, title: 'Hip-hop', color: 'bg-orange-600' },
    { id: 4, title: 'Pop', color: 'bg-pink-600' },
    { id: 5, title: 'Podcast', color: 'bg-green-600' },
    { id: 6, title: 'Khám phá', color: 'bg-indigo-600' },
  ];

  // Dữ liệu mẫu cho kết quả tìm kiếm
  const mockResults = [
    { id: 1, title: 'Faded', artist: 'Alan Walker', type: 'Bài hát', imageUrl: '' },
    { id: 2, title: 'Blah Blah Blah', artist: 'Armin van Buuren', type: 'Bài hát', imageUrl: '' },
    { id: 3, title: 'Little Things', artist: 'Jorja Smith', type: 'Bài hát', imageUrl: '' },
    { id: 4, title: 'Stars', artist: 'VIZE', type: 'Bài hát', imageUrl: '' },
  ];

  // Lọc kết quả dựa trên từ khóa
  const filteredResults = mockResults.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8 flex flex-col h-full">
      {/* Thanh tìm kiếm */}
      <div className="sticky top-0 z-10 bg-neutral-900 pb-4">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-neutral-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border-transparent rounded-full bg-neutral-800 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-white focus:bg-neutral-700 sm:text-sm transition"
            placeholder="Bạn muốn nghe gì?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Vùng hiển thị nội dung */}
      {searchQuery === '' ? (
        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">Duyệt tìm tất cả</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {browseCategories.map((category) => (
              <div
                key={category.id}
                className={`${category.color} rounded-lg p-4 h-40 relative overflow-hidden cursor-pointer hover:opacity-90 transition shadow-lg`}
              >
                <h3 className="text-xl font-bold text-white z-10 relative">{category.title}</h3>
                {/* Khối vuông giả lập làm hình ảnh decor xoay nghiêng */}
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-black/20 rotate-[25deg] rounded shadow-2xl"></div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section>
          <h2 className="text-xl font-bold mb-4 text-white">Kết quả hàng đầu</h2>
          {filteredResults.length > 0 ? (
            <div className="flex flex-col space-y-2">
              {filteredResults.map((result) => (
                <div 
                  key={result.id} 
                  className="flex items-center p-3 rounded-md bg-transparent hover:bg-neutral-800/50 cursor-pointer group transition"
                >
                  <div className="w-12 h-12 bg-neutral-700 rounded mr-4 relative flex-shrink-0">
                    <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded">
                      <Play fill="white" className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-white font-semibold">{result.title}</span>
                    <span className="text-neutral-400 text-sm">
                      {result.type} • {result.artist}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-neutral-400 mt-10">
              Không tìm thấy kết quả nào cho "{searchQuery}"
            </div>
          )}
        </section>
      )}
    </div>
  );
}