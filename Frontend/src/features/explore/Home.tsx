export default function Home() {
  const dummyMixes = [1, 2, 3, 4, 5, 6];
  const dummyRecommended = [1, 2, 3, 4];

  return (
    <div className="p-6 space-y-8">
      {/* Section 1: Lời chào & Mixes */}
      <section>
        <h2 className="text-3xl font-bold mb-4 text-white">Chào buổi sáng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dummyMixes.map((item) => (
            <div key={item} className="flex items-center bg-neutral-800/50 hover:bg-neutral-700/50 transition cursor-pointer rounded overflow-hidden group">
              <div className="w-20 h-20 bg-neutral-700 shadow-md"></div>
              <span className="px-4 font-semibold text-white">Daily Mix {item}</span>
              {/* Nút Play hiển thị khi hover */}
              <div className="ml-auto mr-4 w-10 h-10 bg-green-500 rounded-full items-center justify-center text-black hidden group-hover:flex shadow-lg">
                ▶
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Gợi ý cho bạn */}
      <section>
        <h3 className="text-2xl font-bold mb-4 text-white hover:underline cursor-pointer">Dành cho bạn</h3>
        <div className="flex flex-wrap gap-6">
          {dummyRecommended.map((item) => (
            <div key={item} className="w-48 p-4 bg-neutral-800/40 hover:bg-neutral-800 rounded-md cursor-pointer transition group">
              <div className="w-full aspect-square bg-neutral-700 mb-4 rounded shadow-lg relative">
                {/* Nút Play hiển thị khi hover */}
                <div className="absolute bottom-2 right-2 w-12 h-12 bg-green-500 rounded-full items-center justify-center text-black hidden group-hover:flex shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-all">
                  ▶
                </div>
              </div>
              <h4 className="font-semibold text-white truncate mb-1">Playlist Gợi ý {item}</h4>
              <p className="text-sm text-neutral-400 line-clamp-2">Những bài hát hay nhất được chọn lọc dành riêng cho bạn hôm nay.</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}