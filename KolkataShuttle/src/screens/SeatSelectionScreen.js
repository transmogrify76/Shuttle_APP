import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';
import RazorpayWebView from '../components/RazorpayWebView';
import BusSeatMap from '../components/BusSeatMap';
import { useAuth } from '../context/AuthContext';
import { useSeatmap } from '../context/SeatmapContext';
import {
  getLegAvailableSeats,
  getDriverVehicleInfo,
  getTravellerProfiles,
  createBookingSession,
  verifyBookingSessionPayment,
} from '../services/bookingApi';
import { C, T } from '../styles/design';

const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const ProfileAvatar = ({ profile, onSelect, selected }) => (
  <TouchableOpacity onPress={() => onSelect(profile)} style={{ alignItems: 'center', marginHorizontal: 8 }}>
    <View style={{
      width: 70, height: 70, borderRadius: 35,
      backgroundColor: selected ? C.goldDim : C.surfaceHigh,
      borderWidth: selected ? 2 : 1,
      borderColor: selected ? C.gold : C.border,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: selected ? C.gold : C.textPrimary }}>
        {getInitials(profile.full_name)}
      </Text>
    </View>
    <Text style={[T.bodySm, { marginTop: 6, color: selected ? C.gold : C.textSecondary }]} numberOfLines={1}>
      {profile.is_self ? 'You' : profile.full_name.split(' ')[0]}
    </Text>
  </TouchableOpacity>
);

