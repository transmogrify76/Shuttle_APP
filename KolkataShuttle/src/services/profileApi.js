import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const getHeaders = async (withToken = true, isMultipart = false) => {
  const headers = isMultipart ? {} : { 'Content-Type': 'application/json' };
  if (withToken) {
    const token = await AsyncStorage.getItem('access_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Create passenger profile (only needed if doesn't exist)
export const createProfile = async (fullName) => {
  const headers = await getHeaders(true);
  const response = await fetch(`${API_BASE_URL}/passenger/profile`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ full_name: fullName, profile_picture_path: null }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail?.message || 'Failed to create profile');
  }
  return data;
};

// Get passenger profile
export const fetchProfile = async () => {
  const headers = await getHeaders(true);
  const response = await fetch(`${API_BASE_URL}/passenger/profile`, {
    method: 'GET',
    headers,
  });
  const data = await response.json();
  if (!response.ok) {
    // If 404 or other error, we'll handle it in the screen
    throw new Error(data.detail?.message || 'Failed to fetch profile');
  }
  return data;
};

// Update profile (full name)
export const updateProfile = async (fullName) => {
  const headers = await getHeaders(true);
  const response = await fetch(`${API_BASE_URL}/passenger/profile`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ full_name: fullName }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail?.message || 'Failed to update profile');
  }
  return data;
};

// Upload profile picture
export const uploadProfilePicture = async (imageUri) => {
  const token = await AsyncStorage.getItem('access_token');
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'profile_picture.jpg',
    type: 'image/jpeg',
  });

  const response = await fetch(`${API_BASE_URL}/passenger/profile/picture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail?.message || 'Failed to upload picture');
  }
  return data;
};