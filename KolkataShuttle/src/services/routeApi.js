import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { handleApiResponse } from '../utils/apiError';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('access_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = handleApiResponse;

// export const listRoutes = async (activeOnly = true) => {
//   const headers = await getAuthHeaders();
//   const url = `${API_BASE_URL}/passenger/routes?active_only=${activeOnly}`;
//   const response = await fetch(url, { headers });
//   return handleResponse(response, url);
// };

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

export const listRoutes = async (activeOnly = true, hasAc = null) => {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/passenger/routes?active_only=${activeOnly}`;
  if (hasAc !== null) url += `&has_ac=${hasAc}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};