import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';


const getAuthHeaders = async (contentType = 'application/json') => ({
  'Content-Type': contentType,
  Authorization: `Bearer ${await AsyncStorage.getItem('access_token')}`,
});

// Fare preview
export const previewFare = async ({ route_id, pickup_stop_id, dropoff_stop_id }) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/fare/preview`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ route_id, pickup_stop_id, dropoff_stop_id }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Fare preview failed');
  return data;
};

// Create booking (returns payment order)
export const createBooking = async ({ scheduled_trip_id, pickup_stop_id, dropoff_stop_id }) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/bookings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ scheduled_trip_id, pickup_stop_id, dropoff_stop_id }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Booking creation failed');
  return data; // contains booking and payment_order
};

// Verify payment
export const verifyBookingPayment = async (bookingId, { razorpay_order_id, razorpay_payment_id, razorpay_signature }) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/bookings/${bookingId}/verify-payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Payment verification failed');
  return data;
};

// List passenger bookings (optional status filter)
export const listBookings = async (status = null) => {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/passenger/bookings`;
  if (status) url += `?status=${status}`;
  const response = await fetch(url, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch bookings');
  return data; // { items, count }
};

// Upcoming bookings
// export const getUpcomingBookings = async () => {
//   const headers = await getAuthHeaders();
//   const response = await fetch(`${API_BASE_URL}/passenger/bookings/upcoming`, { headers });
//   const data = await response.json();
//   if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch upcoming bookings');
//   return data;
// };

// Current bookings (boarding or started)
export const getCurrentBookings = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/bookings/current`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch current bookings');
  return data;
};

// 12.23 Passenger history
// export const getPassengerHistory = async () => {
//   const headers = await getAuthHeaders();
//   const response = await fetch(`${API_BASE_URL}/passenger/history`, { headers });
//   const data = await response.json();
//   if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch history');
//   return data;
// };

// 12.24 Booking detail
export const getBookingDetail = async (bookingId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/bookings/${bookingId}`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch booking details');
  return data;
};

// 12.25 Cancel booking
export const cancelBooking = async (bookingId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/bookings/${bookingId}/cancel`, {
    method: 'POST',
    headers,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to cancel booking');
  return data;
};

// 12.26 Booking QR
export const getBookingQR = async (bookingId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/bookings/${bookingId}/qr`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch QR');
  return data;
};

// 12.27 Create booking rating
export const createRating = async (bookingId, { trip_rating, driver_rating, review_text }) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/bookings/${bookingId}/rating`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ trip_rating, driver_rating, review_text }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to submit rating');
  return data;
};

// 12.28 Get booking rating
export const getBookingRating = async (bookingId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/bookings/${bookingId}/rating`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch rating');
  return data;
};

export const getUpcomingBookings = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/bookings/upcoming`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch upcoming bookings');
  return data; // { items, count }
};

export const getPassengerHistory = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/history`, { headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.detail?.message || 'Failed to fetch history');
  return data;
};