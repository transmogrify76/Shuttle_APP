import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { createBooking, verifyBookingPayment } from '../services/bookingApi';

// Dynamically import RazorpayCheckout to avoid null issues
let RazorpayCheckout;
try {
  RazorpayCheckout = require('react-native-razorpay').default;
} catch (e) {
  console.warn('Razorpay not installed', e);
}

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

  const availableSeats = scheduledTrip.available_seats || 0;
  const [seatCount, setSeatCount] = useState(1);
  const [loading, setLoading] = useState(false);

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

    if (!RazorpayCheckout) {
      Alert.alert('Payment Error', 'Payment module not available. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      // Create booking (backend returns payment order for a single seat)
      const { booking, payment_order } = await createBooking({
        scheduled_trip_id: scheduledTrip.id,
        pickup_stop_id: pickupStopId,
        dropoff_stop_id: dropoffStopId,
      });

      // Prepare Razorpay options – multiply amount by seat count
      const options = {
        description: `Kolkata Shuttle – ${routeName || 'Bus'}`,
        image: 'https://your-logo.png', // Replace with your logo URL
        currency: payment_order.currency,
        key: payment_order.razorpay_key_id,
        amount: payment_order.amount_subunits * seatCount,
        name: 'Kolkata Shuttle',
        order_id: payment_order.razorpay_order_id,
        prefill: {
          email: user?.email,
          contact: user?.phone || '',
          name: user?.full_name || '',
        },
        theme: { color: '#000000' },
      };

      const paymentData = await RazorpayCheckout.open(options);

      // Verify payment with backend
      await verifyBookingPayment(booking.id, {
        razorpay_order_id: payment_order.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });

      Alert.alert('Success', `Booking confirmed for ${seatCount} seat(s)!`);
      navigation.navigate('BookingConfirmation', {
        route: { name: routeName, time: scheduledTrip.planned_start_at },
        busType: 'AC',
        seats: Array(seatCount).fill('Any'), // placeholder for seat numbers
        fare: totalFare,
      });
    } catch (error) {
      if (error.code === 'PAYMENT_CANCELLED') {
        Alert.alert('Payment cancelled', 'You can try again later.');
      } else {
        Alert.alert('Error', error.message || 'Booking failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Select Seats" />
      <ScrollView>
        {/* Trip Info */}
        <View className="p-5 border-b border-gray-800">
          <Text className="text-white text-xl font-bold">{routeName}</Text>
          <Text className="text-green-500 text-base mt-1">Scheduled Trip</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {new Date(scheduledTrip.planned_start_at).toLocaleString()}
          </Text>
        </View>

        {/* Seat Quantity Selector */}
        <View className="mx-5 mt-6 bg-gray-900 rounded-2xl p-5">
          <Text className="text-white text-lg font-semibold mb-4">Number of Seats</Text>
          <Text className="text-gray-400 text-sm mb-4">
            Available seats: {availableSeats}
          </Text>
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={decrementSeats}
              disabled={seatCount <= 1}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                seatCount <= 1 ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <Ionicons
                name="remove"
                size={24}
                color={seatCount <= 1 ? '#666' : '#000'}
              />
            </TouchableOpacity>
            <Text className="text-white text-2xl font-bold">{seatCount}</Text>
            <TouchableOpacity
              onPress={incrementSeats}
              disabled={seatCount >= availableSeats}
              className={`w-12 h-12 rounded-full items-center justify-center ${
                seatCount >= availableSeats ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <Ionicons
                name="add"
                size={24}
                color={seatCount >= availableSeats ? '#666' : '#000'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Fare Summary */}
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

        {/* Confirm Button */}
        <CustomButton
          title={loading ? 'Processing...' : `Confirm & Pay ₹${totalFare}`}
          onPress={handleConfirm}
          disabled={loading || availableSeats === 0}
          className="mx-5 mb-6"
        />
      </ScrollView>
    </View>
  );
}