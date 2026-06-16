import {create} from 'zustand';
import * as signalR from '@microsoft/signalr';

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
    fetchNotifications: (userId: string) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
    connectSignalR: (userId: string) => void ;
}

const API_BASE_URL = 'http://localhost:5000/api';

export const useNotificationStore = create<NotificationStore>((set,get) => ({
    notifications: [],
    unreadCount: 0,
    connection: null,

    fetchNotifications: async (userId: string) => {
        try{
            const res = await fetch (`${API_BASE_URL}/notifications?userId=${userId}`);
            const data: NotificationItem[] = await res.json();
            set ({
                notifications: data,
                unreadCount: data.filter(n => !n.isRead).length
            });
        } catch (error){
            console.error("Lỗi lấy thông báo:", error);
        }
    },

    markAsRead: async (id: string) => {
        try{
            await fetch(`${API_BASE_URL}/notifications/${id}/read`,{method:'PATCH'});
            const currentNotifications = get().notifications.map( n =>
                n.id === id ? {...n, isRead: true} : n
            );
            set({
                notifications: currentNotifications,
                unreadCount: currentNotifications.filter(n => !n.isRead).length
            });
        }catch(error){
            console.error("Lỗi đánh dấu đã đọc:", error);
        }
    },

    markAllAsRead: async (userId: string) => {
        try{
            await fetch(`${API_BASE_URL}/notifications/read-all?userId=${userId}`,{method: 'PATCH'});
            const currenctNotifications = get().notifications.map(n => ({...n, isRead: true}));
            set({notifications: currenctNotifications, unreadCount: 0});
        } catch (error){
            console.error("Lỗi đánh dấu đã đọc:", error);
        }
    },

    connectSignalR: (userId: string) => {
        if (get().connection) return;

        const newCon = new signalR.HubConnectionBuilder()
            .withUrl("http://localhost:5000/hubs/notifications")
            .withAutomaticReconnect()
            .build();

        newCon.start().then(() => {
            newCon.invoke("JoinUserGroup",userId).catch(console.error);
        });

        newCon.on("NotificationReceived",(notification: NotificationItem) => {
            const {notifications} = get();
            const updated = [notification, ...notifications];
            set({
                notifications: updated,
                unreadCount: updated.filter(n => !n.isRead).length
            });
    });

        set({connection: newCon});
    }
}));