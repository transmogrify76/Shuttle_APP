import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

// List notifications
export const getNotifications = async (limit = 50, offset = 0, unreadOnly = false) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/notifications?limit=${limit}&offset=${offset}&unread_only=${unreadOnly}`;
  const response = await fetch(url, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch notifications');
  return data; // { items, count }
};

// Get unread count
export const getUnreadCount = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch unread count');
  return data; // { unread_count }
};

// Mark one notification as read
export const markNotificationRead = async (notificationId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'POST',
    headers,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to mark as read');
  return data;
};

// Mark all notifications as read
export const markAllNotificationsRead = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'POST',
    headers,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to mark all as read');
  return data;
};  