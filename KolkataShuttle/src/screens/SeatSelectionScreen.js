import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import RazorpayWebView from '../components/RazorpayWebView';
import BusSeatMap from '../components/BusSeatMap';
import { useAuth } from '../context/AuthContext';
import { useSeatmap } from '../context/SeatmapContext';
import { createBooking, verifyBookingPayment, getLegAvailableSeats, getDriverVehicleInfo } from '../services/bookingApi';
import { C, T } from '../styles/design';

export default function SeatSelectionScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { scheduledTrip, pickupStopId, dropoffStopId, fareAmount, routeName } = route.params;

  const [selectedSeat, setSelectedSeat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentBooking, setCurrentBooking] = useState(null);
  const [currentPaymentOrder, setCurrentPaymentOrder] = useState(null);
  const [seatCapacity, setSeatCapacity] = useState(0);
  const [occupiedSeatsList, setOccupiedSeatsList] = useState([]);
  const [tripBookable, setTripBookable] = useState(false);

  const { seatmapData, subscribe, refresh, unsubscribe } = useSeatmap();

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
        setOccupiedSeatsList(legInfo.occupied_seat_numbers || []);
        setTripBookable(legInfo.trip_bookable);
      } catch (err) {
        setError(err.message);
      } finally {
        setInfoLoading(false);
      }
    };
    fetchInitial();

    const topic = { scheduled_trip_id: scheduledTrip.id, route_id: scheduledTrip.route_id, pickup_stop_id: pickupStopId, dropoff_stop_id: dropoffStopId };
    subscribe(topic);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (seatmapData) {
      setSeatCapacity(seatmapData.seat_capacity);
      setOccupiedSeatsList(seatmapData.occupied_seat_numbers || []);
      setTripBookable(seatmapData.trip_bookable);
      if (selectedSeat && seatmapData.occupied_seat_numbers.includes(selectedSeat)) {
        setSelectedSeat(null);
        Alert.alert('Seat no longer available', 'Please select another seat');
      }
    }
  }, [seatmapData]);

  const handleSeatSelect = (seatNumber) => setSelectedSeat(seatNumber);

  const handleConfirm = async () => {
    if (!selectedSeat) { Alert.alert('No seat selected', 'Please select a seat'); return; }
    if (!tripBookable) { Alert.alert('Trip not bookable', 'This trip is not available for booking'); return; }
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
    } catch (err) {
      if (err.message?.includes('duplicate_booking')) {
        Alert.alert('Already Booked', 'You already have a booking for this trip.');
        navigation.goBack();
      } else if (err.message?.includes('seat_unavailable')) {
        Alert.alert('Seat taken', 'That seat is no longer available. Please choose another.');
        refresh();
        setSelectedSeat(null);
      } else {
        Alert.alert('Error', err.message || 'Booking failed');
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
    } catch (err) {
      Alert.alert('Error', err.message || 'Payment verification failed');
      setPaymentModalVisible(false);
    }
  };

  const handlePaymentError = (msg) => { Alert.alert('Payment Error', msg); setPaymentModalVisible(false); };

  const paymentOrderData = currentPaymentOrder ? {
    key: currentPaymentOrder.razorpay_key_id,
    amount: currentPaymentOrder.amount_subunits,
    currency: currentPaymentOrder.currency,
    order_id: currentPaymentOrder.razorpay_order_id,
    name: 'Kolkata Shuttle',
    description: `Kolkata Shuttle – ${routeName || 'Bus'} seat ${selectedSeat}`,
    prefill: { email: user?.email, contact: user?.phone || '', name: user?.full_name || '' },
  } : null;

  if (infoLoading) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.gold} /></View>;
  if (error) return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Ionicons name="alert-circle-outline" size={60} color={C.red} />
      <Text style={[T.bodyMd, { marginTop: 16, color: C.textSecondary }]}>{error}</Text>
      <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, backgroundColor: C.gold, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 30 }}><Text style={{ color: '#000', fontWeight: 'bold' }}>Go Back</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="Select Seats" showBack />
      <ScrollView>
        <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={T.displayMd}>{routeName}</Text>
            {scheduledTrip.route?.has_ac && <View style={{ backgroundColor: C.goldDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}><Text style={{ color: C.gold, fontSize: 10, fontWeight: 'bold' }}>AC</Text></View>}
          </View>
          <Text style={[T.bodySm, { marginTop: 4 }]}>{new Date(scheduledTrip.planned_start_at).toLocaleString()}</Text>
        </View>

        {driverInfo && (
          <View style={{ margin: 20, padding: 16, backgroundColor: C.surfaceUp, borderRadius: 20, borderWidth: 1, borderColor: C.border }}>
            <Text style={[T.headingSm, { marginBottom: 12 }]}>Driver & Vehicle</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <LinearGradient colors={[C.goldDim, 'rgba(201,168,76,0.05)']} style={{ width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="person" size={22} color={C.gold} />
              </LinearGradient>
              <View><Text style={T.bodyMd}>{driverInfo.driver_name || 'N/A'}</Text><Text style={T.bodySm}>{driverInfo.driver_average_rating ? `${driverInfo.driver_average_rating.toFixed(1)} (${driverInfo.driver_rating_count})` : 'New driver'}</Text></View>
            </View>
            <Text style={T.bodySm}>{driverInfo.vehicle_name || 'Bus'} • {driverInfo.vehicle_registration_number || ''}</Text>
            <Text style={T.bodySm}>Total seats: {seatCapacity}</Text>
          </View>
        )}

        <View style={{ marginHorizontal: 20, marginVertical: 10 }}>
          <Text style={[T.headingSm, { marginBottom: 12 }]}>Select a seat</Text>
          <BusSeatMap seatCapacity={seatCapacity} occupiedSeats={occupiedSeatsList} selectedSeat={selectedSeat} onSeatSelect={handleSeatSelect} />
        </View>

        <View style={{ margin: 20, padding: 16, backgroundColor: C.surfaceUp, borderRadius: 20, borderWidth: 1, borderColor: C.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={T.bodySm}>Selected seat</Text>
            <Text style={T.bodyMd}>{selectedSeat || 'None'}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={T.bodySm}>Fare</Text>
            <Text style={T.bodyMd}>₹{fareAmount}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border }}>
            <Text style={T.bodyLg}>Total</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: C.gold }}>₹{fareAmount}</Text>
          </View>
        </View>

        <CustomButton
          title={loading ? 'Processing...' : `Confirm & Pay ₹${fareAmount}`}
          onPress={handleConfirm}
          disabled={loading || !selectedSeat || !tripBookable}
          style={{ marginHorizontal: 20, marginBottom: 30 }}
          buttonColor="gold"
        />
      </ScrollView>
      {paymentOrderData && <RazorpayWebView visible={paymentModalVisible} onClose={() => setPaymentModalVisible(false)} onSuccess={handlePaymentSuccess} onError={handlePaymentError} orderData={paymentOrderData} />}
    </View>
  );
}