export default function SeatSelectionScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { scheduledTrip, pickupStopId, dropoffStopId, fareAmount, routeName } = route.params;

  // Seats and assignments
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatAssignments, setSeatAssignments] = useState({}); // { seatNumber: assignmentObject }
  const [tempSeat, setTempSeat] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignType, setAssignType] = useState(null); // 'self', 'profile', 'guest'
  const [profiles, setProfiles] = useState([]);
  const [guestForm, setGuestForm] = useState({ full_name: '', phone: '', email: '', relationship_label: '' });
  const [guestModalVisible, setGuestModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [driverInfo, setDriverInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [currentPaymentOrder, setCurrentPaymentOrder] = useState(null);
  const [seatCapacity, setSeatCapacity] = useState(0);
  const [occupiedSeatsList, setOccupiedSeatsList] = useState([]);
  const [tripBookable, setTripBookable] = useState(false);

  const { seatmapData, subscribe, refresh, unsubscribe } = useSeatmap();

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setInfoLoading(true);
        const [legInfo, driver, profileRes] = await Promise.all([
          getLegAvailableSeats(scheduledTrip.id, scheduledTrip.route_id, pickupStopId, dropoffStopId),
          getDriverVehicleInfo(scheduledTrip.id),
          getTravellerProfiles(true),
        ]);
        setDriverInfo(driver);
        setSeatCapacity(legInfo.seat_capacity);
        setOccupiedSeatsList(legInfo.occupied_seat_numbers || []);
        setTripBookable(legInfo.trip_bookable);
        setProfiles(profileRes.items || []);
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
      const newSelected = selectedSeats.filter(s => !seatmapData.occupied_seat_numbers.includes(s));
      if (newSelected.length !== selectedSeats.length) {
        setSelectedSeats(newSelected);
        const newAssign = { ...seatAssignments };
        selectedSeats.forEach(seat => {
          if (seatmapData.occupied_seat_numbers.includes(seat)) delete newAssign[seat];
        });
        setSeatAssignments(newAssign);
      }
    }
  }, [seatmapData]);

  const handleSeatPress = (seatNumber) => {
    if (occupiedSeatsList.includes(seatNumber)) {
      Alert.alert('Occupied', `Seat ${seatNumber} is already taken`);
      return;
    }
    if (selectedSeats.includes(seatNumber)) {
      // Deselect
      setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
      const newAssign = { ...seatAssignments };
      delete newAssign[seatNumber];
      setSeatAssignments(newAssign);
    } else {
      setTempSeat(seatNumber);
      setAssignType(null);
      setAssignModalVisible(true);
    }
  };

  // Called from assignment modal
  const assignSelf = () => {
    setSeatAssignments(prev => ({ ...prev, [tempSeat]: { type: 'self' } }));
    if (!selectedSeats.includes(tempSeat)) setSelectedSeats(prev => [...prev, tempSeat]);
    setAssignModalVisible(false);
    setTempSeat(null);
  };

  const assignProfile = (profile) => {
    // Prevent assigning a saved profile that uses account email and is not self
    if (!profile.is_self && profile.email && profile.email.trim().toLowerCase() === user?.email?.trim().toLowerCase()) {
      Alert.alert('Invalid', 'This profile uses your account email. Use "Self" for yourself.');
      return;
    }
    setSeatAssignments(prev => ({ ...prev, [tempSeat]: { type: 'profile', profileId: profile.id } }));
    if (!selectedSeats.includes(tempSeat)) setSelectedSeats(prev => [...prev, tempSeat]);
    setAssignModalVisible(false);
    setTempSeat(null);
  };

  const openGuestModal = () => {
    setAssignModalVisible(false);
    setGuestForm({ full_name: '', phone: '', email: '', relationship_label: '' });
    setGuestModalVisible(true);
  };

  const assignGuest = () => {
    if (!guestForm.full_name.trim() || !guestForm.phone.trim()) {
      Alert.alert('Missing info', 'Name and phone are required');
      return;
    }
    // Prevent guest email equal to account email
    if (guestForm.email && guestForm.email.trim().toLowerCase() === user?.email?.trim().toLowerCase()) {
      Alert.alert('Invalid', 'For yourself, choose Self instead of entering your account email.');
      return;
    }
    setSeatAssignments(prev => ({
      ...prev,
      [tempSeat]: {
        type: 'guest',
        traveller: {
          full_name: guestForm.full_name,
          phone: guestForm.phone,
          email: guestForm.email || null,
          relationship_label: guestForm.relationship_label || null,
        }
      }
    }));
    if (!selectedSeats.includes(tempSeat)) setSelectedSeats(prev => [...prev, tempSeat]);
    setGuestModalVisible(false);
    setTempSeat(null);
  };

  const buildSeatsPayload = () => {
    return selectedSeats.map(seatNum => {
      const assign = seatAssignments[seatNum];
      if (!assign) return null; // should not happen
      if (assign.type === 'self') {
        return { seat_number: seatNum };
      } else if (assign.type === 'profile') {
        return { seat_number: seatNum, traveller_profile_id: assign.profileId };
      } else {
        return { seat_number: seatNum, traveller: assign.traveller };
      }
    }).filter(p => p !== null);
  };

  const handleConfirm = async () => {
    if (selectedSeats.length === 0) {
      Alert.alert('No seats', 'Please select at least one seat');
      return;
    }
    const missing = selectedSeats.filter(seat => !seatAssignments[seat]);
    if (missing.length > 0) {
      Alert.alert('Incomplete', `Please assign a traveller for seat(s): ${missing.join(', ')}`);
      return;
    }
    if (!tripBookable) {
      Alert.alert('Trip not bookable', 'This trip is not available for booking');
      return;
    }
    const seatsPayload = buildSeatsPayload();
    setLoading(true);
    try {
      const res = await createBookingSession({
        scheduled_trip_id: scheduledTrip.id,
        pickup_stop_id: pickupStopId,
        dropoff_stop_id: dropoffStopId,
        seats: seatsPayload,
      });
      setCurrentSession(res.booking_session);
      setCurrentPaymentOrder(res.payment_order);
      setPaymentModalVisible(true);
    } catch (err) {
      if (err.message.includes('seat_unavailable')) {
        Alert.alert('Seat taken', 'Some seats are no longer available. Refreshing...');
        refresh();
        setSelectedSeats([]);
        setSeatAssignments({});
      } else {
        Alert.alert('Error', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    try {
      await verifyBookingSessionPayment(currentSession.id, {
        razorpay_order_id: currentPaymentOrder.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });
      Alert.alert('Success', `Booking confirmed for ${selectedSeats.length} seat(s)`);
      setPaymentModalVisible(false);
      navigation.navigate('BookingConfirmation', {
        sessionId: currentSession.id,
        seats: selectedSeats,
        fare: fareAmount * selectedSeats.length,
        routeName,
        scheduledTrip,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Payment verification failed');
      setPaymentModalVisible(false);
    }
  };

  const handlePaymentError = (msg) => {
    Alert.alert('Payment Error', msg);
    setPaymentModalVisible(false);
  };

  const paymentOrderData = currentPaymentOrder ? {
    key: currentPaymentOrder.razorpay_key_id,
    amount: currentPaymentOrder.amount_subunits,
    currency: currentPaymentOrder.currency,
    order_id: currentPaymentOrder.razorpay_order_id,
    name: 'Kolkata Shuttle',
    description: `${routeName} - ${selectedSeats.length} seat(s)`,
    prefill: { email: user?.email, contact: user?.phone || '', name: user?.full_name || '' },
  } : null;

  const getAssignmentLabel = (seatNum) => {
    const a = seatAssignments[seatNum];
    if (!a) return 'Not assigned';
    if (a.type === 'self') return 'You';
    if (a.type === 'profile') {
      const p = profiles.find(pr => pr.id === a.profileId);
      return p ? p.full_name : 'Saved';
    }
    return a.traveller.full_name;
  };

  if (infoLoading) return <View style={{ flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center' }}><ActivityIndicator size="large" color={C.gold} /></View>;
  if (error) return <View style={{ flex:1, justifyContent:'center', alignItems:'center', padding:20 }}><Text style={{ color: C.red }}>{error}</Text></View>;

  return (
    <View style={{ flex:1, backgroundColor:C.bg, paddingTop: insets.top }}>
      <Header title="Select Seats" showBack />
      <ScrollView>
        <View style={{ padding:20, borderBottomWidth:1, borderBottomColor:C.border }}>
          <Text style={T.displayMd}>{routeName}</Text>
          <Text style={T.bodySm}>{new Date(scheduledTrip.planned_start_at).toLocaleString()}</Text>
        </View>

        {driverInfo && (
          <View style={{ margin:20, padding:16, backgroundColor:C.surfaceUp, borderRadius:20 }}>
            <Text style={T.headingSm}>Driver & Vehicle</Text>
            <Text style={T.bodyMd}>{driverInfo.driver_name}</Text>
            <Text style={T.bodySm}>{driverInfo.vehicle_name} • {driverInfo.vehicle_registration_number}</Text>
          </View>
        )}

        <View style={{ marginHorizontal:20, marginVertical:10 }}>
          <Text style={[T.headingSm, { marginBottom:12 }]}>Tap a seat to assign traveller</Text>
          <BusSeatMap
            seatCapacity={seatCapacity}
            occupiedSeats={occupiedSeatsList}
            selectedSeats={selectedSeats}
            onSeatSelect={handleSeatPress}
            multiSelect
          />
        </View>

        {selectedSeats.length > 0 && (
          <View style={{ margin:20, padding:16, backgroundColor:C.surfaceUp, borderRadius:20 }}>
            <Text style={[T.headingSm, { marginBottom:12 }]}>Assigned seats</Text>
            {selectedSeats.map(seat => (
              <View key={seat} style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 }}>
                <Text style={T.bodyMd}>Seat {seat}</Text>
                <Text style={[T.bodySm, { color:C.gold }]}>{getAssignmentLabel(seat)}</Text>
              </View>
            ))}
            <View style={{ marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:C.border, flexDirection:'row', justifyContent:'space-between' }}>
              <Text style={T.bodyLg}>Total</Text>
              <Text style={{ fontSize:18, fontWeight:'bold', color:C.gold }}>₹{fareAmount * selectedSeats.length}</Text>
            </View>
          </View>
        )}

        <CustomButton
          title={loading ? 'Processing...' : `Confirm & Pay ₹${fareAmount * selectedSeats.length}`}
          onPress={handleConfirm}
          disabled={loading || selectedSeats.length === 0 || !tripBookable}
          style={{ marginHorizontal:20, marginBottom:30 }}
          buttonColor="gold"
        />
      </ScrollView>

      {/* Assignment Modal */}
      <Modal visible={assignModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
          <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'flex-end' }}>
            <View style={{ backgroundColor:C.surface, borderTopLeftRadius:28, borderTopRightRadius:28, padding:24, borderTopWidth:1, borderColor:C.border }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <Text style={T.displayMd}>Seat {tempSeat}</Text>
                <TouchableOpacity onPress={() => setAssignModalVisible(false)}><Ionicons name="close" size={24} color={C.textSecondary} /></TouchableOpacity>
              </View>
              <TouchableOpacity onPress={assignSelf} style={{ padding:16, backgroundColor:C.surfaceHigh, borderRadius:16, marginBottom:12, flexDirection:'row', alignItems:'center', gap:12 }}>
                <Ionicons name="person" size={24} color={C.gold} />
                <View><Text style={T.bodyLg}>Self</Text><Text style={T.bodySm}>Book for yourself</Text></View>
              </TouchableOpacity>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap:12, paddingBottom:8, marginVertical:12 }}>
                {profiles.map(p => (
                  <ProfileAvatar key={p.id} profile={p} onSelect={() => assignProfile(p)} selected={false} />
                ))}
              </ScrollView>
              <TouchableOpacity onPress={openGuestModal} style={{ padding:16, backgroundColor:C.surfaceHigh, borderRadius:16, flexDirection:'row', alignItems:'center', gap:12 }}>
                <Ionicons name="person-add-outline" size={24} color={C.gold} />
                <View><Text style={T.bodyLg}>Guest traveller</Text><Text style={T.bodySm}>One‑time entry</Text></View>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Guest Modal */}
      <Modal visible={guestModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
          <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'center', alignItems:'center', padding:24 }}>
            <LinearGradient colors={[C.surface, C.surfaceUp]} style={{ borderRadius:28, padding:24, width:'100%', borderWidth:1, borderColor:C.border }}>
              <Text style={T.displayMd}>Guest traveller</Text>
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={C.textMuted} value={guestForm.full_name} onChangeText={t => setGuestForm({...guestForm, full_name:t})} />
              <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={C.textMuted} value={guestForm.phone} onChangeText={t => setGuestForm({...guestForm, phone:t})} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Email (optional)" placeholderTextColor={C.textMuted} value={guestForm.email} onChangeText={t => setGuestForm({...guestForm, email:t})} autoCapitalize="none" />
              <TextInput style={styles.input} placeholder="Relationship (optional)" placeholderTextColor={C.textMuted} value={guestForm.relationship_label} onChangeText={t => setGuestForm({...guestForm, relationship_label:t})} />
              <View style={{ flexDirection:'row', gap:12, marginTop:16 }}>
                <TouchableOpacity onPress={() => setGuestModalVisible(false)} style={{ flex:1, backgroundColor:C.surfaceHigh, borderRadius:16, paddingVertical:12, alignItems:'center' }}>
                  <Text style={T.bodyMd}>Cancel</Text>
                </TouchableOpacity>
                <CustomButton title="Assign" onPress={assignGuest} style={{ flex:1 }} />
              </View>
            </LinearGradient>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {paymentOrderData && <RazorpayWebView visible={paymentModalVisible} onClose={() => setPaymentModalVisible(false)} onSuccess={handlePaymentSuccess} onError={handlePaymentError} orderData={paymentOrderData} />}
    </View>
  );
}

const styles = {
  input: { backgroundColor: C.surfaceUp, borderWidth:1, borderColor:C.border, borderRadius:14, padding:12, color:C.textPrimary, marginBottom:12 }
};