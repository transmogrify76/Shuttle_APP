import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// List routes (optional auth)
export const listRoutes = async (activeOnly = true) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/routes?active_only=${activeOnly}`;
  const response = await fetch(url, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch routes');
  return data; // { items, count }
};

// Get single route details
export const getRouteDetails = async (routeId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/routes/${routeId}`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch route details');
  return data;
};

// List scheduled trips (optional auth)
export const listScheduledTrips = async (routeId = null, onlyFuture = true) => {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/passenger/scheduled-trips?only_future=${onlyFuture}`;
  if (routeId) url += `&route_id=${routeId}`;
  const response = await fetch(url, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch trips');
  return data; // { items, count }
};

// Get single scheduled trip
export const getScheduledTrip = async (tripId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/scheduled-trips/${tripId}`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch trip details');
  return data;
};

