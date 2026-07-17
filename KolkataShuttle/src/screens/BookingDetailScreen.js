import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator,
  Share, Dimensions, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import MapView, { Marker } from 'react-native-maps';
import Header from '../components/Header';
import AnimatedButton from '../components/AnimatedButton';
import {
  getBookingSessionDetail,
  getScheduledTripDetail,
  getDriverVehicleInfo,
  getBookingQR,
  cancelBookingSession,
  cancelBookingSessionSeat,
  createRating,
  getBookingRating,
  getBookingSessionCurrentStatus,
  getBookingSessionLiveLocation,
} from '../services/bookingApi';
import { eventEmitter } from '../utils/eventEmitter';
import { C, T } from '../styles/design';

const { width: screenWidth } = Dimensions.get('window');

const GlassCard = ({ children, style }) => (
  <View style={[{ backgroundColor: C.surfaceUp, borderRadius: 20, borderWidth: 1, borderColor: C.border, overflow: 'hidden', padding: 18 }, style]}>
    {children}
  </View>
);

const renderStars = (rating, size = 13) => {
  const numeric = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Ionicons key={i} name={i <= Math.round(numeric) ? 'star' : 'star-outline'} size={size} color={C.gold} />
      ))}
    </View>
  );
};

// Doc §7.3: prefer effective_status for user-facing payment copy.
const effectivePaymentStatusLabel = (status) => {
  switch (status) {
    case 'created': return 'Payment initiated';
    case 'paid': return 'Paid';
    case 'failed': return 'Payment failed';
    case 'refunded': return 'Refunded';
    case 'refund_pending': return 'Refund pending';
    default: return 'N/A';
  }
};

// Doc §7.5: recommended per-seat refund copy.
const refundStatusLabel = (refund) => {
  if (!refund) return null;
  switch (refund.status) {
    case 'pending':
    case 'processing':
      return 'Refund in progress';
    case 'succeeded':
      return refund.razorpay_refund_id ? `Refund issued (${refund.razorpay_refund_id})` : 'Refund issued';
    case 'failed':
      return 'Refund retry pending';
    case 'skipped':
      return 'No refund required';
    default:
      return refund.status;
  }
};

