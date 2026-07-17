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

// GET /passenger/stops?active_only=true — unauthenticated, no auth dependency,
// but we still send the token header (harmless) for consistency with other calls.
export const listStops = async (activeOnly = true) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/stops?active_only=${activeOnly}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

// GET /passenger/route-trip-options?from_stop_id=&to_stop_id=&from_time=&to_time=
// Stop-to-stop trip discovery: returns route options with embedded
// upcoming_scheduled_trips (fare, GST breakdown, and live seat availability
// all included — no separate fare-preview or seat-availability call needed).
export const getRouteTripOptions = async ({ from_stop_id, to_stop_id, from_time, to_time }) => {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams({ from_stop_id, to_stop_id });
  if (from_time) params.set('from_time', from_time);
  if (to_time) params.set('to_time', to_time);
  const url = `${API_BASE_URL}/passenger/route-trip-options?${params}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

// GET /passenger/stops/search?query=&lat=&lng=&radius_km=&limit=&active_only=
// Fuzzy name search and/or nearby search. At least query or the lat/lng pair
// is required — callers must guard against sending neither.
export const searchStops = async ({ query, lat, lng, radiusKm, limit, activeOnly = true } = {}) => {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (lat != null && lng != null) {
    params.set('lat', lat);
    params.set('lng', lng);
  }
  if (radiusKm != null) params.set('radius_km', radiusKm);
  if (limit != null) params.set('limit', limit);
  params.set('active_only', activeOnly);
  const url = `${API_BASE_URL}/passenger/stops/search?${params}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};