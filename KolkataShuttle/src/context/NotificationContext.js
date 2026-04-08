import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { getUnreadCount, getNotifications, markNotificationRead, markAllNotificationsRead } from '../services/notificationApi';
import { API_BASE_URL } from '../config/api';
import { eventEmitter } from '../utils/eventEmitter';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const appState = useRef(AppState.currentState);

  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const { unread_count } = await getUnreadCount();
      setUnreadCount(unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async (limit = 50, offset = 0, unreadOnly = false) => {
    if (!token) return [];
    try {
      setLoading(true);
      const data = await getNotifications(limit, offset, unreadOnly);
      setNotifications(data.items);
      return data.items;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const refreshNotifications = () => fetchNotifications();

  const connectWebSocket = () => {
    if (!token) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = `${API_BASE_URL.replace('https', 'wss')}/notifications/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Notification WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        if (data?.message === 'WebSocket authenticated successfully.') {
          return;
        }
        if (data?.id && data?.title) {
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);
          if (data.data?.refresh && Array.isArray(data.data.refresh)) {
            eventEmitter.emit('refreshData', { keys: data.data.refresh });
          }
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = setTimeout(() => {
      connectWebSocket();
    }, 5000);
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        disconnectWebSocket();
        connectWebSocket();
        fetchUnreadCount();
        fetchNotifications();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (token && user) {
      fetchUnreadCount();
      fetchNotifications();
      connectWebSocket();
    } else {
      disconnectWebSocket();
      setUnreadCount(0);
      setNotifications([]);
    }
    return () => disconnectWebSocket();
  }, [token, user]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        loading,
        fetchNotifications,
        refreshNotifications,
        markAsRead,
        markAllRead: async () => {
          try {
            await markAllNotificationsRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
          } catch (error) {
            console.error('Failed to mark all read:', error);
          }
        },
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};