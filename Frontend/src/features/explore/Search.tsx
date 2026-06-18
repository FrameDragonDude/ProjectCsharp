import { useEffect, useMemo, useState } from 'react';
import { Album, ArrowLeft, ListMusic, Play, Search as SearchIcon, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLibrarySummary, getVideoItems, searchCatalog } from '../../services/api/tuneVaultApi';
import { resolveAssetUrl } from '../../utils/resolveAsset';
import { usePlayerStore } from '../../store/usePlayerStore';
import type { Album as AlbumType, MediaItem, Playlist as PlaylistType, SearchResult } from '../../types';

type BrowseCategory = 'Song' | 'Video' | 'Album' | 'Playlist';

const categoryMeta: Record<
  BrowseCategory,
  { title: string; icon: typeof Play; color: string; emptyMessage: string }
> = {
  Song: {
    title: 'Bài hát',
    icon: Play,
    color: 'from-blue-600 to-cyan-500',
    emptyMessage: 'Chưa có bài hát nào.',
  },
  Video: {
    title: 'Video',
    icon: Video,
    color: 'from-orange-600 to-amber-500',
    emptyMessage: 'Chưa có video nào.',
  },
  Album: {
    title: 'Album',
    icon: Album,
    color: 'from-purple-600 to-fuchsia-500',
    emptyMessage: 'Chưa có album nào.',
  },
  Playlist: {
    title: 'Playlist',
    icon: ListMusic,
    color: 'from-emerald-600 to-lime-500',
    emptyMessage: 'Chưa có playlist nào.',
  },
};

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<BrowseCategory | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const playTrack = usePlayerStore((state) => state.playTrack);
  const openVideo = usePlayerStore((state) => state.openVideo);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError('');
        const trimmedQuery = searchQuery.trim();

        if (trimmedQuery) {
          const data = await searchCatalog(trimmedQuery);
          setResults(data);
          return;
        }

        if (!activeCategory) {
          setResults([]);
          return;
        }

        if (activeCategory === 'Video') {
          const videos = await getVideoItems();
          setResults(videos.map((video) => mapMediaItemToSearchResult(video, 'Video')));
          return;
        }

        const summary = await getLibrarySummary();
        if (activeCategory === 'Song') {
          setResults(summary.songs.map((song) => mapMediaItemToSearchResult(song, 'Song')));
          return;
        }

        if (activeCategory === 'Album') {
          setResults(summary.albums.map(mapAlbumToSearchResult));
          return;
        }

        setResults(summary.playlists.map(mapPlaylistToSearchResult));
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Không tải được dữ liệu từ API');
      } finally {
        setLoading(false);
      }
    })();
  }, [activeCategory, searchQuery]);

  const groupedResults = useMemo(() => {
    return {
      songs: results.filter((item) => item.type === 'Song'),
      videos: results.filter((item) => item.type === 'Video'),
      albums: results.filter((item) => item.type === 'Album'),
      playlists: results.filter((item) => item.type === 'Playlist'),
    };
  }, [results]);

  const hasAnyResults =
    groupedResults.songs.length > 0 ||
    groupedResults.videos.length > 0 ||
    groupedResults.albums.length > 0 ||
    groupedResults.playlists.length > 0;

  const browseCategories: BrowseCategory[] = ['Song', 'Album', 'Video', 'Playlist'];

  const buildMediaItem = (result: SearchResult, fallbackMediaType: 'Audio' | 'Video'): MediaItem => ({
    id: result.id,
    title: result.title,
    filePath: result.filePath ?? '',
    duration: result.subtitle.split('•').at(-1)?.trim() ?? '0:00',
    mediaType: result.mediaType ?? fallbackMediaType,
    ownerId: '22222222-2222-2222-2222-222200000002',
    albumId: result.albumId ?? null,
    albumTitle: null,
    artistName: result.subtitle.split('•')[0]?.trim() ?? null,
    coverImageUrl: result.coverImageUrl ?? null,
  });

  function mapMediaItemToSearchResult(item: MediaItem, type: 'Song' | 'Video'): SearchResult {
    return {
      id: item.id,
      title: item.title,
      subtitle: `${item.artistName ?? 'TuneVault'} • ${item.duration}`,
      type,
      mediaType: item.mediaType,
      albumId: item.albumId ?? null,
      filePath: item.filePath,
      coverImageUrl: item.coverImageUrl ?? null,
    };
  }

  function mapAlbumToSearchResult(album: AlbumType): SearchResult {
    return {
      id: album.id,
      title: album.title,
      subtitle: `${album.artistName ?? 'TuneVault'} • Album`,
      type: 'Album',
      albumId: null,
      filePath: undefined,
      coverImageUrl: album.coverImageUrl ?? null,
    };
  }

  function mapPlaylistToSearchResult(playlist: PlaylistType): SearchResult {
    return {
      id: playlist.id,
      title: playlist.name,
      subtitle: `${playlist.trackCount} bài hát`,
      type: 'Playlist',
      albumId: null,
      filePath: undefined,
      coverImageUrl: playlist.coverImageUrl ?? null,
    };
  }

  const selectedCategory = activeCategory ? categoryMeta[activeCategory] : null;

  const renderResults = (category: BrowseCategory) => {
    const meta = categoryMeta[category];
    const items =
      category === 'Song'
        ? groupedResults.songs
        : category === 'Video'
          ? groupedResults.videos
          : category === 'Album'
            ? groupedResults.albums
            : groupedResults.playlists;

    if (loading) {
      return <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>;
    }

    if (items.length === 0) {
      return <div className="text-center text-neutral-400 mt-10">{meta.emptyMessage}</div>;
    }

    if (category === 'Song') {
      return (
        <div className="flex flex-col space-y-2">
          {items.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => playTrack(buildMediaItem(result, 'Audio'))}
              className="flex items-center justify-between gap-4 p-3 rounded-xl bg-transparent hover:bg-neutral-800/50 cursor-pointer group transition text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-neutral-700 rounded-xl relative flex-shrink-0 overflow-hidden flex items-center justify-center text-neutral-300">
                  {result.coverImageUrl ? (
                    <img src={resolveAssetUrl(result.coverImageUrl)} alt={result.title} className="h-full w-full object-cover" />
                  ) : (
                    <Play fill="white" className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-white font-semibold truncate">{result.title}</span>
                  <span className="text-neutral-400 text-sm truncate">{result.subtitle}</span>
                </div>
              </div>
              <span className="rounded-full bg-white text-black px-3 py-2 text-sm font-semibold">Phát</span>
            </button>
          ))}
        </div>
      );
    }

    if (category === 'Video') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((video) => (
            <button
              key={video.id}
              type="button"
              onClick={() => openVideo(buildMediaItem(video, 'Video'))}
              className="rounded-2xl border border-white/5 bg-neutral-950/60 p-4 hover:bg-neutral-950 transition text-left"
            >
              <div className="aspect-square rounded-xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center text-neutral-400">
                {video.coverImageUrl ? (
                  <img src={resolveAssetUrl(video.coverImageUrl)} alt={video.title} className="h-full w-full object-cover" />
                ) : (
                  <Video size={42} />
                )}
              </div>
              <p className="text-lg font-semibold truncate">{video.title}</p>
              <p className="text-sm text-neutral-400 truncate">{video.subtitle}</p>
            </button>
          ))}
        </div>
      );
    }

    if (category === 'Album') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((album) => (
            <Link
              key={album.id}
              to={`/album/${album.id}`}
              className="rounded-2xl border border-white/5 bg-neutral-950/60 p-4 hover:bg-neutral-950 transition block"
            >
              <div className="aspect-square rounded-xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center text-neutral-400">
                {album.coverImageUrl ? (
                  <img src={resolveAssetUrl(album.coverImageUrl)} alt={album.title} className="h-full w-full object-cover" />
                ) : (
                  <Album size={42} />
                )}
              </div>
              <p className="text-lg font-semibold truncate">{album.title}</p>
              <p className="text-sm text-neutral-400 truncate">{album.subtitle}</p>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((playlist) => (
          <Link
            key={playlist.id}
            to={`/playlist/${playlist.id}`}
            className="rounded-2xl border border-white/5 bg-neutral-950/60 p-4 hover:bg-neutral-950 transition block"
          >
            <div className="aspect-square rounded-xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center text-neutral-400">
              {playlist.coverImageUrl ? (
                <img src={resolveAssetUrl(playlist.coverImageUrl)} alt={playlist.title} className="h-full w-full object-cover" />
              ) : (
                <ListMusic size={42} />
              )}
            </div>
            <p className="text-lg font-semibold truncate">{playlist.title}</p>
            <p className="text-sm text-neutral-400 truncate">{playlist.subtitle}</p>
          </Link>
        ))}
      </div>
    );
  };

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

      {!activeCategory && searchQuery === '' ? (
        <section>
          <h2 className="text-2xl font-bold mb-4 text-white">Khám phá danh mục</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {browseCategories.map((category) => {
              const meta = categoryMeta[category];
              const Icon = meta.icon;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category);
                    setSearchQuery('');
                  }}
                  className={`bg-gradient-to-br ${meta.color} rounded-2xl p-4 h-40 relative overflow-hidden hover:opacity-90 transition shadow-lg text-left`}
                >
                  <Icon className="h-6 w-6 text-white/90 mb-3 relative z-10" />
                  <h3 className="text-xl font-bold text-white z-10 relative">{meta.title}</h3>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-black/20 rotate-[25deg] rounded shadow-2xl" />
                </button>
              );
            })}
          </div>
        </section>
      ) : activeCategory ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-neutral-400">Đang duyệt</p>
              <h2 className="text-2xl font-bold text-white">{selectedCategory?.title}</h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
              Không tìm kiếm được dữ liệu. {error}
            </div>
          )}

          {renderResults(activeCategory)}
        </div>
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
            ) : groupedResults.songs.length > 0 ? (
              <div className="flex flex-col space-y-2">
                {groupedResults.songs.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => playTrack(buildMediaItem(result, 'Audio'))}
                    className="flex items-center justify-between gap-4 p-3 rounded-xl bg-transparent hover:bg-neutral-800/50 cursor-pointer group transition text-left"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 bg-neutral-700 rounded-xl relative flex-shrink-0 overflow-hidden flex items-center justify-center text-neutral-300">
                        {result.coverImageUrl ? (
                          <img src={resolveAssetUrl(result.coverImageUrl)} alt={result.title} className="h-full w-full object-cover" />
                        ) : (
                          <Play fill="white" className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-semibold truncate">{result.title}</span>
                        <span className="text-neutral-400 text-sm truncate">{result.subtitle}</span>
                      </div>
                    </div>
                    <span className="rounded-full bg-white text-black px-3 py-2 text-sm font-semibold">Phát</span>
                  </button>
                ))}
              </div>
            ) : !hasAnyResults ? (
              <div className="text-center text-neutral-400 mt-10">Không tìm thấy kết quả nào cho "{searchQuery}"</div>
            ) : null}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white">Video</h2>
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
            ) : groupedResults.videos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupedResults.videos.map((video) => (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => openVideo(buildMediaItem(video, 'Video'))}
                    className="rounded-2xl border border-white/5 bg-neutral-950/60 p-4 hover:bg-neutral-950 transition text-left"
                  >
                    <div className="aspect-square rounded-xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center text-neutral-400">
                      {video.coverImageUrl ? (
                        <img src={resolveAssetUrl(video.coverImageUrl)} alt={video.title} className="h-full w-full object-cover" />
                      ) : (
                        <Video size={42} />
                      )}
                    </div>
                    <p className="text-lg font-semibold truncate">{video.title}</p>
                    <p className="text-sm text-neutral-400 truncate">{video.subtitle}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-neutral-400 mt-10">Không có video nào khớp với từ khóa này.</div>
            )}
          </section>

          <section>
            <h2 className="text-xl font-bold mb-4 text-white">Album</h2>
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
            ) : groupedResults.albums.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupedResults.albums.map((album) => (
                  <Link
                    key={album.id}
                    to={`/album/${album.id}`}
                    className="rounded-2xl border border-white/5 bg-neutral-950/60 p-4 hover:bg-neutral-950 transition block"
                  >
                    <div className="aspect-square rounded-xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center text-neutral-400">
                      {album.coverImageUrl ? (
                        <img src={resolveAssetUrl(album.coverImageUrl)} alt={album.title} className="h-full w-full object-cover" />
                      ) : (
                        <Album size={42} />
                      )}
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

          <section>
            <h2 className="text-xl font-bold mb-4 text-white">Playlist</h2>
            {loading ? (
              <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
            ) : groupedResults.playlists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {groupedResults.playlists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    to={`/playlist/${playlist.id}`}
                    className="rounded-2xl border border-white/5 bg-neutral-950/60 p-4 hover:bg-neutral-950 transition block"
                  >
                    <div className="aspect-square rounded-xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center text-neutral-400">
                      {playlist.coverImageUrl ? (
                        <img src={resolveAssetUrl(playlist.coverImageUrl)} alt={playlist.title} className="h-full w-full object-cover" />
                      ) : (
                        <ListMusic size={42} />
                      )}
                    </div>
                    <p className="text-lg font-semibold truncate">{playlist.title}</p>
                    <p className="text-sm text-neutral-400 truncate">{playlist.subtitle}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center text-neutral-400 mt-10">Chưa có playlist nào khớp với từ khóa này.</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
