import { useState, useEffect } from "react";
import { Inbox,Send,Play,Music,Video,ListMusic,Clock, } from "lucide-react";
import axiosClient from "../../services/api/axiosClient";
import { usePlayerStore } from "../../store/usePlayerStore";

interface ApiSharedItem {
  id: number;
  senderName: string;
  type: "Media" | "Playlist";
  sharedAt: string;
  item: {
    id: string | number;
    title?: string;
    name?: string;
    mediaType?: "Audio" | "Video";
    coverImageUrl?: string;
    artistName?: string;
  };
}

export default function ShareInbox() {
  const [activeTab, setActiveTab] = useState<"inbox" | "sent">("inbox");
  const [shares, setShares] = useState<ApiSharedItem[]>([]);
  const playTrack = usePlayerStore((state) => state.playTrack);
  const playQueue = usePlayerStore((state) => state.playQueue);
  const openVideo = usePlayerStore((state) => state.openVideo);

  useEffect(() => {

    const endpoint = activeTab === "inbox" ? "/shares/inbox" : "/shares/sent";
    axiosClient
      .get(endpoint)
      .then((res) => setShares(res.data))
      .catch((err) => console.error(`Lỗi lấy danh sách ${activeTab}:`, err));
  }, [activeTab]);

  const getMediaIcon = (type: string, mediaType?: string) => {
  if (type === "Playlist") return <ListMusic size={20} className="text-green-400" />;
  if (type === "Album") return <ListMusic size={20} className="text-yellow-400" />;
  if (type === "Artist") return <Music size={20} className="text-pink-400" />;
  if (mediaType === "Video") return <Video size={20} className="text-purple-400" />;
  return <Music size={20} className="text-blue-400" />;
};

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto flex flex-col h-full text-white">
      {/* Header & Tabs */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6">
          Hộp thư Chia sẻ
        </h1>

        <div className="flex space-x-4 border-b border-neutral-800 pb-px">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex items-center space-x-2 pb-3 px-2 text-sm font-semibold transition border-b-2 ${
              activeTab === "inbox"
                ? "border-green-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Inbox size={18} />
            <span>Được chia sẻ với tôi</span>
          </button>

          <button
            onClick={() => setActiveTab("sent")}
            className={`flex items-center space-x-2 pb-3 px-2 text-sm font-semibold transition border-b-2 ${
              activeTab === "sent"
                ? "border-green-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Send size={18} />
            <span>Tôi đã chia sẻ</span>
          </button>
        </div>
      </div>

      {/* Danh sách nội dung */}
      <div className="flex flex-col space-y-3">
        {shares.length > 0 ? (
          shares.map((item) => (
            <div
              key={item.id}
              onClick={() => {

                if (item.type === "Media") {
                  const standardTrack = {
                    ...item.item,
                    id: item.item.id.toString()
                  };
                  
                  if (item.item.mediaType === "Video") {
                    openVideo(standardTrack as any);
                  } else {
                    playTrack(standardTrack as any, [standardTrack as any]);
                  }
                } 

                else if (item.type === "Playlist") {
                  const rawTracks = (item.item as any).tracks || (item.item as any).playlistTracks || [];
                  if (rawTracks.length > 0) {
                    const standardTracks = rawTracks.map((t: any) => ({
                      ...t,
                      id: t.id.toString()
                    }));
                    playQueue(standardTracks, 0);
                  } else {
                    alert("Playlist này hiện đang trống, không có bài hát để phát!");
                  }
                }
              }}
              className="flex items-center p-4 bg-neutral-800/40 hover:bg-neutral-800 rounded-lg group transition cursor-pointer border border-transparent hover:border-neutral-700"
            >
              {/* Icon Cover */}
              <div className="w-14 h-14 bg-neutral-700 rounded mr-4 relative flex-shrink-0 flex items-center justify-center shadow-md">
                <div className="group-hover:hidden">
                  {getMediaIcon(item.type, item.item.mediaType)}
                </div>
                <div className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center rounded">
                  <Play fill="white" size={24} className="text-white" />
                </div>
              </div>

              {/* Thông tin */}
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-base font-bold text-white truncate">
                  {item.item.title || item.item.name || "Không rõ tiêu đề"}
                </h3>
                <p className="text-sm text-neutral-400 mt-0.5">
                  <span className="capitalize">
                    {item.type === "Media"
                      ? item.item.mediaType || "Audio"
                      : "Playlist"}
                  </span>
                  <span className="mx-2">•</span>
                  {activeTab === "inbox"
                    ? `Từ: ${item.senderName}`
                    : `Đến: ${item.senderName}`}
                </p>
              </div>

              {/* Thời gian */}
              <div className="hidden md:flex items-center text-sm text-neutral-500 whitespace-nowrap">
                <Clock size={14} className="mr-1.5" />
                {new Date(item.sharedAt).toLocaleDateString("vi-VN")}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 text-neutral-500 flex flex-col items-center">
            {activeTab === "inbox" ? (
              <Inbox size={48} className="mb-4 opacity-20" />
            ) : (
              <Send size={48} className="mb-4 opacity-20" />
            )}
            <p className="text-lg">Không có mục nào ở đây.</p>
          </div>
        )}
      </div>
    </div>
  );
}