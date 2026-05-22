import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import Header from '../components/Header';
import AnimatedButton from '../components/AnimatedButton';
import {
  getBookingCurrentStatus,
  getBookingDetail,
  cancelBooking,
  getBookingQR,
  createRating,
  getBookingRating,
  getDriverVehicleInfo,
} from '../services/bookingApi';

const { width: screenWidth } = Dimensions.get('window');

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0A0F',
  surface: '#13131A',
  surfaceUp: '#1C1C26',
  surfaceHigh: '#242432',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.13)',
  gold: '#C9A84C',
  goldLight: '#E8C76B',
  goldDim: 'rgba(201,168,76,0.18)',
  white: '#FFFFFF',
  textPrimary: '#F0EFE8',
  textSecondary: '#9997A0',
  textMuted: '#5C5A65',
  green: '#34C97E',
  greenDim: 'rgba(52,201,126,0.15)',
  blue: '#4A90D9',
  blueDim: 'rgba(74,144,217,0.15)',
  red: '#E05252',
};

// ─── TYPOGRAPHY ─────────────────────────────────────────────────────────────────
const T = StyleSheet.create({
  displayLg: { fontSize: 34, fontWeight: '800', color: C.textPrimary, letterSpacing: -1.2, lineHeight: 40 },
  displayMd: { fontSize: 26, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.8 },
  headingSm: { fontSize: 13, fontWeight: '700', color: C.textSecondary, letterSpacing: 1.6, textTransform: 'uppercase' },
  bodyLg: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  bodyMd: { fontSize: 14, fontWeight: '500', color: C.textPrimary },
  bodySm: { fontSize: 12, fontWeight: '400', color: C.textSecondary },
  mono: { fontSize: 11, fontWeight: '600', color: C.gold, letterSpacing: 0.5 },
});

// ─── GLASS CARD WRAPPER ─────────────────────────────────────────────────────────
const GlassCard = ({ children, style, noBorder, goldBorder = false }) => (
  <View
    style={[
      {
        backgroundColor: C.surfaceUp,
        borderRadius: 20,
        borderWidth: noBorder ? 0 : 1,
        borderColor: goldBorder ? C.gold : C.border,
        overflow: 'hidden',
      },
      style,
    ]}
  >
    {children}
  </View>
);

// ─── GOLD TAG (e.g., for AC) ──────────────────────────────────────────────────
const GoldTag = ({ label }) => (
  <View
    style={{
      backgroundColor: C.goldDim,
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: 'rgba(201,168,76,0.3)',
    }}
  >
    <Text style={T.mono}>{label}</Text>
  </View>
);

// ─── HELPER: STAR RATING RENDERER ──────────────────────────────────────────────
const renderStars = (rating, size = 13) => {
  const numeric = typeof rating === 'number' && !isNaN(rating) ? rating : 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(numeric) ? 'star' : 'star-outline'}
          size={size}
          color={C.gold}
        />
      ))}
    </View>
  );
};

