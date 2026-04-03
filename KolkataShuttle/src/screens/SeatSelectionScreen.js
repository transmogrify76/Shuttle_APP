import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import SeatMap from '../components/SeatMap';
import CustomButton from '../components/CustomButton';
import RazorpayWebView from '../components/RazorpayWebView';
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
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [currentPaymentOrder, setCurrentPaymentOrder] = useState(null);

  const bookedSeats = ['2A', '3B', '5C']; // Replace later

  const handleSeatSelect = (seats) => setSelectedSeats(seats);

  const handleConfirm = async () => {
    if (selectedSeats.length === 0) {
      Alert.alert('No seats selected', 'Please select at least one seat.');
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
      Alert.alert('Error', error.message || 'Booking creation failed');
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
      Alert.alert('Success', 'Booking confirmed!');
      navigation.navigate('BookingConfirmation', {
        route: { name: routeName, time: scheduledTrip.planned_start_at },
        busType: 'AC',
        seats: selectedSeats,
        fare: fareAmount,
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Payment verification failed');
    } finally {
      setPaymentModalVisible(false);
    }
  };

  const handlePaymentError = (errorMsg) => {
    Alert.alert('Payment Error', errorMsg);
    setPaymentModalVisible(false);
  };

  const paymentOrderData = currentPaymentOrder ? {
    key: currentPaymentOrder.razorpay_key_id,
    amount: currentPaymentOrder.amount_subunits,
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