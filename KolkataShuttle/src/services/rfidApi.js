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

// GET /passenger/rfid/me – card & account status
export const getRfidMe = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/rfid/me`, { headers });
  return handleResponse(response, '/passenger/rfid/me');
};

// GET /passenger/rfid/summary – home screen payload
export const getRfidSummary = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/rfid/summary`, { headers });
  return handleResponse(response, '/passenger/rfid/summary');
};

// GET /passenger/rfid/ledger – ledger entries (with pagination)
export const getRfidLedger = async (page = 1, pageSize = 25, entryType = null) => {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/passenger/rfid/ledger?page=${page}&page_size=${pageSize}`;
  if (entryType) url += `&entry_type=${entryType}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, '/passenger/rfid/ledger');
};

// GET /passenger/rfid/recharges – recharge history
export const getRfidRecharges = async (page = 1, pageSize = 25, status = null) => {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/passenger/rfid/recharges?page=${page}&page_size=${pageSize}`;
  if (status) url += `&status=${status}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, '/passenger/rfid/recharges');
};

// POST /passenger/rfid/recharges/create-order – create recharge order
export const createRfidRechargeOrder = async (amount) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/rfid/recharges/create-order`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ amount }),
  });
  return handleResponse(response, '/passenger/rfid/recharges/create-order');
};

// POST /passenger/rfid/recharges/{rechargeId}/verify-payment – verify after Razorpay
export const verifyRfidRechargePayment = async (rechargeId, razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/rfid/recharges/${rechargeId}/verify-payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature }),
  });
  return handleResponse(response, `/passenger/rfid/recharges/${rechargeId}/verify-payment`);
};

// GET /passenger/rfid/rides – RFID ride history
export const getRfidRides = async (page = 1, pageSize = 25, status = null) => {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/passenger/rfid/rides?page=${page}&page_size=${pageSize}`;
  if (status) url += `&status=${status}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, '/passenger/rfid/rides');
};

// GET /passenger/rfid/rides/{rideId} – RFID ride detail
export const getRfidRideDetail = async (rideId) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/passenger/rfid/rides/${rideId}`, { headers });
  return handleResponse(response, `/passenger/rfid/rides/${rideId}`);
};

// GET /passenger/rfid/route-trip-options – RFID‑aware trip discovery (optional)
export const getRfidRouteTripOptions = async (fromStopId, toStopId, fromTime = null, toTime = null) => {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/passenger/rfid/route-trip-options?from_stop_id=${fromStopId}&to_stop_id=${toStopId}`;
  if (fromTime) url += `&from_time=${encodeURIComponent(fromTime)}`;
  if (toTime) url += `&to_time=${encodeURIComponent(toTime)}`;
  const response = await fetch(url, { headers });
  return handleResponse(response, '/passenger/rfid/route-trip-options');
};