export default function BookingDetailScreen({ route, navigation }) {
  const { bookingId } = route.params;
  const insets = useSafeAreaInsets();

  const [status, setStatus] = useState(null);
  const [booking, setBooking] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [tripRating, setTripRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [existingRating, setExistingRating] = useState(null);
  const [driverVehicleInfo, setDriverVehicleInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      let bookingStatus = null;
      try {
        const live = await getBookingCurrentStatus(bookingId);
        setStatus(live);
        bookingStatus = live.booking_status;
        if (live.scheduled_trip_id) {
          const info = await getDriverVehicleInfo(live.scheduled_trip_id);
          setDriverVehicleInfo(info);
        }
      } catch (e) {
        const bookingData = await getBookingDetail(bookingId);
        setBooking(bookingData);
        bookingStatus = bookingData.booking_status;
        if (bookingData.scheduled_trip_id) {
          const info = await getDriverVehicleInfo(bookingData.scheduled_trip_id);
          setDriverVehicleInfo(info);
        }
      }

      const isActive =
        bookingStatus === 'booked' ||
        bookingStatus === 'pending_payment' ||
        bookingStatus === 'in_progress';
      if (isActive) {
        try {
          const qr = await getBookingQR(bookingId);
          setQrData(qr);
        } catch (err) {
          console.log('QR not available');
        }
      }

      try {
        const rating = await getBookingRating(bookingId);
        setExistingRating(rating);
      } catch (e) {}
    } catch (error) {
      Alert.alert('Error', error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    Alert.alert('Cancel Booking', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelBooking(bookingId);
            Alert.alert('Cancelled', 'Booking cancelled.');
            navigation.goBack();
          } catch (error) {
            Alert.alert('Error', error.message);
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  const handleShareQR = async () => {
    if (qrData?.qr_token) {
      try {
        await Share.share({ message: qrData.qr_token });
      } catch (e) {}
    }
  };

  const handleSubmitRating = async () => {
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
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: C.bg }]}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  const displayData = status || booking;
  const trip = displayData?.scheduled_trip || displayData;
  const canCancel =
    displayData?.booking_status === 'booked' ||
    displayData?.booking_status === 'pending_payment';
  const canRate = displayData?.booking_status === 'completed' && !existingRating;
  const liveProgress = status;

  const pickupStopName =
    displayData?.pickup_stop?.stop?.name ||
    displayData?.pickup_stop?.name ||
    'Pickup';
  const dropoffStopName =
    displayData?.dropoff_stop?.stop?.name ||
    displayData?.dropoff_stop?.name ||
    'Dropoff';
  const tripStartTime = trip?.planned_start_at
    ? new Date(trip.planned_start_at).toLocaleString()
    : 'Not scheduled';

  const ratingValue = driverVehicleInfo?.driver_average_rating;
  const ratingNum =
    ratingValue != null && !isNaN(parseFloat(ratingValue)) ? parseFloat(ratingValue) : null;
  const hasRating = ratingNum !== null;
  const ratingCount = driverVehicleInfo?.driver_rating_count || 0;

  const existingTripRating = existingRating?.trip_rating ? Number(existingRating.trip_rating) : 0;
  const existingDriverRating = existingRating?.driver_rating ? Number(existingRating.driver_rating) : 0;

  const otp = displayData?.otp || liveProgress?.otp;
  const seatNumber = displayData?.seat_number || trip?.seat_number;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: C.bg }]}>
      <Header title="Booking Details" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Card */}
        <GlassCard style={styles.card}>
          <Text style={T.headingSm}>STATUS</Text>
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { textTransform: 'capitalize' }]}>
              {displayData?.booking_status?.replace('_', ' ')}
            </Text>
            {canCancel && !cancelling && (
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close-circle-outline" size={28} color={C.red} />
              </TouchableOpacity>
            )}
          </View>
          {displayData?.payment_hold_expires_at && (
            <Text style={styles.holdExpiry}>
              Payment hold expires:{' '}
              {new Date(displayData.payment_hold_expires_at).toLocaleString()}
            </Text>
          )}
          {cancelling && <ActivityIndicator size="small" color={C.red} style={{ marginTop: 8 }} />}
        </GlassCard>

        {/* OTP Card */}
        {otp && (
          <GlassCard style={styles.card}>
            <Text style={T.headingSm}>BOARDING OTP</Text>
            <Text style={styles.otp}>{otp}</Text>
            <Text style={T.bodySm}>Show this to the driver</Text>
          </GlassCard>
        )}

        {/* Driver & Vehicle Info */}
        {driverVehicleInfo && (
          <GlassCard style={styles.card}>
            <Text style={[T.headingSm, { marginBottom: 8 }]}>DRIVER & VEHICLE</Text>
            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={18} color={C.textSecondary} />
              <Text style={T.bodyMd}>Driver: {driverVehicleInfo.driver_name || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              {renderStars(hasRating ? ratingNum : 0, 14)}
              <Text style={T.bodySm}>
                {hasRating
                  ? ` ${ratingNum.toFixed(1)} (${ratingCount} ratings)`
                  : ` New (${ratingCount} ratings)`}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={18} color={C.textSecondary} />
              <Text style={T.bodyMd}>
                {driverVehicleInfo.vehicle_name || 'Bus'} •{' '}
                {driverVehicleInfo.vehicle_registration_number || ''}
              </Text>
            </View>
            {driverVehicleInfo.vehicle_model && (
              <Text style={[T.bodySm, { marginLeft: 26, marginTop: 2 }]}>
                {driverVehicleInfo.vehicle_model} ({driverVehicleInfo.vehicle_color})
              </Text>
            )}
            <Text style={[T.bodySm, { marginLeft: 26 }]}>
              Total seats: {driverVehicleInfo.vehicle_total_seat || '?'}
            </Text>
          </GlassCard>
        )}

        {/* Trip Details */}
        <GlassCard style={styles.card}>
          <View style={styles.tripHeader}>
            <Text style={T.headingSm}>TRIP DETAILS</Text>
            {trip?.route?.has_ac && <GoldTag label="AC" />}
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color={C.textSecondary} />
            <Text style={T.bodyMd}>Trip starts: {tripStartTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="navigate-outline" size={18} color={C.textSecondary} />
            <Text style={T.bodyMd}>
              {trip?.trip_from_stop?.name || 'Start'} → {trip?.trip_to_stop?.name || 'End'}
            </Text>
          </View>
        </GlassCard>

        {/* Your Booking (Seat, Pickup/Dropoff) */}
        <GlassCard style={styles.card}>
          <Text style={[T.headingSm, { marginBottom: 12 }]}>YOUR BOOKING</Text>
          <View style={styles.bookingRow}>
            <View style={styles.iconCircleGold}>
              <Ionicons name="log-in-outline" size={14} color={C.gold} />
            </View>
            <Text style={T.bodyMd}>Pickup: {pickupStopName}</Text>
          </View>
          <View style={styles.bookingRow}>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="log-out-outline" size={14} color={C.blue} />
            </View>
            <Text style={T.bodyMd}>Dropoff: {dropoffStopName}</Text>
          </View>
          <View style={styles.bookingRow}>
            <View style={styles.iconCircleGold}>
              <Ionicons name="grid-outline" size={14} color={C.gold} />
            </View>
            <Text style={T.bodyMd}>Seat: {seatNumber || 'Not assigned'}</Text>
          </View>
        </GlassCard>

        {/* Live Progress (with timeline style) */}
        {liveProgress && (
          <GlassCard style={styles.card}>
            <Text style={[T.headingSm, { marginBottom: 12 }]}>LIVE TRIP STATUS</Text>
            <View style={styles.liveRow}>
              <Text style={T.bodySm}>
                Boarding: {liveProgress.boarding_scan_completed ? '✅ Completed' : '⏳ Not yet'}
              </Text>
              <Text style={T.bodySm}>
                Drop: {liveProgress.drop_scan_completed ? '✅ Completed' : '⏳ Not yet'}
              </Text>
            </View>
            {liveProgress.trip_completed && (
              <Text style={[styles.completedText, { marginBottom: 8 }]}>Trip completed</Text>
            )}
            {liveProgress.current_progress_stop && (
              <View style={styles.currentStop}>
                <Text style={T.bodySm}>Current stop:</Text>
                <Text style={[T.bodyMd, { color: C.gold }]}>
                  {liveProgress.current_progress_stop.stop?.name}
                </Text>
                <Text style={T.bodySm}>
                  Status: {liveProgress.current_progress_stop.event_status}
                </Text>
                {liveProgress.current_progress_stop.actual_time && (
                  <Text style={T.bodySm}>
                    Actual time:{' '}
                    {new Date(liveProgress.current_progress_stop.actual_time).toLocaleTimeString()}
                  </Text>
                )}
              </View>
            )}

            {liveProgress.segment_stops && liveProgress.segment_stops.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[T.headingSm, { marginBottom: 12 }]}>YOUR SEGMENT STOPS</Text>
                {liveProgress.segment_stops.map((stop, idx) => {
                  let statusColor = C.textMuted;
                  let statusIcon = 'radio-button-off-outline';
                  if (stop.stop_status === 'boarded_here') {
                    statusColor = C.green;
                    statusIcon = 'checkmark-circle-outline';
                  } else if (stop.stop_status === 'dropped_here') {
                    statusColor = C.blue;
                    statusIcon = 'flag-outline';
                  } else if (stop.stop_status === 'arrived') {
                    statusColor = C.gold;
                    statusIcon = 'location-outline';
                  } else if (stop.stop_status === 'departed') {
                    statusColor = C.goldLight;
                    statusIcon = 'car-outline';
                  }
                  return (
                    <View key={stop.route_stop_id || idx} style={styles.stopTimeline}>
                      <Ionicons name={statusIcon} size={16} color={statusColor} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <View style={styles.stopHeader}>
                          <Text style={[T.bodyMd, { color: statusColor }]}>{stop.stop.name}</Text>
                          <Text style={T.bodySm}>
                            {stop.planned_time_at_stop
                              ? new Date(stop.planned_time_at_stop).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '--:--'}
                          </Text>
                        </View>
                        {stop.actual_arrival_time && (
                          <Text style={[T.bodySm, { color: C.green }]}>
                            Arrived: {new Date(stop.actual_arrival_time).toLocaleTimeString()}
                          </Text>
                        )}
                        {stop.actual_departure_time && (
                          <Text style={[T.bodySm, { color: C.blue }]}>
                            Departed: {new Date(stop.actual_departure_time).toLocaleTimeString()}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </GlassCard>
        )}

        {/* QR Code (Boarding Pass) */}
        {qrData && (
          <GlassCard style={[styles.card, styles.qrContainer]}>
            <Text style={[T.headingSm, { marginBottom: 8 }]}>BOARDING PASS</Text>
            <QRCode value={qrData.qr_token} size={180} color={C.textPrimary} backgroundColor="transparent" />
            <TouchableOpacity onPress={handleShareQR} style={styles.shareButton}>
              <LinearGradient colors={[C.surfaceHigh, C.surfaceHigh]} style={styles.shareGradient}>
                <Ionicons name="share-outline" size={16} color={C.gold} />
                <Text style={[T.bodySm, { color: C.gold, marginLeft: 6 }]}>Share QR</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        )}

        {/* Rating Section */}
        {canRate && (
          <TouchableOpacity onPress={() => setRatingModalVisible(true)} style={styles.rateButton}>
            <LinearGradient colors={[C.goldDim, C.goldDim]} style={styles.rateGradient}>
              <Ionicons name="star-outline" size={20} color={C.gold} />
              <Text style={[T.bodyMd, { color: C.gold, marginLeft: 8 }]}>Rate your trip</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        {existingRating && (
          <GlassCard style={styles.card}>
            <Text style={[T.headingSm, { marginBottom: 8 }]}>YOUR RATING</Text>
            <View style={styles.ratingRow}>
              {renderStars(existingTripRating, 18)}
              <Text style={T.bodyMd}>Trip</Text>
            </View>
            <View style={styles.ratingRow}>
              {renderStars(existingDriverRating, 18)}
              <Text style={T.bodyMd}>Driver</Text>
            </View>
            {existingRating.review_text ? (
              <Text style={[T.bodySm, { marginTop: 8 }]}>{existingRating.review_text}</Text>
            ) : null}
          </GlassCard>
        )}
      </ScrollView>

      {/* Rating Modal (Redesigned) */}
      <Modal visible={ratingModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={T.displayMd}>Rate your trip</Text>
            <Text style={[T.headingSm, { marginTop: 12, marginBottom: 6 }]}>Trip rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setTripRating(star)}>
                  <Ionicons
                    name={star <= tripRating ? 'star' : 'star-outline'}
                    size={32}
                    color={C.gold}
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[T.headingSm, { marginTop: 12, marginBottom: 6 }]}>Driver rating</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setDriverRating(star)}>
                  <Ionicons
                    name={star <= driverRating ? 'star' : 'star-outline'}
                    size={32}
                    color={C.gold}
                    style={{ marginHorizontal: 4 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Write a review (optional)"
              placeholderTextColor={C.textMuted}
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={3}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)} style={styles.modalCancel}>
                <Text style={T.bodyMd}>Cancel</Text>
              </TouchableOpacity>
              <AnimatedButton
                title={submittingRating ? 'Submitting...' : 'Submit'}
                onPress={handleSubmitRating}
                disabled={submittingRating}
                style={{ width: 100 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  card: { padding: 18 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  statusText: { fontSize: 24, fontWeight: '700', color: C.textPrimary },
  holdExpiry: { color: C.gold, fontSize: 11, marginTop: 6 },
  otp: { fontSize: 28, fontWeight: '800', color: C.gold, letterSpacing: 3, marginVertical: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  iconCircleGold: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleBlue: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: C.blueDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  completedText: { color: C.green, fontWeight: '600', fontSize: 12 },
  currentStop: { backgroundColor: C.surfaceHigh, borderRadius: 14, padding: 12, marginBottom: 12 },
  stopTimeline: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  stopHeader: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  qrContainer: { alignItems: 'center' },
  shareButton: { marginTop: 16, width: '100%', borderRadius: 14, overflow: 'hidden' },
  shareGradient: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
  },
  rateButton: { marginBottom: 8, borderRadius: 18, overflow: 'hidden' },
  rateGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.goldDim,
    borderWidth: 1,
    borderColor: C.gold,
    borderRadius: 18,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: {
    backgroundColor: C.surface,
    borderRadius: 28,
    padding: 24,
    width: screenWidth - 48,
    borderWidth: 1,
    borderColor: C.borderStrong,
  },
  starRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  reviewInput: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surfaceUp,
    borderRadius: 16,
    padding: 14,
    color: C.textPrimary,
    marginTop: 16,
    textAlignVertical: 'top',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 12 },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
});