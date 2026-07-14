import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';
import { handleApiResponse } from '../utils/apiError';

const getAuthHeaders = async (contentType = 'application/json') => {
  const token = await AsyncStorage.getItem('access_token');
  const headers = { 'Content-Type': contentType };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const handleResponse = handleApiResponse;

// ========== PASSENGER PROFILE (Self) ==========
export const getPassengerProfile = async () => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/profile`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const createPassengerProfile = async (data) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/profile`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(response, url);
};

export const updatePassengerProfile = async (data) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/profile`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(response, url);
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

// ========== BOOKING SESSIONS (New Canonical APIs) ==========
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

// Safe resume/retry for a dismissed, timed-out, or failed checkout. Reconciles
// with Razorpay server-side first; never creates a second order and never
// extends the hold. See PASSENGER_FE_LATER_COMMITS_INTEGRATION.md §6.3.
export const retryBookingSessionPayment = async (sessionId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/booking-sessions/${sessionId}/retry-payment`;
  const response = await fetch(url, { method: 'POST', headers });
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

// ========== CURRENT TRIP APIs (Booking Session Based) ==========
export const getCurrentBookingSessions = async () => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/booking-sessions/current`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const getBookingSessionCurrentStatus = async (sessionId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/booking-sessions/${sessionId}/current-status`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const getBookingSessionLiveLocation = async (sessionId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/booking-sessions/${sessionId}/live-location`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

// ========== LEGACY / OLD APIs (keep for QR, rating, invoice – still needed) ==========
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

export const getInvoice = async (bookingId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}/invoice`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

// GET /passenger/transactions?status=&month=&year=&limit=&offset=
// month requires year (backend returns 400 year_required_for_month_filter
// otherwise) — enforced client-side too so we never send an invalid combo.
export const getTransactions = async ({ status, month, year, limit, offset } = {}) => {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (status && status !== 'all') params.set('status', status);
  if (month && year) {
    params.set('month', month);
    params.set('year', year);
  } else if (year) {
    params.set('year', year);
  }
  if (limit != null) params.set('limit', limit);
  if (offset != null) params.set('offset', offset);
  const qs = params.toString();
  const url = `${API_BASE_URL}/passenger/transactions${qs ? `?${qs}` : ''}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

// ========== TRIP DISCOVERY APIs (from Trip doc) ==========
export const listRoutes = async (activeOnly = true, hasAc = null) => {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/passenger/routes?active_only=${activeOnly}`;
  if (hasAc !== null) url += `&has_ac=${hasAc}`;
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

export const getScheduledTripDetail = async (tripId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/scheduled-trips/${tripId}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const getDriverVehicleInfo = async (tripId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/scheduled-trips/${tripId}/driver-vehicle-info`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

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

export const getLegAvailableSeats = async (tripId, routeId, pickupStopId, dropoffStopId, seatNumber = null) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/scheduled-trips/${tripId}/available-seats`;
  const body = {
    route_id: routeId,
    pickup_stop_id: pickupStopId,
    dropoff_stop_id: dropoffStopId,
  };
  if (seatNumber !== null) body.seat_number = seatNumber;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return handleResponse(response, url);
};

// Legacy individual booking endpoints (kept for compatibility, but not used in new flows)
export const getUpcomingBookings = async () => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/upcoming`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const getCurrentBookings = async () => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/current`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const getPassengerHistory = async () => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/history`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const getBookingDetail = async (bookingId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

export const cancelBooking = async (bookingId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}/cancel`;
  const response = await fetch(url, { method: 'POST', headers });
  return handleResponse(response, url);
};

export const getBookingCurrentStatus = async (bookingId) => {   
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}/current-status`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};