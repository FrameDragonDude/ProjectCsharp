import React, {useState, useEffect} from 'react';
import {X, Send} from 'lucide-react';
import axiosClient from '../services/api/axiosClient';

interface UserOption{
    id: number;
    fullname: string;
}

interface ShareModalProps {
    isOpen: boolean;
    onClose: () =>void;
    mediaItemId: number | string;
    mediaTitle: string;
}

export default function ShareModal ({isOpen, onClose, mediaItemId, mediaTitle}: ShareModalProps ){
    const [users, setUsers] = useState <UserOption[]>([]);
    const [ targetId, setTargetId] = useState('');
    const [loading, setLoading] =useState(false);

    useEffect(() => {
        if(isOpen) {
            axiosClient.get('/share/users')
            .then(res => setUsers(res.data))
            .catch(err => console.error("Lỗi tải danh sách bạn bè: ", err));
        }
    }, [isOpen]);

    if(!isOpen) return null;
    const handleShareSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        if (!targetId) return alert('Vui lòng chọn người nhận !');
        setLoading(true);

        try{
            await axiosClient.post('/shares', {
                receiverUserId: parseInt(targetId),
                mediaItemId: typeof mediaItemId == 'string' ? parseInt(mediaItemId) : mediaItemId
            });
            alert ('Đã chia sẻ thành công !');
            onClose();
            setTargetId('');
        } catch (error) {
            alert('Lỗi chia sẻ thất bại.');
        } finally {
            setLoading(false);
        }
    };

    return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative text-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
          <X size={20} />
        </button>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-green-500"><Send size={18} /> Chia sẻ âm nhạc</h3>
        <p className="text-sm text-neutral-400 mb-4 truncate">Bài hát: <span className="text-white font-semibold">{mediaTitle}</span></p>
        <form onSubmit={handleShareSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 font-bold mb-2">Chọn người nhận</label>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500">
              <option value="">-- Chọn thành viên nhóm --</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.fullname} (ID: {u.id})</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-green-500 hover:bg-green-600 disabled:bg-neutral-700 text-black font-bold py-3 rounded-xl transition">
            {loading ? 'Đang gửi...' : 'Gửi ngay'}
          </button>
        </form>
      </div>
    </div>
  );
}