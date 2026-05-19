import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import RazorpayWebView from '../components/RazorpayWebView';
import { useAuth } from '../context/AuthContext';
import { useSeatmap } from '../context/SeatmapContext';
import { createBooking, verifyBookingPayment, getLegAvailableSeats, getDriverVehicleInfo } from '../services/bookingApi';

export default function SeatSelectionScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    scheduledTrip,
    pickupStopId,
    dropoffStopId,
    fareAmount,
    routeName,
  } = route.params;

  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [currentPaymentOrder, setCurrentPaymentOrder] = useState(null);
  const [seatCapacity, setSeatCapacity] = useState(0);
  const [availableSeatsList, setAvailableSeatsList] = useState([]);
  const [occupiedSeatsList, setOccupiedSeatsList] = useState([]);
  const [tripBookable, setTripBookable] = useState(false);

  const { seatmapData, subscribe, refresh, unsubscribe } = useSeatmap();

  // Fetch initial seat data via REST (fallback) and subscribe to WebSocket
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setInfoLoading(true);
        const [legInfo, driver] = await Promise.all([
          getLegAvailableSeats(scheduledTrip.id, scheduledTrip.route_id, pickupStopId, dropoffStopId),
          getDriverVehicleInfo(scheduledTrip.id),
        ]);
        setDriverInfo(driver);
        setSeatCapacity(legInfo.seat_capacity);
        setAvailableSeatsList(legInfo.available_seat_numbers || []);
        setOccupiedSeatsList(legInfo.occupied_seat_numbers || []);
        setTripBookable(legInfo.trip_bookable);
      } catch (err) {
        setError(err.message);
      } finally {
        setInfoLoading(false);
      }
    };
    fetchInitial();

    // Subscribe to WebSocket for live updates
    const topic = {
      scheduled_trip_id: scheduledTrip.id,
      route_id: scheduledTrip.route_id,
      pickup_stop_id: pickupStopId,
      dropoff_stop_id: dropoffStopId,
    };
    subscribe(topic);

    return () => {
      unsubscribe();
    };
  }, []);

  // Update from WebSocket snapshot
  useEffect(() => {
    if (seatmapData) {
      setSeatCapacity(seatmapData.seat_capacity);
      setAvailableSeatsList(seatmapData.available_seat_numbers || []);
      setOccupiedSeatsList(seatmapData.occupied_seat_numbers || []);
      setTripBookable(seatmapData.trip_bookable);
      // If selected seat is no longer available, clear selection
      if (selectedSeat && !seatmapData.available_seat_numbers.includes(selectedSeat)) {
        setSelectedSeat(null);
        Alert.alert('Seat no longer available', 'Please select another seat');
      }
    }
  }, [seatmapData]);

  const handleSeatPress = (seatNumber) => {
    if (occupiedSeatsList.includes(seatNumber)) return;
    setSelectedSeat(seatNumber);
  };

  const handleConfirm = async () => {
    if (!selectedSeat) {
      Alert.alert('No seat selected', 'Please select a seat');
      return;
    }
    if (!tripBookable) {
      Alert.alert('Trip not bookable', 'This trip is not available for booking right now');
      return;
    }

    setLoading(true);
    try {
      const { booking, payment_order } = await createBooking({
        scheduled_trip_id: scheduledTrip.id,
        pickup_stop_id: pickupStopId,
        dropoff_stop_id: dropoffStopId,
        seat_number: selectedSeat,
      });
      setCurrentBooking(booking);
      setCurrentPaymentOrder(payment_order);
      setPaymentModalVisible(true);
    } catch (error) {
      if (error.message?.includes('duplicate_booking')) {
        Alert.alert('Already Booked', 'You already have a booking for this trip.');
        navigation.goBack();
      } else if (error.message?.includes('seat_unavailable')) {
        Alert.alert('Seat taken', 'That seat is no longer available. Please choose another.');
        refresh(); // manually refresh seatmap
        setSelectedSeat(null);
      } else {
        Alert.alert('Error', error.message || 'Booking failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      await verifyBookingPayment(currentBooking.id, {
        razorpay_order_id: currentPaymentOrder.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });
      Alert.alert('Success', `Booking confirmed for seat ${selectedSeat}`);
      setPaymentModalVisible(false);
      navigation.navigate('BookingConfirmation', {
        route: { name: routeName, time: scheduledTrip.planned_start_at },
        busType: 'AC',
        seats: [selectedSeat.toString()],
        fare: fareAmount,
        otp: currentBooking.otp,
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Payment verification failed');
      setPaymentModalVisible(false);
    }
  };

  const handlePaymentError = (errorMsg) => {
    Alert.alert('Payment Error', errorMsg || 'Payment failed');
    setPaymentModalVisible(false);
  };

  const paymentOrderData = currentPaymentOrder ? {
    key: currentPaymentOrder.razorpay_key_id,
    amount: currentPaymentOrder.amount_subunits,
    currency: currentPaymentOrder.currency,
    order_id: currentPaymentOrder.razorpay_order_id,
    name: 'Kolkata Shuttle',
    description: `Kolkata Shuttle – ${routeName || 'Bus'} seat ${selectedSeat}`,
    prefill: { email: user?.email, contact: user?.phone || '', name: user?.full_name || '' },
  } : null;

  if (infoLoading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-black justify-center items-center p-5">
        <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
        <Text className="text-white text-center mt-4">{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-6 bg-white px-6 py-2 rounded-full">
          <Text className="text-black font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render seat grid (example: 4 columns, rows = seatCapacity/4 rounded up)
  const cols = 4;
  const rows = Math.ceil(seatCapacity / cols);
  const seats = [];
  for (let i = 1; i <= seatCapacity; i++) {
    seats.push(i);
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Select Seats" />
      <ScrollView>
        <View className="p-5 border-b border-gray-800">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-xl font-bold">{routeName}</Text>
            {scheduledTrip.route?.has_ac && (
              <View className="px-2 py-1 rounded-full bg-gray-800">
                <Text className="text-white text-xs font-bold">AC</Text>
              </View>
            )}
          </View>
          <Text className="text-gray-400 text-sm mt-1">{new Date(scheduledTrip.planned_start_at).toLocaleString()}</Text>
        </View>

        {driverInfo && (
          <View className="mx-5 mt-4 bg-gray-900 rounded-2xl p-4 border border-gray-800">
            <Text className="text-white font-bold mb-2">Driver & Vehicle</Text>
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-circle-outline" size={20} color="#aaa" />
              <Text className="text-gray-300 ml-2">Driver: {driverInfo.driver_name || 'N/A'}</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text className="text-gray-300 ml-1">
                {driverInfo.driver_average_rating ? `${driverInfo.driver_average_rating.toFixed(1)} (${driverInfo.driver_rating_count} ratings)` : 'New driver'}
              </Text>
            </View>
            <View className="flex-row items-center mb-1">
              <Ionicons name="car-outline" size={20} color="#aaa" />
              <Text className="text-gray-300 ml-2">{driverInfo.vehicle_name || 'Bus'} • {driverInfo.vehicle_registration_number || ''}</Text>
            </View>
            <Text className="text-gray-400 text-xs ml-7">Total seats: {seatCapacity}</Text>
          </View>
        )}

        <View className="mx-5 mt-6">
          <Text className="text-white text-lg font-semibold mb-3">Select a seat</Text>
          {[...Array(rows)].map((_, rowIdx) => (
            <View key={rowIdx} className="flex-row justify-between mb-2">
              {seats.slice(rowIdx * cols, (rowIdx + 1) * cols).map(seatNum => {
                const isOccupied = occupiedSeatsList.includes(seatNum);
                const isAvailable = availableSeatsList.includes(seatNum);
                const isSelected = selectedSeat === seatNum;
                let seatStyle = 'bg-gray-800 border-gray-700';
                if (isOccupied) seatStyle = 'bg-red-900 border-red-800';
                else if (isSelected) seatStyle = 'bg-white border-white';
                else if (isAvailable) seatStyle = 'bg-green-900 border-green-800';
                return (
                  <TouchableOpacity
                    key={seatNum}
                    onPress={() => handleSeatPress(seatNum)}
                    disabled={isOccupied}
                    className={`w-16 h-16 rounded-xl border-2 items-center justify-center ${seatStyle}`}
                  >
                    <Text className={`text-lg font-bold ${isSelected ? 'text-black' : (isOccupied ? 'text-red-300' : 'text-white')}`}>
                      {seatNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {/* fill empty columns */}
              {Array.from({ length: cols - (seats.slice(rowIdx * cols, (rowIdx + 1) * cols).length) }).map((_, i) => (
                <View key={`empty-${i}`} className="w-16 h-16" />
              ))}
            </View>
          ))}
        </View>

        <View className="bg-gray-900 mx-5 my-3 p-5 rounded-2xl">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Selected seat</Text>
            <Text className="text-white font-medium">{selectedSeat || 'None'}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Per seat fare</Text>
            <Text className="text-white font-medium">₹{fareAmount}</Text>
          </View>
          <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-800">
            <Text className="text-white font-bold text-lg">Total</Text>
            <Text className="text-green-500 font-bold text-lg">₹{fareAmount}</Text>
          </View>
        </View>

        <CustomButton
          title={loading ? 'Processing...' : `Confirm & Pay ₹${fareAmount}`}
          onPress={handleConfirm}
          disabled={loading || !selectedSeat || !tripBookable}
          className="mx-5 mb-6"
          buttonColor="#fff"
          textColor="#000"
        />
      </ScrollView>
      {paymentOrderData && (
        <RazorpayWebView
          visible={paymentModalVisible}
          onClose={() => setPaymentModalVisible(false)}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
          orderData={paymentOrderData}
        />
      )}
    </View>
  );
}