import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const getAuthHeaders = async (isMultipart = false) => {
  const token = await AsyncStorage.getItem('access_token');
  const headers = isMultipart ? {} : { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// List all tickets
export const listSupportTickets = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/support`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to load tickets');
  return data;
};

// Get a single ticket
export const getSupportTicket = async (ticketId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/support/${ticketId}`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to load ticket');
  return data;
};

// Create a new ticket (multipart/form-data)
export const createSupportTicket = async (subject, description, fileUri = null) => {
  const headers = await getAuthHeaders(true);
  const formData = new FormData();
  formData.append('subject', subject);
  formData.append('description', description);
  if (fileUri) {
    formData.append('file', {
      uri: fileUri,
      name: 'attachment.jpg',
      type: 'image/jpeg',
    });
  }
  const response = await fetch(`${API_BASE_URL}/passenger/support`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to create ticket');
  return data;
};