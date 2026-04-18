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
  console.log(`[API] Raw response (first 300 chars):`, text.substring(0, 300));
  try {
    const data = JSON.parse(text);
    if (!response.ok) {
      throw new Error(data.detail?.message || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (e) {
    console.error(`[API] JSON parse error for ${url}. Full response:`, text);
    throw new Error(`Server returned invalid JSON (status ${response.status}). Response starts with: "${text.substring(0, 50)}".`);
  }
};

// Fare preview
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

// Create booking
export const createBooking = async ({ scheduled_trip_id, pickup_stop_id, dropoff_stop_id }) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ scheduled_trip_id, pickup_stop_id, dropoff_stop_id }),
  });
  return handleResponse(response, url);
};

// Verify payment
export const verifyBookingPayment = async (bookingId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}/verify-payment`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
  });
  return handleResponse(response, url);
};

// Upcoming bookings
export const getUpcomingBookings = async () => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/upcoming`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

// Current bookings (ongoing)
export const getCurrentBookings = async () => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/current`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

// Passenger history
export const getPassengerHistory = async () => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/history`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

// Booking detail
export const getBookingDetail = async (bookingId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

// Cancel booking
export const cancelBooking = async (bookingId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}/cancel`;
  const response = await fetch(url, { method: 'POST', headers });
  return handleResponse(response, url);
};

// Booking QR
export const getBookingQR = async (bookingId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}/qr`;
  const response = await fetch(url, { headers });
  return handleResponse(response, url);
};

// Create rating
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

// Get booking rating (returns null if not found)
export const getBookingRating = async (bookingId) => {
  const headers = await getAuthHeaders();
  const url = `${API_BASE_URL}/passenger/bookings/${bookingId}/rating`;
  const response = await fetch(url, { headers });
  if (response.status === 404) {
    return null;
  }
  return handleResponse(response, url);
};

// Leg available seats
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

// Driver + vehicle info
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

// Booking current status (live progress)
export const getBookingCurrentStatus = async (bookingId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/bookings/${bookingId}/current-status`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch current status');
  return data;
};