import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import RazorpayWebView from '../components/RazorpayWebView';
import { useAuth } from '../context/AuthContext';
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

  const [seatCount, setSeatCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [legInfo, setLegInfo] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [currentPaymentOrder, setCurrentPaymentOrder] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInfoLoading(true);
        const [leg, driver] = await Promise.all([
          getLegAvailableSeats(scheduledTrip.id, scheduledTrip.route_id, pickupStopId, dropoffStopId),
          getDriverVehicleInfo(scheduledTrip.id),
        ]);
        setLegInfo(leg);
        setDriverInfo(driver);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load seat availability');
        Alert.alert('Error', 'Could not fetch seat availability. Please go back and try again.');
      } finally {
        setInfoLoading(false);
      }
    };
    fetchData();
  }, []);

  const availableSeats = legInfo?.available_seats ?? 0;
  const seatCapacity = legInfo?.seat_capacity ?? 0;
  const overlapping = legInfo?.overlapping_active_bookings ?? 0;
  const tripBookable = legInfo?.trip_bookable ?? false;

  const incrementSeats = () => {
    if (seatCount < availableSeats) setSeatCount(seatCount + 1);
  };

  const decrementSeats = () => {
    if (seatCount > 1) setSeatCount(seatCount - 1);
  };

  const totalFare = fareAmount * seatCount;

  const handleConfirm = async () => {
    if (seatCount <= 0) {
      Alert.alert('Invalid', 'Please select at least one seat.');
      return;
    }
    if (!tripBookable || availableSeats === 0) {
      Alert.alert('No seats available', 'Sorry, no seats are available for this leg.');
      return;
    }

    setLoading(true);
    try {
      const { booking, payment_order } = await createBooking({
        scheduled_trip_id: scheduledTrip.id,
        pickup_stop_id: pickupStopId,
        dropoff_stop_id: dropoffStopId,
      });
      setCurrentBooking(booking);
      setCurrentPaymentOrder(payment_order);
      setPaymentModalVisible(true);
    } catch (error) {
      console.error('Booking error:', error);
      if (error.message && (error.message.includes('duplicate_booking') || error.message.includes('already has a booking'))) {
        Alert.alert('Already Booked', 'You already have a booking for this trip. Please check your bookings.');
        navigation.goBack();
      } else {
        Alert.alert('Error', error.message || 'Booking failed');
      }
    } finally {
      setLoading(false);
    }
  };

 const handlePaymentSuccess = async (paymentData) => {
  try {
    const result = await verifyBookingPayment(currentBooking.id, {
      razorpay_order_id: currentPaymentOrder.razorpay_order_id,
      razorpay_payment_id: paymentData.razorpay_payment_id,
      razorpay_signature: paymentData.razorpay_signature,
    });
    // result.booking contains the OTP
    const otp = result.booking.otp;
    Alert.alert('Success', `Booking confirmed for ${seatCount} seat(s)!`);
    setPaymentModalVisible(false);
    navigation.navigate('BookingConfirmation', {
      route: { name: routeName, time: scheduledTrip.planned_start_at },
      busType: 'AC',
      seats: Array(seatCount).fill('Any'),
      fare: totalFare,
      otp: otp,  // <-- add OTP
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
    amount: currentPaymentOrder.amount_subunits * seatCount,
    currency: currentPaymentOrder.currency,
    order_id: currentPaymentOrder.razorpay_order_id,
    name: 'Kolkata Shuttle',
    description: `Kolkata Shuttle – ${routeName || 'Bus'}`,
    prefill: {
      email: user?.email,
      contact: user?.phone || '',
      name: user?.full_name || '',
    },
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-6 bg-white px-6 py-2 rounded-full"
        >
          <Text className="text-black font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Select Seats" />
      <ScrollView>
        <View className="p-5 border-b border-gray-800">
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-xl font-bold">{routeName}</Text>
            {scheduledTrip.route?.has_ac && (
              <View className="px-2 py-1 rounded-full bg-green-100">
                <Text className="text-green-700 text-xs font-bold">AC</Text>
              </View>
            )}
          </View>
          <Text className="text-green-500 text-base mt-1">Scheduled Trip</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {new Date(scheduledTrip.planned_start_at).toLocaleString()}
          </Text>
        </View>

        {driverInfo && (
          <View className="mx-5 mt-4 bg-gray-900 rounded-2xl p-4">
            <Text className="text-white font-bold mb-2">Driver & Vehicle</Text>
            <View className="flex-row items-center mb-2">
              <Ionicons name="person-circle-outline" size={20} color="#aaa" />
              <Text className="text-gray-300 ml-2">Driver: {driverInfo.driver_name || 'N/A'}</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text className="text-gray-300 ml-1">
                {driverInfo.driver_average_rating?.toFixed(1)} ({driverInfo.driver_rating_count} ratings)
              </Text>
            </View>
            <View className="flex-row items-center mb-1">
              <Ionicons name="car-outline" size={20} color="#aaa" />
              <Text className="text-gray-300 ml-2">
                {driverInfo.vehicle_name || 'Bus'} • {driverInfo.vehicle_registration_number || ''}
              </Text>
            </View>
            {driverInfo.vehicle_model && (
              <Text className="text-gray-400 text-xs ml-7">
                {driverInfo.vehicle_model} ({driverInfo.vehicle_color})
              </Text>
            )}
            <Text className="text-gray-400 text-xs ml-7">
              Total seats: {driverInfo.vehicle_total_seat || seatCapacity}
            </Text>
          </View>
        )}

        <View className="mx-5 mt-6 bg-gray-900 rounded-2xl p-5">
          <Text className="text-white text-lg font-semibold mb-4">Number of Seats</Text>
          <Text className="text-gray-400 text-sm mb-2">
            Total seats (this leg): {seatCapacity}
          </Text>
          <Text className="text-gray-400 text-sm mb-4">
            Available for this leg: {availableSeats} (Overlapping bookings: {overlapping})
          </Text>
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={decrementSeats}
              disabled={seatCount <= 1}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                seatCount <= 1 ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <Ionicons name="remove" size={24} color={seatCount <= 1 ? '#666' : '#000'} />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">{seatCount}</Text>
            <TouchableOpacity
              onPress={incrementSeats}
              disabled={seatCount >= availableSeats}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                seatCount >= availableSeats ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <Ionicons name="add" size={24} color={seatCount >= availableSeats ? '#666' : '#000'} />
            </TouchableOpacity>
          </View>
          {!tripBookable && (
            <Text className="text-red-500 text-center mt-3">This trip leg is not bookable</Text>
          )}
        </View>

        <View className="bg-gray-900 mx-5 my-3 p-5 rounded-2xl">
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Per seat</Text>
            <Text className="text-white font-medium">₹{fareAmount}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-400">Seats</Text>
            <Text className="text-white font-medium">× {seatCount}</Text>
          </View>
          <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-800">
            <Text className="text-white font-bold text-lg">Total</Text>
            <Text className="text-green-500 font-bold text-lg">₹{totalFare}</Text>
          </View>
        </View>

        <CustomButton
          title={loading ? 'Processing...' : `Confirm & Pay ₹${totalFare}`}
          onPress={handleConfirm}
          disabled={loading || !tripBookable || availableSeats === 0}
          className="mx-5 mb-6"
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