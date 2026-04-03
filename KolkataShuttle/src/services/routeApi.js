import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (response, url) => {
  const text = await response.text();
  console.log(`[API] ${url} - Status: ${response.status}`);
  console.log(`[API] Raw response (first 300 chars):`, text.substring(0, 300));
  try {
    const data = JSON.parse(text);
    if (!response.ok) {
      throw new Error(data.detail?.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (e) {
    console.error(`[API] JSON parse error for ${url}. Full response:`, text);
    throw new Error(`Server returned invalid JSON (status ${response.status}). Response starts with: "${text.substring(0, 50)}". This may be an HTML error page. Check your backend.`);
  }
};

export const listRoutes = async (activeOnly = true) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/routes?active_only=${activeOnly}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const getRouteDetails = async (routeId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/routes/${routeId}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const listScheduledTrips = async (routeId = null, onlyFuture = true) => {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/passenger/scheduled-trips?only_future=${onlyFuture}`;
  if (routeId) url += `&route_id=${routeId}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};