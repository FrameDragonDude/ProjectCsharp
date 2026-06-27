import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Album, Music2, Play, Send } from "lucide-react";
import { getArtistById, toggleFollow } from "../../services/api/tuneVaultApi";
import type { ArtistDetail, Album as AlbumType, MediaItem } from "../../types";
import { resolveAssetUrl } from "../../utils/resolveAsset";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useAuthStore } from "../../store/useAuthStore";
import ShareModal from "../../components/ShareModal";

export default function ArtistDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const playTrack = usePlayerStore((state) => state.playTrack);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [data, setData] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    let mounted = true;

    void (async () => {
      try {
        setLoading(true);
        const artistData = await getArtistById(id);
        if (!mounted) return;
        setData(artistData);
        setError("");
      } catch (requestError) {
        if (!mounted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Khong tai duoc du lieu nghe si.",
        );
        setData(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);
  useEffect(() => {
    if (data?.artist?.isFollowing !== undefined) {
      setIsFollowing(data.artist.isFollowing);
    }
  }, [data]);

  const handleFollowToggle = async () => {
    try {
      await toggleFollow(id!, "Artist");
      setIsFollowing((prev) => !prev);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        alert("Vui lòng đăng nhập để theo dõi nghệ sĩ.");
      } else {
        console.error("Lỗi khi thao tác theo dõi", err);
        alert("Có lỗi xảy ra khi thực hiện tác vụ này.");
      }
    }
  };

  const albums = useMemo(() => data?.albums ?? [], [data]);
  const songs = useMemo(() => data?.songs ?? [], [data]);
  const artist = data?.artist ?? null;

  if (!id) {
    return <div className="p-6 text-white">ID nghệ sĩ không hợp lệ.</div>;
  }

  if (loading) {
    return <div className="p-6 text-white">Đang tải...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-white space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-neutral-300 hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          Không tải được dữ liệu nghệ sĩ. {error}
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-6 text-white space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-neutral-300 hover:text-white"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
        <div>Không tìm thấy nghệ sĩ.</div>
      </div>
    );
  }

  const heroCover =
    artist.avatarUrl ??
    artist.coverImageUrl ??
    albums[0]?.coverImageUrl ??
    songs[0]?.coverImageUrl ??
    null;

  return (
    <div className="p-6 space-y-8 text-white">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-neutral-300 hover:text-white transition"
      >
        <ArrowLeft size={16} />
        Quay lại
      </button>

      <section className="flex flex-col lg:flex-row gap-6 lg:items-end">
        <div className="w-40 h-40 md:w-56 md:h-56 rounded-3xl overflow-hidden bg-neutral-800 shrink-0 border border-white/10">
          {heroCover ? (
            <img
              src={resolveAssetUrl(heroCover)}
              alt={artist.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-neutral-400">
              <Music2 size={48} />
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-400">
              Nghệ sĩ
            </p>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{artist.name}</h1>
              <button
                onClick={() => setIsShareOpen(true)}
                className="p-1.5 text-neutral-400 hover:text-green-500 bg-neutral-800/50 hover:bg-neutral-800 rounded transition"
                title="Chia sẻ nghệ sĩ"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="max-w-3xl text-neutral-300">
              {artist.bio ?? "Chưa có mô tả cho nghệ sĩ này."}
            </p>
            {isAuthenticated && (
              <div className="pt-2">
                <button
                  onClick={handleFollowToggle}
                  className={`px-6 py-2 rounded-full font-bold text-sm transition-colors border ${
                    isFollowing
                      ? "bg-transparent border-white text-white hover:border-neutral-400 hover:text-neutral-400"
                      : "bg-white border-transparent text-black hover:bg-neutral-200"
                  }`}
                >
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-neutral-300">
            <span className="rounded-full border border-white/10 px-3 py-1">
              {artist.albumCount} album
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1">
              {artist.trackCount} bài hát
            </span>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Album của nghệ sĩ</h2>
          <p className="text-sm text-neutral-400">{albums.length} album</p>
        </div>

        {albums.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
            Chưa có album nào.
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {albums.map((album: AlbumType) => (
              <Link
                key={album.id}
                to={`/album/${album.id}`}
                className="min-w-[200px] max-w-[200px] shrink-0 rounded-2xl border border-white/5 bg-white/5 p-4 hover:bg-white/10 transition"
              >
                <div className="aspect-square rounded-xl bg-neutral-800 overflow-hidden mb-4 flex items-center justify-center text-neutral-400">
                  {album.coverImageUrl ? (
                    <img
                      src={resolveAssetUrl(album.coverImageUrl)}
                      alt={album.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Album size={42} />
                  )}
                </div>
                <p className="font-semibold truncate">{album.title}</p>
                <p className="text-sm text-neutral-400 truncate">
                  {album.releaseDate}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-bold">Toàn bộ bài hát</h2>
          <p className="text-sm text-neutral-400">{songs.length} bài</p>
        </div>

        {songs.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-neutral-400">
            Chưa có bài hát nào thuộc nghệ sĩ này.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {songs.map((song: MediaItem, index) => (
              <div
                key={song.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
              >
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {index + 1}. {song.title}
                  </p>
                  <p className="text-sm text-neutral-400 truncate">
                    {song.albumTitle ?? "Không có album"} • {song.duration}
                  </p>
                  {song.description && (
                    <p className="text-sm text-neutral-500 truncate">
                      {song.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => playTrack(song, songs)}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:scale-[1.02] transition"
                >
                  <Play size={14} />
                  Phát
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      <ShareModal 
  isOpen={isShareOpen}
  onClose={() => setIsShareOpen(false)}
  artistId={id}
  mediaTitle={artist?.name || "Nghệ sĩ"}
/>
    </div>
  );
}
