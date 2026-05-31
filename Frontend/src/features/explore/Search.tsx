import { useEffect, useMemo, useState } from 'react';
import { Album, Play, Search as SearchIcon, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchCatalog } from '../../services/api/tuneVaultApi';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { SearchResult } from '../../types';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const playTrack = usePlayerStore((state) => state.playTrack);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const data = await searchCatalog(searchQuery);
        setResults(data);
        setError('');
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Không tải được dữ liệu từ API');
      } finally {
        setLoading(false);
      }
    })();
  }, [searchQuery]);

  const songResults = useMemo(() => results.filter((item) => item.type === 'Song'), [results]);
  const albumResults = useMemo(() => results.filter((item) => item.type === 'Album'), [results]);

  const browseCategories = [
    { id: 1, title: 'Bài hát', color: 'from-blue-600 to-cyan-500' },
    { id: 2, title: 'Album', color: 'from-purple-600 to-fuchsia-500' },
    { id: 3, title: 'Video', color: 'from-orange-600 to-amber-500' },
    { id: 4, title: 'Playlist', color: 'from-emerald-600 to-lime-500' },
  ];

  return (
    <div className="p-6 space-y-8 flex flex-col h-full">
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

      {searchQuery === '' ? (
        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">Khám phá danh mục</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {browseCategories.map((category) => (
              <div
                key={category.id}
                className={`bg-gradient-to-br ${category.color} rounded-2xl p-4 h-40 relative overflow-hidden cursor-pointer hover:opacity-90 transition shadow-lg`}
              >
                <h3 className="text-xl font-bold text-white z-10 relative">{category.title}</h3>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-black/20 rotate-[25deg] rounded shadow-2xl"></div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
              Không tìm kiếm được dữ liệu. {error}
            </div>
          )}

          <section>
            <h2 className="text-xl font-bold mb-4 text-white">Bài hát</h2>
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
            ) : songResults.length > 0 ? (
              <div className="flex flex-col space-y-2">
                {songResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-transparent hover:bg-neutral-800/50 cursor-pointer group transition">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-neutral-700 rounded-xl relative flex-shrink-0 overflow-hidden flex items-center justify-center text-neutral-300">
                        {result.mediaType === 'Video' ? <Video size={18} /> : <Play fill="white" className="w-5 h-5 text-white" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-semibold truncate">{result.title}</span>
                        <span className="text-neutral-400 text-sm truncate">{result.subtitle}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {result.filePath && (
                        <button
                          onClick={() => playTrack({
                            id: result.id,
                            title: result.title,
                            filePath: result.filePath ?? '',
                            duration: result.subtitle.split('•').at(-1)?.trim() ?? '0:00',
                            mediaType: result.mediaType ?? 'Audio',
                            ownerId: '22222222-2222-2222-2222-222222222222',
                            albumId: result.albumId ?? null,
                            coverImageUrl: result.coverImageUrl ?? null,
                          })}
                          className="rounded-full bg-white text-black px-3 py-2 text-sm font-semibold hover:scale-[1.02] transition"
                        >
                          Phát
                        </button>
                      )}
                      <Link to={result.mediaType === 'Video' ? `/video/${result.id}` : '/library'} className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/80 hover:text-white hover:border-white/30 transition">
                        {result.mediaType === 'Video' ? 'Mở video' : 'Thêm vào playlist'}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-neutral-400 mt-10">Không tìm thấy kết quả nào cho "{searchQuery}"</div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white">Album</h2>
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
            ) : albumResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {albumResults.map((album) => (
                  <Link key={album.id} to={`/album/${album.id}`} className="rounded-2xl border border-white/5 bg-neutral-950/60 p-4 hover:bg-neutral-950 transition block">
                    <div className="aspect-square rounded-xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center text-neutral-400">
                      {album.coverImageUrl ? <img src={album.coverImageUrl} alt={album.title} className="h-full w-full object-cover" /> : <Album size={42} />}
                    </div>
                    <p className="text-lg font-semibold truncate">{album.title}</p>
                    <p className="text-sm text-neutral-400 truncate">{album.subtitle}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-neutral-400 mt-10">Chưa có album nào khớp với từ khóa này.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}