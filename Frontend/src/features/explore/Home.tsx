import { useEffect, useMemo, useState } from 'react';
import { Album, Music2, Play, Plus, Video, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getArtists, getLibrarySummary, getRecentPlayHistories } from '../../services/api/tuneVaultApi';
import { resolveAssetUrl } from '../../utils/resolveAsset';
import { usePlayerStore } from '../../store/usePlayerStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Album as AlbumType, ArtistSummary, MediaItem, PlayHistory } from '../../types';

type ArtistCard = ArtistSummary & {
  coverImageUrl?: string | null;
};

export default function Home() {
  const [songs, setSongs] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<AlbumType[]>([]);
  const [artists, setArtists] = useState<ArtistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentSongs, setRecentSongs] = useState<PlayHistory[]>([]);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const openVideo = usePlayerStore((state) => state.openVideo);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUser = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        setLoading(true);
        const [library, artistList] = await Promise.all([getLibrarySummary(), getArtists()]);
        if (!mounted) return;

        setSongs(library.songs);
        setAlbums(library.albums);
        setArtists(artistList);
        setError('');
      } catch (requestError) {
        if (!mounted) return;
        setError(requestError instanceof Error ? requestError.message : 'Khong tai duoc du lieu tu API');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    if (isAuthenticated && currentUser) {
      void getRecentPlayHistories(currentUser)
        .then((data) => {
          if (mounted) {
            setRecentSongs(data.slice(0, 20));
          }
        })
        .catch((err) => console.error('Loi lay lich su nghe nhac:', err));
    }

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  const artistCards = useMemo<ArtistCard[]>(() => {
    return artists.map((artist) => {
      const artistAlbums = albums.filter((album) => album.artistId === artist.id);
      const albumTracks = songs.filter((song) => artistAlbums.some((album) => album.id === song.albumId));
      const coverImageUrl =
        artist.avatarUrl ??
        artistAlbums.find((album) => album.coverImageUrl)?.coverImageUrl ??
        artist.coverImageUrl ??
        albumTracks.find((song) => song.coverImageUrl)?.coverImageUrl ??
        null;

      return {
        ...artist,
        coverImageUrl,
      };
    });
  }, [albums, artists, songs]);

  const artistAlbumCount = (artistId: string) => albums.filter((album) => album.artistId === artistId).length;
  const artistTrackCount = (artistId: string) => songs.filter((song) => albums.some((album) => album.id === song.albumId && album.artistId === artistId)).length;

  return (
    <div className="p-6 space-y-10 text-white">
      <h1 className="text-3xl font-bold">Trang chủ</h1>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-400 mb-2">Nghệ sĩ</p>
            <h2 className="text-2xl md:text-3xl font-bold">Nghệ sĩ nổi bật</h2>
          </div>
          <span className="text-sm text-neutral-400">{artistCards.length} nghệ sĩ</span>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            Không tải được dữ liệu nghệ sĩ. {error}
          </div>
        ) : artistCards.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
            Chưa có nghệ sĩ nào trong database.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {artistCards.map((artist) => (
              <Link
                key={artist.id}
                to={`/artist/${artist.id}`}
                className="min-w-[180px] max-w-[180px] shrink-0 rounded-2xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition snap-start"
              >
                <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-800 mb-4 flex items-center justify-center text-neutral-400">
                  {artist.coverImageUrl ? (
                    <img
                      src={resolveAssetUrl(artist.coverImageUrl)}
                      alt={artist.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Users size={42} />
                  )}
                </div>
                <p className="font-semibold truncate">{artist.name}</p>
                <p className="text-sm text-neutral-400 truncate">{artistAlbumCount(artist.id)} album</p>
                <p className="text-sm text-neutral-400 truncate">{artistTrackCount(artist.id)} bài hát</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {isAuthenticated && (
        <section className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-neutral-400 mb-2">Nghe gần đây</p>
              <h2 className="text-2xl md:text-3xl font-bold">Nhạc bạn vừa nghe</h2>
            </div>
            <span className="text-sm text-neutral-400">Tối đa 20 bài</span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
          ) : recentSongs.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
              Chưa có lịch sử nghe gần đây.
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
              {recentSongs.map((song) => {
                const coverUrl = song.coverImageUrl
                  ? resolveAssetUrl(song.coverImageUrl)
                  : resolveAssetUrl('default-cover.svg');

                return (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => {
                      const matchingSong = songs.find((s) => s.id === song.mediaItemId);
                      if (matchingSong) {
                        playTrack(matchingSong, songs);
                      }
                    }}
                    className="min-w-[180px] max-w-[180px] shrink-0 text-left rounded-2xl border border-white/5 bg-neutral-950/70 p-4 hover:bg-neutral-950 transition snap-start"
                  >
                    <img
                      src={coverUrl}
                      alt="cover"
                      className="w-full aspect-square object-cover rounded-xl mb-3 shadow-lg"
                    />
                    <h3 className="font-semibold truncate">
                      {song.mediaTitle || `Bài hát ${song.mediaItemId.substring(0, 4)}`}
                    </h3>
                    <p className="text-sm text-neutral-400 truncate">
                      {song.artistName ?? 'TuneVault'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-400 mb-2">Tuần này</p>
            <h2 className="text-3xl font-bold">Danh sách bài hát</h2>
          </div>
          <Link to="/library" className="text-sm text-neutral-300 hover:text-white transition">
            Mở thư viện
          </Link>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            Không tải được dữ liệu bài hát. {error}
          </div>
        ) : songs.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
            Chưa có bài hát nào trong database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {songs.slice(0, 6).map((song) => (
              <div
                key={song.id}
                className="group rounded-2xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-xl bg-neutral-800 overflow-hidden flex items-center justify-center shrink-0 text-neutral-300">
                    {song.coverImageUrl ? (
                      <img
                        src={resolveAssetUrl(song.coverImageUrl)}
                        alt={song.title}
                        className="h-full w-full object-cover"
                      />
                    ) : song.mediaType === 'Video' ? (
                      <Video size={24} />
                    ) : (
                      <Music2 size={24} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold truncate">{song.title}</p>
                    <p className="text-sm text-neutral-400 truncate">
                      {song.artistName ?? 'TuneVault'} • {song.duration}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={() => playTrack(song, songs)}
                        className="inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-semibold hover:scale-[1.02] transition"
                      >
                        <Play size={16} /> Phát
                      </button>
                      {song.mediaType === 'Video' ? (
                        <button
                          onClick={() => openVideo(song)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 hover:text-white hover:border-white/30 transition"
                        >
                          <Plus size={16} />
                          Xem video
                        </button>
                      ) : (
                        <Link
                          to="/library"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 hover:text-white hover:border-white/30 transition"
                        >
                          <Plus size={16} />
                          Thêm vào playlist
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-neutral-400 mb-2">Album</p>
            <h3 className="text-2xl font-bold">Danh sách Album</h3>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
            Không tải được dữ liệu album. {error}
          </div>
        ) : albums.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
            Chưa có album nào trong database.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {albums.map((album) => (
              <Link
                key={album.id}
                to={`/album/${album.id}`}
                className="block rounded-2xl border border-white/5 bg-neutral-950/60 p-4 hover:bg-neutral-950 transition"
              >
                <div className="aspect-square rounded-xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center text-neutral-400">
                  {album.coverImageUrl ||
                  songs.find((song) => song.albumId === album.id)?.coverImageUrl ? (
                    <img
                      src={resolveAssetUrl(
                        album.coverImageUrl ??
                          songs.find((song) => song.albumId === album.id)?.coverImageUrl ??
                          '',
                      )}
                      alt={album.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Album size={42} />
                  )}
                </div>
                <p className="text-lg font-semibold truncate">{album.title}</p>
                <p className="text-sm text-neutral-400 truncate">
                  {album.artistName ?? 'TuneVault'} • {album.releaseDate}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
