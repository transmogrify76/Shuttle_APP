import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

const getAuthHeaders = async (contentType = 'application/json') => {
  const token = await AsyncStorage.getItem('access_token');
  const headers = { 'Content-Type': contentType };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (response, url) => {
  const text = await response.text();
  console.log(`[API] ${url} - Status: ${response.status}`);
  try {
    const data = JSON.parse(text);
    if (!response.ok) {
      throw new Error(data.detail?.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (e) {
    console.error(`[API] JSON parse error for ${url}. Response:`, text);
    throw new Error(`Server returned invalid JSON (status ${response.status})`);
  }
};

// ========== TRAVELLER PROFILES ==========
export const getTravellerProfiles = async (activeOnly = true) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/traveller-profiles?active_only=${activeOnly}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const createTravellerProfile = async (data) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/traveller-profiles`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(response, url);
};

export const updateTravellerProfile = async (profileId, data) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/traveller-profiles/${profileId}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(response, url);
};

export const deleteTravellerProfile = async (profileId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/traveller-profiles/${profileId}`;
  const response = await fetch(url, { method: 'DELETE', headers });
  return handleResponse(response, url);
};

// ========== BOOKING SESSIONS ==========
export const createBookingSession = async (data) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/booking-sessions`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(response, url);
};

export const verifyBookingSessionPayment = async (sessionId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/booking-sessions/${sessionId}/verify-payment`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
  });
  return handleResponse(response, url);
};

export const getBookingSessions = async (status) => {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/passenger/booking-sessions`;
  if (status) url += `?status=${status}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const getBookingSessionDetail = async (sessionId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/booking-sessions/${sessionId}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const cancelBookingSession = async (sessionId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/booking-sessions/${sessionId}/cancel`;
  const response = await fetch(url, { method: 'POST', headers });
  return handleResponse(response, url);
};

export const cancelBookingSessionSeat = async (sessionId, bookingId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/booking-sessions/${sessionId}/bookings/${bookingId}/cancel`;
  const response = await fetch(url, { method: 'POST', headers });
  return handleResponse(response, url);
};

// ========== OTHER REUSED APIs (unchanged) ==========
export const previewFare = async ({ route_id, pickup_stop_id, dropoff_stop_id }) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/fare/preview`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ route_id, pickup_stop_id, dropoff_stop_id }),
  });
  return handleResponse(response, url);
};

export const getLegAvailableSeats = async (tripId, routeId, pickupStopId, dropoffStopId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/scheduled-trips/${tripId}/available-seats`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      route_id: routeId,
      pickup_stop_id: pickupStopId,
      dropoff_stop_id: dropoffStopId,
    }),
  });
  return handleResponse(response, url);
};

export const getDriverVehicleInfo = async (tripId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/scheduled-trips/${tripId}/driver-vehicle-info`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch driver info');
  if (data.driver_average_rating !== undefined && data.driver_average_rating !== null) {
    data.driver_average_rating = parseFloat(data.driver_average_rating);
  }
  return data;
};

// Keep old individual booking endpoints only for QR and rating (they still work with bookingId)
export const getBookingQR = async (bookingId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}/qr`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const createRating = async (bookingId, { trip_rating, driver_rating, review_text }) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}/rating`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ trip_rating, driver_rating, review_text }),
  });
  return handleResponse(response, url);
};

export const getBookingRating = async (bookingId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}/rating`;
  const response = await fetch(url, { headers });
  if (response.status === 404) return null;
  return handleResponse(response, url);
};

export const getScheduledTripDetail = async (tripId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/scheduled-trips/${tripId}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};