import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RazorpayCheckout from 'react-native-razorpay';
import Header from '../components/Header';
import SeatMap from '../components/SeatMap';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';
import { createBooking, verifyBookingPayment } from '../services/bookingApi';

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

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch booked seats for this trip (you'll need an API for that)
  // For now, use dummy data
  const bookedSeats = ['2A', '3B', '5C']; // Replace with API call

  const handleSeatSelect = (seats) => {
    setSelectedSeats(seats);
  };

  const handleConfirm = async () => {
    if (selectedSeats.length === 0) {
      Alert.alert('No seats selected', 'Please select at least one seat.');
      return;
    }

    setLoading(true);
    try {
      // Create booking (returns payment order)
      const { booking, payment_order } = await createBooking({
        scheduled_trip_id: scheduledTrip.id,
        pickup_stop_id: pickupStopId,
        dropoff_stop_id: dropoffStopId,
      });

      // Optional: store selected seats in booking metadata (if backend supports)
      // For now, we'll just proceed with payment

      // Initiate Razorpay payment
      const options = {
        description: `Kolkata Shuttle – ${routeName || 'Bus'}`,
        image: 'https://your-logo.png',
        currency: payment_order.currency,
        key: payment_order.razorpay_key_id,
        amount: payment_order.amount_subunits,
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

      Alert.alert('Success', 'Booking confirmed!');
      navigation.navigate('BookingConfirmation', {
        route: { name: routeName, time: scheduledTrip.planned_start_at },
        busType: 'AC',
        seats: selectedSeats,
        fare: fareAmount,
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
        <View className="p-5 border-b border-gray-800">
          <Text className="text-white text-xl font-bold">{routeName}</Text>
          <Text className="text-green-500 text-base mt-1">Scheduled Trip</Text>
          <Text className="text-gray-400 text-sm mt-1">
            {new Date(scheduledTrip.planned_start_at).toLocaleString()}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">
            Pickup stop ID: {pickupStopId} → Dropoff stop ID: {dropoffStopId}
          </Text>
        </View>

        <SeatMap bookedSeats={bookedSeats} onSeatSelect={handleSeatSelect} />

        <View className="bg-gray-900 mx-4 my-3 p-5 rounded-2xl">
          <Text className="text-white font-medium">Selected Seats: {selectedSeats.join(', ') || 'None'}</Text>
          <Text className="text-white font-medium mt-2">Total: ₹{fareAmount * selectedSeats.length}</Text>
        </View>

        <CustomButton
          title={loading ? 'Processing...' : `Confirm & Pay ₹${fareAmount * selectedSeats.length}`}
          onPress={handleConfirm}
          disabled={selectedSeats.length === 0 || loading}
          className="mx-4 mb-6"
        />
      </ScrollView>
    </View>
  );
}