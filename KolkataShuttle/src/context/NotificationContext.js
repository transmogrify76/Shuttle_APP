import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
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
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const reconnectAttempts = useRef(0);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!token) return;
    try {
      const { unread_count } = await getUnreadCount();
      setUnreadCount(unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Fetch notifications list
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

  // Mark single as read
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

  // Refresh list (pull to refresh)
  const refreshNotifications = () => fetchNotifications();

  // WebSocket connection
  const connectWebSocket = () => {
    if (!token) {
      console.log('No token, skipping WebSocket connection');
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already open');
      return;
    }

    const wsUrl = `${API_BASE_URL.replace('https', 'wss')}/notifications/ws?token=${encodeURIComponent(token)}`;
    console.log('Connecting WebSocket to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Notification WebSocket connected');
      setWsConnected(true);
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        // Handle ping
        if (data?.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        // Authentication success
        if (data?.message === 'WebSocket authenticated successfully.') {
          console.log('WebSocket authenticated');
          return;
        }

        // This is a live notification
        if (data?.id && data?.title) {
          // Add to local state (prepend)
          setNotifications(prev => [data, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Emit refresh event for other screens if needed
          if (data.data?.refresh && Array.isArray(data.data.refresh)) {
            console.log('Emitting refreshData with keys:', data.data.refresh);
            eventEmitter.emit('refreshData', { keys: data.data.refresh });
          }
        }
      } catch (err) {
        console.error('WebSocket message parse error:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsConnected(false);
    };

    ws.onclose = (event) => {
      console.log(`WebSocket closed with code ${event.code}, reason: ${event.reason}`);
      setWsConnected(false);
      scheduleReconnect();
    };
  };

  const scheduleReconnect = () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    const delay = Math.min(5000 * Math.pow(1.5, reconnectAttempts.current), 30000);
    console.log(`Scheduling reconnect in ${delay}ms`);
    reconnectTimerRef.current = setTimeout(() => {
      reconnectAttempts.current += 1;
      connectWebSocket();
    }, delay);
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
    setWsConnected(false);
  };

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground – reconnect and refresh data
        console.log('App came to foreground, reconnecting WebSocket');
        disconnectWebSocket();
        connectWebSocket();
        fetchUnreadCount();
        fetchNotifications();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, []);

  // Initial load and token changes
  useEffect(() => {
    if (token && user) {
      console.log('Token available, initializing notifications');
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
        wsConnected,
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