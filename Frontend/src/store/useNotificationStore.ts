import { create } from 'zustand';
import * as signalR from '@microsoft/signalr';
import axiosClient from '../services/api/axiosClient';

export interface NotificationItem {
    id: string|number;
    userId: string|number;
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
    connectSignalR: (userId: string) => void ;
}

export const useNotificationStore = create<NotificationStore>((set,get) => ({
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
        try{
            await axiosClient.patch(`/notifications/${id}/read`);
            const currentNotifications = get().notifications.map(n =>
                String(n.id) === String(id) ? { ...n, isRead: true } : n
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
        try{
            await axiosClient.patch(`/notifications/read-all`);
            const currenctNotifications = get().notifications.map(n => ({...n, isRead: true}));
            set({notifications: currenctNotifications, unreadCount: 0});
        } catch (error){
            console.error("Lỗi đánh dấu đã đọc:", error);
        }
    },

    connectSignalR: () => {
        if (get().connection) return;

        const token = localStorage.getItem('tunevault_token');
        if (!token) return; // Không có token thì cấm kết nối

        const newCon = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5000/hubs/notifications",{
                accessTokenFactory: () => localStorage.getItem('tunevault_token') || ""
            })
            .withAutomaticReconnect()
            .build();

        newCon.start().then(() => {
            newCon.invoke("JoinUserGroup",String(userId)).catch(console.error);
        }).catch(err => console.error("SignalR Connection Error: ", err));

        newCon.on("NotificationReceived",(notification: NotificationItem) => {
            const {notifications} = get();
            const isExist = notifications.some(n => String(n.id) === String(notification.id));
            if (isExist) return;
            const updated = [notification, ...notifications];
            set({
                notifications: updated,
                unreadCount: updated.filter(n => !n.isRead).length
            });
        });

        set({ connection: newCon });
    }
}));