export default function BookingDetailScreen({ route, navigation }) {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState(null);
  const [scheduledTrip, setScheduledTrip] = useState(null);
  const [driverVehicleInfo, setDriverVehicleInfo] = useState(null);
  const [qrByBookingId, setQrByBookingId] = useState({});
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancellingSeat, setCancellingSeat] = useState(null);
  const [existingRating, setExistingRating] = useState(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [tripRating, setTripRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [liveStatus, setLiveStatus] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);

  useEffect(() => {
    loadData();

    const FULL_RELOAD_RESOURCES = new Set(['bookings', 'booking_sessions', 'current_bookings']);
    const LIVE_ONLY_RESOURCES = new Set(['trip_status', 'trip_location']);

    const handleRefresh = (payload) => {
      const resources = payload?.resources || payload?.keys || [];
      const data = payload?.events?.[payload.events.length - 1]?.data || {};
      // If the event carries a booking_session_id, only reload when it
      // matches this screen's session (or when the id was omitted, which
      // per the contract means "refresh the session and its children").
      if (data.booking_session_id && data.booking_session_id !== sessionId) return;

      if (resources.some((r) => FULL_RELOAD_RESOURCES.has(r))) {
        loadData();
      } else if (resources.some((r) => LIVE_ONLY_RESOURCES.has(r))) {
        // Scan/location events don't change booking/session shape — just
        // refresh the live bus-movement card, no need to refetch QR/rating.
        loadLiveStatus();
      }
    };
    eventEmitter.on('refreshData', handleRefresh);
    return () => eventEmitter.off('refreshData', handleRefresh);
  }, [sessionId]);

  const loadLiveStatus = async () => {
    try {
      const status = await getBookingSessionCurrentStatus(sessionId);
      setLiveStatus(status);
    } catch (err) {
      // No live status yet (trip not started) or no longer available
      // (trip ended) — not worth surfacing as an error.
      setLiveStatus(null);
    }
    try {
      const location = await getBookingSessionLiveLocation(sessionId);
      setLiveLocation(location);
    } catch (err) {
      setLiveLocation(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // 1. Fetch session detail (the whole group)
      const sessionRes = await getBookingSessionDetail(sessionId);
      const sessionData = sessionRes.booking_session || sessionRes;
      setSession(sessionData);

      // 2. Fetch scheduled trip details (for stop names, times, driver/vehicle)
      const tripId = sessionData.scheduled_trip_id;
      if (tripId) {
        const tripData = await getScheduledTripDetail(tripId);
        setScheduledTrip(tripData);
        const driverInfo = await getDriverVehicleInfo(tripId);
        setDriverVehicleInfo(driverInfo);
      }

      // 3. Fetch QR for each active seat (booked or boarded) – using booking.id, not sessionId
      const activeBookings = sessionData.bookings?.filter(b =>
        b.booking_status === 'booked' || b.booking_status === 'boarded'
      ) || [];
      const qrMap = {};
      await Promise.all(
        activeBookings.map(async (booking) => {
          try {
            const qr = await getBookingQR(booking.id);
            qrMap[booking.id] = qr;
          } catch (e) { console.log(`QR not available for booking ${booking.id}`); }
        })
      );
      setQrByBookingId(qrMap);

      // 4. Rating – per completed booking
      const completedBooking = sessionData.bookings?.find(b => b.booking_status === 'completed');
      if (completedBooking) {
        try {
          const rating = await getBookingRating(completedBooking.id);
          setExistingRating(rating);
        } catch (e) {}
      }

      // 5. Live bus movement (current/prev/next stoppage) – best effort,
      // only meaningful while the trip is actually in progress.
      await loadLiveStatus();
    } catch (err) {
      Alert.alert('Error', err.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  // Derive the actual pickup/dropoff stop names using session snapshot IDs
  const getPickupDropoff = () => {
    if (!scheduledTrip || !session) return { pickup: 'Pickup', dropoff: 'Dropoff' };
    const stops = scheduledTrip.stops || [];
    let pickupStop = stops.find(s => s.stop?.id === session.pickup_stop_id);
    if (!pickupStop && session.pickup_sequence_no_snapshot) {
      pickupStop = stops.find(s => s.sequence_no === session.pickup_sequence_no_snapshot);
    }
    let dropoffStop = stops.find(s => s.stop?.id === session.dropoff_stop_id);
    if (!dropoffStop && session.dropoff_sequence_no_snapshot) {
      dropoffStop = stops.find(s => s.sequence_no === session.dropoff_sequence_no_snapshot);
    }
    return {
      pickup: pickupStop?.stop?.name || 'Pickup',
      dropoff: dropoffStop?.stop?.name || 'Dropoff',
      pickupTime: pickupStop?.planned_time_at_stop,
      dropoffTime: dropoffStop?.planned_time_at_stop,
    };
  };

  const { pickup, dropoff, pickupTime, dropoffTime } = getPickupDropoff();

  // Derive prev/current/next stoppage from the live current-status endpoint
  // (current_progress_stop) mapped against the trip's ordered stop list.
  const getStoppageProgress = () => {
    const item = liveStatus?.items?.[0];
    const progressStop = item?.current_progress_stop;
    if (!progressStop || !scheduledTrip?.stops?.length) return null;

    const orderedStops = [...scheduledTrip.stops].sort((a, b) => a.sequence_no - b.sequence_no);
    const index = orderedStops.findIndex((s) =>
      (progressStop.sequence_no != null && s.sequence_no === progressStop.sequence_no) ||
      (progressStop.stop?.id && s.stop?.id === progressStop.stop.id)
    );
    if (index === -1) return null;

    return {
      prev: index > 0 ? orderedStops[index - 1] : null,
      current: orderedStops[index],
      next: index < orderedStops.length - 1 ? orderedStops[index + 1] : null,
      tripStatus: item.trip_status,
      estimatedArrival: item.estimated_arrival_time,
    };
  };

  const stoppageProgress = getStoppageProgress();
  const liveLocationItem = liveLocation?.items?.[0];
  const hasLiveLocation = !!(liveLocationItem?.tracking_active && liveLocationItem.last_lat && liveLocationItem.last_lng);

  const handleCancelWholeSession = async () => {
    Alert.alert('Cancel Entire Booking', 'All seats will be cancelled and refund requested.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes', style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelBookingSession(sessionId);
            Alert.alert('Cancelled', 'Booking session cancelled. Refund will be processed.');
            navigation.goBack();
          } catch (err) { Alert.alert('Error', err.message); }
          finally { setCancelling(false); }
        },
      },
    ]);
  };

  const handleCancelSeat = async (bookingId) => {
    Alert.alert('Cancel Seat', 'Only this seat will be cancelled. Refund will be requested.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes', style: 'destructive',
        onPress: async () => {
          setCancellingSeat(bookingId);
          try {
            await cancelBookingSessionSeat(sessionId, bookingId);
            Alert.alert('Cancelled', 'Seat cancelled successfully.');
            loadData();
          } catch (err) { Alert.alert('Error', err.message); }
          finally { setCancellingSeat(null); }
        },
      },
    ]);
  };

  const handleSubmitRating = async () => {
    if (!session?.bookings?.length) return;
    const completedBooking = session.bookings.find(b => b.booking_status === 'completed');
    const bookingId = completedBooking ? completedBooking.id : session.bookings[0].id;
    setSubmittingRating(true);
    try {
      await createRating(bookingId, {
        trip_rating: tripRating,
        driver_rating: driverRating,
        review_text: reviewText,
      });
      Alert.alert('Thank you!', 'Rating submitted.');
      setRatingModalVisible(false);
      loadData();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setSubmittingRating(false); }
  };

  if (loading) return <ActivityIndicator size="large" color={C.gold} style={{ flex:1, backgroundColor:C.bg }} />;
  if (!session) return null;

  const canCancelWhole = session.status === 'confirmed' && scheduledTrip?.planned_start_at && new Date(scheduledTrip.planned_start_at) > new Date();
  const payment = session.payments?.[0];
  const refundedAmount = payment ? parseFloat(payment.refunded_amount) : 0;
  const hasCompletedBooking = session.bookings?.some(b => b.booking_status === 'completed') && !existingRating;

  return (
    <View style={{ flex:1, backgroundColor:C.bg, paddingTop: insets.top }}>
      <Header title="Booking Details" />
      <ScrollView contentContainerStyle={{ paddingHorizontal:20, paddingBottom:40, gap:16 }}>
        {/* Status Card */}
        <GlassCard>
          <Text style={T.headingSm}>STATUS</Text>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={{ fontSize:24, fontWeight:'700', color:C.textPrimary, textTransform:'capitalize' }}>{session.status}</Text>
            {canCancelWhole && !cancelling && (
              <TouchableOpacity onPress={handleCancelWholeSession}>
                <Ionicons name="close-circle-outline" size={28} color={C.red} />
              </TouchableOpacity>
            )}
          </View>
          {session.payment_hold_expires_at && (
            <Text style={{ color:C.gold, fontSize:11, marginTop:6 }}>
              Hold expires: {new Date(session.payment_hold_expires_at).toLocaleString()}
            </Text>
          )}
        </GlassCard>

        {/* Payment Card */}
        <GlassCard>
          <Text style={T.headingSm}>PAYMENT</Text>
          {parseFloat(session.total_tax_amount) > 0 && (
            <>
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                <Text style={T.bodySm}>Taxable value</Text>
                <Text style={T.bodySm}>₹{parseFloat(session.total_taxable_amount)}</Text>
              </View>
              {parseFloat(session.total_cgst_amount) > 0 && (
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                  <Text style={T.bodySm}>CGST</Text>
                  <Text style={T.bodySm}>₹{parseFloat(session.total_cgst_amount)}</Text>
                </View>
              )}
              {parseFloat(session.total_sgst_amount) > 0 && (
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                  <Text style={T.bodySm}>SGST</Text>
                  <Text style={T.bodySm}>₹{parseFloat(session.total_sgst_amount)}</Text>
                </View>
              )}
              {parseFloat(session.total_igst_amount) > 0 && (
                <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                  <Text style={T.bodySm}>IGST</Text>
                  <Text style={T.bodySm}>₹{parseFloat(session.total_igst_amount)}</Text>
                </View>
              )}
              <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
                <Text style={T.bodySm}>Total tax ({session.gst_inclusive_snapshot ? 'included' : 'added'})</Text>
                <Text style={T.bodySm}>₹{parseFloat(session.total_tax_amount)}</Text>
              </View>
              <View style={{ height:1, backgroundColor:C.border, marginVertical:6 }} />
            </>
          )}
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
            <Text style={T.bodySm}>Total amount</Text>
            <Text style={T.bodyMd}>₹{parseFloat(session.total_fare_amount)}</Text>
          </View>
          {refundedAmount > 0 && (
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginBottom:6 }}>
              <Text style={T.bodySm}>Refunded amount</Text>
              <Text style={[T.bodyMd, { color:C.gold }]}>₹{refundedAmount}</Text>
            </View>
          )}
          <Text style={T.bodySm}>Payment status: {effectivePaymentStatusLabel(payment?.effective_status)}</Text>
        </GlassCard>

        {/* Driver & Vehicle Card */}
        {driverVehicleInfo && (
          <GlassCard>
            <Text style={[T.headingSm, { marginBottom:8 }]}>DRIVER & VEHICLE</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
              <Ionicons name="person-circle-outline" size={18} color={C.textSecondary} />
              <Text style={T.bodyMd}>Driver: {driverVehicleInfo.driver_name || 'N/A'}</Text>
            </View>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
              {renderStars(parseFloat(driverVehicleInfo.driver_average_rating), 14)}
              <Text style={T.bodySm}>
                {driverVehicleInfo.driver_average_rating != null && !isNaN(parseFloat(driverVehicleInfo.driver_average_rating))
                  ? `${parseFloat(driverVehicleInfo.driver_average_rating).toFixed(1)} (${driverVehicleInfo.driver_rating_count} ratings)`
                  : 'New driver'}
              </Text>
            </View>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
              <Ionicons name="car-outline" size={18} color={C.textSecondary} />
              <Text style={T.bodyMd}>{driverVehicleInfo.vehicle_name || 'Bus'} • {driverVehicleInfo.vehicle_registration_number || ''}</Text>
            </View>
            <Text style={[T.bodySm, { marginLeft:26 }]}>Total seats: {driverVehicleInfo.vehicle_total_seat || '?'}</Text>
          </GlassCard>
        )}

        {/* Trip Details Card (with correct pickup/dropoff) */}
        <GlassCard>
          <Text style={[T.headingSm, { marginBottom:12 }]}>TRIP DETAILS</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 }}>
            <Ionicons name="time-outline" size={18} color={C.textSecondary} />
            <Text style={T.bodyMd}>
              Trip starts: {scheduledTrip?.planned_start_at ? new Date(scheduledTrip.planned_start_at).toLocaleString() : 'Not scheduled'}
            </Text>
          </View>
          <View style={{ flexDirection:'row', alignItems:'center', gap:8, marginBottom:6 }}>
            <Ionicons name="navigate-outline" size={18} color={C.textSecondary} />
            <Text style={T.bodyMd}>{pickup} → {dropoff}</Text>
          </View>
          {pickupTime && <Text style={[T.bodySm, { marginLeft:26 }]}>Pickup time: {new Date(pickupTime).toLocaleTimeString()}</Text>}
          {dropoffTime && <Text style={[T.bodySm, { marginLeft:26 }]}>Dropoff time: {new Date(dropoffTime).toLocaleTimeString()}</Text>}
        </GlassCard>

        {/* Live Bus Movement Card – prev/current/next stoppage from the
            current-status + live-location endpoints, kept fresh by the
            passenger API refresh WebSocket (trip_status / trip_location). */}
        {stoppageProgress && (
          <GlassCard>
            <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <Text style={T.headingSm}>LIVE BUS MOVEMENT</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
                <View style={{
                  width:8, height:8, borderRadius:4,
                  backgroundColor: hasLiveLocation ? C.green : C.textMuted,
                }} />
                <Text style={[T.bodySm, { color: hasLiveLocation ? C.green : C.textMuted }]}>
                  {hasLiveLocation ? 'Live' : 'Location unavailable'}
                </Text>
              </View>
            </View>

            {hasLiveLocation && (
              <View style={{ height:160, borderRadius:16, overflow:'hidden', marginBottom:16, borderWidth:1, borderColor:C.border }}>
                <MapView
                  style={{ flex:1 }}
                  region={{
                    latitude: parseFloat(liveLocationItem.last_lat),
                    longitude: parseFloat(liveLocationItem.last_lng),
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: parseFloat(liveLocationItem.last_lat),
                      longitude: parseFloat(liveLocationItem.last_lng),
                    }}
                    title="Bus"
                  />
                </MapView>
              </View>
            )}

            {[
              { key: 'prev', label: 'Previous stop', stop: stoppageProgress.prev, icon: 'checkmark-circle', color: C.textMuted, fallback: 'Trip start' },
              { key: 'current', label: 'Current stop', stop: stoppageProgress.current, icon: 'bus', color: C.gold, fallback: '—' },
              { key: 'next', label: 'Next stop', stop: stoppageProgress.next, icon: 'arrow-forward-circle-outline', color: C.textSecondary, fallback: 'End of route' },
            ].map(({ key, label, stop, icon, color, fallback }, idx) => (
              <View key={key} style={{ flexDirection:'row', marginBottom: idx < 2 ? 14 : 0 }}>
                <View style={{ width:32, alignItems:'center' }}>
                  <View style={{
                    width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center',
                    backgroundColor: key === 'current' ? C.goldDim : 'transparent',
                    borderWidth: key === 'current' ? 1 : 0, borderColor:'rgba(201,168,76,0.4)',
                  }}>
                    <Ionicons name={icon} size={16} color={color} />
                  </View>
                  {idx < 2 && <View style={{ flex:1, width:2, minHeight:14, backgroundColor:C.border, marginVertical:4 }} />}
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[T.bodySm, { color:C.textMuted }]}>{label}</Text>
                  <Text style={key === 'current' ? [T.bodyMd, { color:C.gold }] : T.bodyMd}>
                    {stop?.stop?.name || fallback}
                  </Text>
                </View>
              </View>
            ))}

            {stoppageProgress.estimatedArrival && (
              <Text style={[T.bodySm, { color:C.gold, marginTop:14 }]}>
                Est. arrival at next stop: {new Date(stoppageProgress.estimatedArrival).toLocaleTimeString()}
              </Text>
            )}
          </GlassCard>
        )}

        {/* Seats Card – one card per seat, each with its own QR */}
        <GlassCard>
          <Text style={[T.headingSm, { marginBottom:12 }]}>SEATS</Text>
          {session.bookings?.map(booking => {
            const isSelfBooking = !booking.traveller_profile_id && !booking.traveller_name_snapshot && booking.traveller_relationship_label_snapshot === 'Self';
            const travellerName = isSelfBooking ? 'You' : (booking.traveller_name_snapshot || 'N/A');
            const relationship = booking.traveller_relationship_label_snapshot || (isSelfBooking ? 'Self' : null);
            const qr = qrByBookingId[booking.id];
            const isActive = booking.booking_status === 'booked' || booking.booking_status === 'boarded';
            return (
              <View key={booking.id} style={{ marginBottom:20, paddingBottom:16, borderBottomWidth:1, borderColor:C.border }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                  <Text style={T.bodyLg}>Seat {booking.seat_number}</Text>
                  <Text style={{ color: booking.booking_status === 'booked' ? C.green : (booking.booking_status === 'cancelled' ? C.red : C.textSecondary) }}>
                    {booking.booking_status.toUpperCase()}
                  </Text>
                </View>
                <Text style={T.bodySm}>Traveller: {travellerName}</Text>
                {relationship && <Text style={T.bodySm}>Relationship: {relationship}</Text>}
                {booking.otp && (
                  <View style={{
                    marginTop: 12,
                    backgroundColor: C.gold,
                    borderRadius: 16,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    alignItems: 'center',
                  }}>
                    <Text style={{ color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 }}>
                      YOUR BOARDING OTP
                    </Text>
                    <Text style={[T.mono, { color: '#000', fontSize: 36, fontWeight: '900', letterSpacing: 8 }]}>
                      {booking.otp}
                    </Text>
                  </View>
                )}
                {booking.booking_status === 'booked' && canCancelWhole && (
                  <TouchableOpacity onPress={() => handleCancelSeat(booking.id)} disabled={cancellingSeat === booking.id} style={{ marginTop:8 }}>
                    <Text style={{ color:C.red }}>Cancel this seat</Text>
                  </TouchableOpacity>
                )}
                {booking.refund && <Text style={{ color:C.gold, marginTop:4 }}>{refundStatusLabel(booking.refund)}</Text>}
                {isActive && qr?.qr_token && (
                  <View style={{ alignItems: 'center', marginTop: 12 }}>
                    <Text style={[T.headingSm, { marginBottom: 6 }]}>Boarding Pass - Seat {booking.seat_number}</Text>
                    <QRCode value={qr.qr_token} size={160} color={C.textPrimary} backgroundColor="transparent" />
                    <TouchableOpacity
                      onPress={async () => { try { await Share.share({ message: qr.qr_token }); } catch(e) {} }}
                      style={{ marginTop: 8 }}
                    >
                      <LinearGradient colors={[C.surfaceHigh, C.surfaceHigh]} style={{ paddingVertical:8, paddingHorizontal:16, flexDirection:'row', alignItems:'center', borderRadius:20, borderWidth:1, borderColor:C.border, gap:6 }}>
                        <Ionicons name="share-outline" size={14} color={C.gold} />
                        <Text style={[T.bodySm, { color:C.gold }]}>Share</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </GlassCard>

        {hasCompletedBooking && (
          <TouchableOpacity onPress={() => setRatingModalVisible(true)} style={{ marginBottom:8, borderRadius:18, overflow:'hidden' }}>
            <LinearGradient colors={[C.goldDim, C.goldDim]} style={{ paddingVertical:14, flexDirection:'row', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:C.gold, borderRadius:18 }}>
              <Ionicons name="star-outline" size={20} color={C.gold} />
              <Text style={[T.bodyMd, { color:C.gold, marginLeft:8 }]}>Rate your trip</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Rating Modal (unchanged) */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'center', alignItems:'center', padding:24 }}>
          <LinearGradient colors={[C.surface, C.surfaceUp]} style={{ borderRadius:28, padding:24, width:screenWidth-48, borderWidth:1, borderColor:C.border }}>
            <Text style={T.displayMd}>Rate your trip</Text>
            <Text style={[T.headingSm, { marginTop:12, marginBottom:6 }]}>Trip rating</Text>
            <View style={{ flexDirection:'row', justifyContent:'center', marginBottom:4 }}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setTripRating(star)}>
                  <Ionicons name={star <= tripRating ? 'star' : 'star-outline'} size={32} color={C.gold} style={{ marginHorizontal:4 }} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[T.headingSm, { marginTop:12, marginBottom:6 }]}>Driver rating</Text>
            <View style={{ flexDirection:'row', justifyContent:'center', marginBottom:4 }}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setDriverRating(star)}>
                  <Ionicons name={star <= driverRating ? 'star' : 'star-outline'} size={32} color={C.gold} style={{ marginHorizontal:4 }} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={{ borderWidth:1, borderColor:C.border, backgroundColor:C.surfaceUp, borderRadius:16, padding:14, color:C.textPrimary, marginTop:16, textAlignVertical:'top' }}
              placeholder="Write a review (optional)"
              placeholderTextColor={C.textMuted}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={3}
            />
            <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:20, gap:12 }}>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)} style={{ flex:1, paddingVertical:14, borderRadius:16, backgroundColor:C.surfaceHigh, alignItems:'center', borderWidth:1, borderColor:C.border }}>
                <Text style={T.bodyMd}>Cancel</Text>
              </TouchableOpacity>
              <AnimatedButton title={submittingRating ? 'Submitting...' : 'Submit'} onPress={handleSubmitRating} disabled={submittingRating} style={{ flex:1 }} />
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}