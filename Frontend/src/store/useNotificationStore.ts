import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';
import axiosClient from '../services/api/axiosClient'; // Import Trạm gác vào đây

export interface NotificationItem {
    id: string;
    userId: string;
    type: string;
    payloadJson: string;
    isRead: boolean;
    createdAt: string;
}

interface NotificationStore {
    notifications: NotificationItem[];
    unreadCount: number;
    connection: signalR.HubConnection | null;
    // Xóa toàn bộ tham số userId đi
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    connectSignalR: () => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    connection: null,

    fetchNotifications: async () => {
        try {
            // Dùng axiosClient thay cho fetch chay
            const res = await axiosClient.get('/social/notifications');
            const data: NotificationItem[] = res.data;
            set({
                notifications: data,
                unreadCount: data.filter(n => !n.isRead).length
            });
        } catch (error) {
            console.error("Lỗi lấy thông báo:", error);
        }
    },

    markAsRead: async (id: string) => {
        try {
            await axiosClient.patch(`/notifications/${id}/read`);
            const currentNotifications = get().notifications.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            );
            set({
                notifications: currentNotifications,
                unreadCount: currentNotifications.filter(n => !n.isRead).length
            });
        } catch (error) {
            console.error("Lỗi đánh dấu đã đọc:", error);
        }
    },

    markAllAsRead: async () => {
        try {
            await axiosClient.patch('/notifications/read-all');
            const currentNotifications = get().notifications.map(n => ({ ...n, isRead: true }));
            set({ notifications: currentNotifications, unreadCount: 0 });
        } catch (error) {
            console.error("Lỗi đánh dấu tất cả đã đọc:", error);
        }
    },

    connectSignalR: () => {
        if (get().connection) return;

        const token = localStorage.getItem('tunevault_token');
        if (!token) return; // Không có token thì cấm kết nối

        const newCon = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5000/hubs/notifications", {
                accessTokenFactory: () => token // Gửi vé Token cho Hub bảo mật
            })
            .withAutomaticReconnect()
            .build();

        newCon.start().catch(console.error);

        newCon.on("NotificationReceived", (notification: NotificationItem) => {
            const { notifications } = get();
            const updated = [notification, ...notifications];
            set({
                notifications: updated,
                unreadCount: updated.filter(n => !n.isRead).length
            });
        });

        set({ connection: newCon });
    }
}));