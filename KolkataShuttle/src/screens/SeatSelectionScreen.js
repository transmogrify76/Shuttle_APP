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
  retryBookingSessionPayment,
} from '../services/bookingApi';
import { validateTravellerForm } from '../utils/travellerValidation';
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
  const { scheduledTrip, pickupStopId, dropoffStopId, fareAmount, farePreview, routeName } = route.params;

  // Seats and assignments
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatAssignments, setSeatAssignments] = useState({}); // { seatNumber: assignmentObject }
  const [tempSeat, setTempSeat] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignType, setAssignType] = useState(null); // 'self', 'profile', 'guest'
  const [profiles, setProfiles] = useState([]);
  const [guestForm, setGuestForm] = useState({ full_name: '', phone: '', email: '', relationship_label: '' });
  const [guestErrors, setGuestErrors] = useState({});
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
  // 'idle' | 'checking' | 'checkout_open' | 'retry_available' | 'confirmed' | 'closed'
  const [paymentUiState, setPaymentUiState] = useState('idle');
  const [inFlight, setInFlight] = useState(false); // mutex: never run create/verify/retry in parallel

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
    setGuestErrors({});
    setGuestModalVisible(true);
  };

  const assignGuest = () => {
    const { valid, errors } = validateTravellerForm(guestForm);
    // Prevent guest email equal to account email
    if (guestForm.email && guestForm.email.trim().toLowerCase() === user?.email?.trim().toLowerCase()) {
      errors.email = 'For yourself, choose Self instead of entering your account email.';
    }
    setGuestErrors(errors);
    if (!valid || errors.email) return;

    setSeatAssignments(prev => ({
      ...prev,
      [tempSeat]: {
        type: 'guest',
        traveller: {
          full_name: guestForm.full_name.trim(),
          phone: guestForm.phone.trim(),
          email: guestForm.email?.trim() || null,
          relationship_label: guestForm.relationship_label || null,
        }
      }
    }));
    if (!selectedSeats.includes(tempSeat)) setSelectedSeats(prev => [...prev, tempSeat]);
    setGuestModalVisible(false);
    setGuestErrors({});
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

  // Doc §6.3: session.status === 'pending_payment' and the hold hasn't expired.
  const canRetryPayment = (session) => {
    if (!session || session.status !== 'pending_payment') return false;
    if (!session.payment_hold_expires_at) return false;
    return Date.parse(session.payment_hold_expires_at) > Date.now();
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
    if (inFlight) return; // mutex: never create + retry/verify in parallel
    const seatsPayload = buildSeatsPayload();
    setLoading(true);
    setInFlight(true);
    try {
      const res = await createBookingSession({
        scheduled_trip_id: scheduledTrip.id,
        pickup_stop_id: pickupStopId,
        dropoff_stop_id: dropoffStopId,
        seats: seatsPayload,
      });
      setCurrentSession(res.booking_session);
      setCurrentPaymentOrder(res.payment_order);
      setPaymentUiState('checkout_open');
      setPaymentModalVisible(true);
    } catch (err) {
      // Structured domain errors from GST/traveller-validation commits
      // (PASSENGER_FE_LATER_COMMITS_INTEGRATION.md §5.5, §9).
      if (err.code === 'seat_unavailable') {
        Alert.alert('Seat taken', 'Some seats are no longer available. Refreshing...');
        refresh();
        setSelectedSeats([]);
        setSeatAssignments({});
      } else if (err.code === 'duplicate_traveller_in_booking_session') {
        const groups = err.detail?.seat_number_groups;
        const seatsText = Array.isArray(groups) ? groups.flat().join(', ') : '';
        Alert.alert('Duplicate traveller', `The same traveller is assigned to more than one seat${seatsText ? ` (seats ${seatsText})` : ''}. Please use a different traveller for each seat.`);
      } else if (err.code === 'traveller_booking_conflict') {
        Alert.alert('Journey conflict', `${err.message}${err.detail?.seat_number ? ` (seat ${err.detail.seat_number})` : ''} Please choose a different traveller for that seat, or a different journey.`);
        // Preserve seat selections per doc §5.5 — do not clear state here.
      } else if (err.code === 'guest_matches_saved_traveller') {
        Alert.alert(
          'Traveller already saved',
          'This phone number matches a traveller you already saved. Please select or reactivate that saved traveller instead of entering it as a guest.'
        );
      } else if (err.code === 'traveller_matches_account_owner') {
        Alert.alert('Use Self', 'That traveller matches your own account. Please choose "Self" for that seat instead.');
      } else if (err.code === 'validation_error') {
        Alert.alert('Check traveller details', err.message);
      } else {
        Alert.alert('Error', err.message);
      }
    } finally {
      setLoading(false);
      setInFlight(false);
    }
  };

  const handlePaymentSuccess = async (paymentData) => {
    if (inFlight) return;
    setInFlight(true);
    setPaymentUiState('checking');
    try {
      const result = await verifyBookingSessionPayment(currentSession.id, {
        razorpay_order_id: currentPaymentOrder.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });
      const confirmedSession = result.booking_session;
      setCurrentSession(confirmedSession);
      setPaymentUiState('confirmed');
      setPaymentModalVisible(false);
      navigation.navigate('BookingConfirmation', {
        sessionId: confirmedSession.id,
        seats: selectedSeats,
        // Authoritative gross charge from the confirmed session snapshot —
        // never the client-multiplied estimate. Doc §3.1/§4.3.
        fare: confirmedSession.total_fare_amount,
        routeName,
        scheduledTrip,
      });
    } catch (err) {
      setPaymentModalVisible(false);
      if (err.code === 'invalid_payment_signature') {
        Alert.alert('Verification failed', 'We could not verify this payment. Please contact support before retrying.');
        setPaymentUiState('closed');
      } else if (err.code === 'payment_amount_mismatch' || err.code === 'payment_order_mismatch') {
        Alert.alert('Payment mismatch', 'Something looked wrong with this payment. Please refresh and try again.');
        setPaymentUiState('retry_available');
      } else {
        Alert.alert('Verification pending', err.message || 'Payment verification failed. You can safely retry.');
        setPaymentUiState('retry_available');
      }
    } finally {
      setInFlight(false);
    }
  };

  // Safe resume/retry per doc §6.3/§6.4 — used for dismissed checkout, network
  // failure, or a failed attempt. Reconciles with Razorpay before deciding.
  const resumePayment = async () => {
    if (!currentSession || inFlight) return;
    setInFlight(true);
    setPaymentUiState('checking');
    try {
      const result = await retryBookingSessionPayment(currentSession.id);
      setCurrentSession(result.booking_session);

      if (!result.payment_order) {
        // Already succeeded — confirm without reopening checkout.
        setPaymentUiState('confirmed');
        navigation.navigate('BookingConfirmation', {
          sessionId: result.booking_session.id,
          seats: selectedSeats,
          fare: result.booking_session.total_fare_amount,
          routeName,
          scheduledTrip,
        });
        return;
      }

      setCurrentPaymentOrder(result.payment_order);
      setPaymentUiState('checkout_open');
      setPaymentModalVisible(true);
    } catch (err) {
      if (err.code === 'payment_processing') {
        setPaymentUiState('checking');
        Alert.alert('Confirming payment', 'Your payment is being confirmed. Pull to refresh My Bookings shortly.');
      } else if (err.code === 'payment_hold_expired' || err.code === 'booking_session_not_retryable') {
        setPaymentUiState('closed');
        Alert.alert('Booking closed', 'The seat hold for this booking has ended. Please search again and book fresh seats.');
      } else {
        setPaymentUiState('retry_available');
        Alert.alert('Error', err.message || 'Could not resume payment');
      }
    } finally {
      setInFlight(false);
    }
  };

  const handlePaymentError = (msg) => {
    setPaymentModalVisible(false);
    // A dismissed Razorpay modal does not prove the payment failed — offer
    // the safe retry path instead of a dead-end alert. Doc §6.3.
    if (currentSession && canRetryPayment(currentSession)) {
      setPaymentUiState('retry_available');
    } else {
      Alert.alert('Payment Error', msg);
      setPaymentUiState('idle');
    }
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
            pendingSeat={tempSeat}
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
            <View style={{ marginTop:12, paddingTop:12, borderTopWidth:1, borderTopColor:C.border }}>
              {currentSession ? (
                // Authoritative snapshot once a session exists — never
                // recomputed client-side. Doc §3.2/§4.3.
                <>
                  {parseFloat(currentSession.total_tax_amount) > 0 && (
                    <>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                        <Text style={T.bodySm}>Taxable value</Text>
                        <Text style={T.bodySm}>₹{currentSession.total_taxable_amount}</Text>
                      </View>
                      <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }}>
                        <Text style={T.bodySm}>GST ({currentSession.gst_inclusive_snapshot ? 'included' : 'added'})</Text>
                        <Text style={T.bodySm}>₹{currentSession.total_tax_amount}</Text>
                      </View>
                    </>
                  )}
                  <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:6 }}>
                    <Text style={T.bodyLg}>Total</Text>
                    <Text style={{ fontSize:18, fontWeight:'bold', color:C.gold }}>₹{currentSession.total_fare_amount}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
                    <Text style={T.bodyLg}>Total (estimate)</Text>
                    <Text style={{ fontSize:18, fontWeight:'bold', color:C.gold }}>₹{fareAmount * selectedSeats.length}</Text>
                  </View>
                  {farePreview?.gst_applicable && (
                    <Text style={[T.bodySm, { color:C.textMuted, marginTop:4 }]}>
                      {farePreview.gst_inclusive ? 'GST included' : 'plus GST'} — exact amount confirmed at checkout
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        )}

        {paymentUiState === 'retry_available' && (
          <View style={{ marginHorizontal:20, marginBottom:10, padding:16, backgroundColor:'rgba(201,168,76,0.1)', borderRadius:18, borderWidth:1, borderColor:'rgba(201,168,76,0.35)' }}>
            <Text style={[T.bodyMd, { marginBottom:10 }]}>
              Checkout was closed before payment completed. Your seats are still held — you can safely resume.
            </Text>
            <CustomButton
              title={inFlight ? 'Checking...' : 'Resume Payment'}
              onPress={resumePayment}
              disabled={inFlight}
              buttonColor="gold"
            />
          </View>
        )}

        {paymentUiState === 'closed' && (
          <View style={{ marginHorizontal:20, marginBottom:10, padding:16, backgroundColor:'rgba(212,70,70,0.08)', borderRadius:18, borderWidth:1, borderColor:'rgba(212,70,70,0.3)' }}>
            <Text style={T.bodyMd}>This booking's seat hold has ended. Please search again to book fresh seats.</Text>
          </View>
        )}

        <CustomButton
          title={loading ? 'Processing...' : `Confirm & Pay ₹${fareAmount * selectedSeats.length}`}
          onPress={handleConfirm}
          disabled={loading || inFlight || selectedSeats.length === 0 || !tripBookable || paymentUiState === 'retry_available' || paymentUiState === 'closed'}
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
                <TouchableOpacity onPress={() => { setAssignModalVisible(false); setTempSeat(null); }}><Ionicons name="close" size={24} color={C.textSecondary} /></TouchableOpacity>
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
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor={C.textMuted} value={guestForm.full_name} onChangeText={t => setGuestForm({...guestForm, full_name:t})} maxLength={120} />
              {guestErrors.full_name && <Text style={styles.errorText}>{guestErrors.full_name}</Text>}
              <TextInput style={styles.input} placeholder="Phone" placeholderTextColor={C.textMuted} value={guestForm.phone} onChangeText={t => setGuestForm({...guestForm, phone:t})} keyboardType="phone-pad" maxLength={20} />
              {guestErrors.phone && <Text style={styles.errorText}>{guestErrors.phone}</Text>}
              <TextInput style={styles.input} placeholder="Email (optional)" placeholderTextColor={C.textMuted} value={guestForm.email} onChangeText={t => setGuestForm({...guestForm, email:t})} autoCapitalize="none" maxLength={255} />
              {guestErrors.email && <Text style={styles.errorText}>{guestErrors.email}</Text>}
              <TextInput style={styles.input} placeholder="Relationship (optional)" placeholderTextColor={C.textMuted} value={guestForm.relationship_label} onChangeText={t => setGuestForm({...guestForm, relationship_label:t})} maxLength={80} />
              <View style={{ flexDirection:'row', gap:12, marginTop:16 }}>
                <TouchableOpacity onPress={() => setGuestModalVisible(false)} style={{ flex:1, backgroundColor:C.surfaceHigh, borderRadius:30, paddingVertical:14, alignItems:'center', borderWidth:1, borderColor:C.border }}>
                  <Text style={[T.bodyMd, { fontWeight:'bold' }]}>Cancel</Text>
                </TouchableOpacity>
                <CustomButton title="Assign" onPress={assignGuest} style={{ flex:1 }} buttonColor="gold" />
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
  input: { backgroundColor: C.surfaceUp, borderWidth:1, borderColor:C.border, borderRadius:14, padding:12, color:C.textPrimary, marginBottom:12 },
  errorText: { color: C.red, fontSize: 12, marginTop: -8, marginBottom: 10 },
};