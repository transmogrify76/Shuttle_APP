import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Modal,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import {
  getBookingSessions,
  getDriverVehicleInfo,
  getScheduledTripDetail,
} from '../services/bookingApi';
import { eventEmitter } from '../utils/eventEmitter';
import { C, T } from '../styles/design';

const ACTIVE_SEAT_STATUSES = new Set(['pending_payment', 'booked', 'boarded']);
const QR_ELIGIBLE_SEAT_STATUSES = new Set(['booked', 'boarded']);
const HISTORY_SEAT_STATUSES = new Set(['completed', 'cancelled', 'missed']);
const CLOSED_SESSION_STATUSES = new Set(['cancelled', 'expired']);

const TERMINAL_TRIP_STATUSES = new Set([
  'completed',
  'cancelled',
  'premature_end',
  'prematured_end_request',
]);

const getStatusColor = (status) => {
  switch (status) {
    case 'confirmed':
      return C.green;
    case 'pending_payment':
      return C.gold;
    case 'cancelled':
      return C.red;
    case 'expired':
      return C.textMuted;
    default:
      return C.textSecondary;
  }
};

const parseResponse = (res) => {
  if (Array.isArray(res)) return res;

  if (res && typeof res === 'object') {
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.booking_sessions)) return res.booking_sessions;

    if (res.data && typeof res.data === 'object') {
      if (Array.isArray(res.data.items)) return res.data.items;
      if (Array.isArray(res.data.booking_sessions)) return res.data.booking_sessions;
    }
  }

  return [];
};

const unwrapScheduledTrip = (res) => {
  if (!res) return null;
  if (res.scheduled_trip) return res.scheduled_trip;
  if (res.data?.scheduled_trip) return res.data.scheduled_trip;
  if (res.data && typeof res.data === 'object') return res.data;
  return res;
};

const parseApiDate = (value) => {
  if (!value) return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const formatDateTime = (value, fallback = 'Date not set') => {
  const parsed = parseApiDate(value);

  if (!parsed) {
    return fallback;
  }

  return parsed.toLocaleString();
};

const getSessionBookings = (session) => (
  Array.isArray(session?.bookings) ? session.bookings : []
);

const hasActiveSeat = (session) => (
  getSessionBookings(session).some((booking) =>
    ACTIVE_SEAT_STATUSES.has(booking.booking_status)
  )
);

const hasBookedOrBoardedSeat = (session) => (
  getSessionBookings(session).some((booking) =>
    QR_ELIGIBLE_SEAT_STATUSES.has(booking.booking_status)
  )
);

const hasBoardedSeat = (session) => (
  getSessionBookings(session).some((booking) =>
    booking.booking_status === 'boarded'
  )
);

const allSeatsHistorical = (session) => {
  const bookings = getSessionBookings(session);

  return bookings.length > 0 && bookings.every((booking) =>
    HISTORY_SEAT_STATUSES.has(booking.booking_status)
  );
};

const isTripTerminal = (trip) => (
  TERMINAL_TRIP_STATUSES.has(trip?.status) ||
  Boolean(trip?.actual_end_at)
);

const isSessionHistory = (session, trip, now) => {
  return (
    CLOSED_SESSION_STATUSES.has(session?.status) ||
    allSeatsHistorical(session) ||
    isTripTerminal(trip)
  );
};

const isSessionOngoing = (session, trip, now) => {
  if (isSessionHistory(session, trip, now)) {
    return false;
  }

  const start = parseApiDate(trip?.planned_start_at);

  return (
    session?.status === 'confirmed' &&
    hasBookedOrBoardedSeat(session) &&
    (
      hasBoardedSeat(session) ||
      (start && start <= now)
    )
  );
};

const isSessionUpcoming = (session, trip, now) => {
  if (isSessionHistory(session, trip, now)) {
    return false;
  }

  if (isSessionOngoing(session, trip, now)) {
    return false;
  }

  const start = parseApiDate(trip?.planned_start_at);

  return (
    (session?.status === 'pending_payment' || session?.status === 'confirmed') &&
    hasActiveSeat(session) &&
    (!start || start > now)
  );
};

const getSelectedTripStop = (trip, stopId, sequenceNo) => {
  const stops = Array.isArray(trip?.stops) ? trip.stops : [];

  return (
    stops.find((item) => item.stop?.id === stopId) ||
    stops.find((item) => String(item.sequence_no) === String(sequenceNo)) ||
    null
  );
};

const getSeatStatusCounts = (session) => {
  const bookings = getSessionBookings(session);

  return bookings.reduce(
    (acc, booking) => {
      const status = booking.booking_status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {}
  );
};

const getSeatStatusSummary = (session) => {
  const counts = getSeatStatusCounts(session);

  const parts = [
    counts.pending_payment ? `Pending: ${counts.pending_payment}` : null,
    counts.booked ? `Booked: ${counts.booked}` : null,
    counts.boarded ? `Boarded: ${counts.boarded}` : null,
    counts.completed ? `Completed: ${counts.completed}` : null,
    counts.cancelled ? `Cancelled: ${counts.cancelled}` : null,
    counts.missed ? `Missed: ${counts.missed}` : null,
  ].filter(Boolean);

  return parts.join(' · ');
};

const getSessionSortTime = (session) => {
  const selectedPickupTime = session?.selected_pickup_trip_stop?.planned_time_at_stop;
  const tripStartTime = session?.scheduled_trip?.planned_start_at;
  const updatedAt = session?.updated_at;
  const createdAt = session?.created_at;

  return (
    parseApiDate(selectedPickupTime) ||
    parseApiDate(tripStartTime) ||
    parseApiDate(updatedAt) ||
    parseApiDate(createdAt) ||
    new Date(0)
  );
};

const sortSessionsForTab = (items, activeTab) => {
  const copy = [...items];

  copy.sort((a, b) => {
    const aTime = getSessionSortTime(a).getTime();
    const bTime = getSessionSortTime(b).getTime();

    if (activeTab === 'history') {
      return bTime - aTime;
    }

    return aTime - bTime;
  });

  return copy;
};

const enrichSessionWithTrip = async (session, tripCache) => {
  const existingTrip = session?.scheduled_trip || null;
  const tripId = session?.scheduled_trip_id || existingTrip?.id;

  let trip = existingTrip;

  const existingTripHasStops = Array.isArray(existingTrip?.stops);

  if (tripId && !existingTripHasStops) {
    try {
      if (!tripCache.has(tripId)) {
        tripCache.set(
          tripId,
          getScheduledTripDetail(tripId)
            .then(unwrapScheduledTrip)
            .catch((err) => {
              console.warn('Failed to load scheduled trip:', tripId, err);
              return null;
            })
        );
      }

      trip = await tripCache.get(tripId);
    } catch (err) {
      console.warn('Failed to enrich session with trip:', session?.id, err);
      trip = existingTrip;
    }
  }

  const selectedPickupTripStop = getSelectedTripStop(
    trip,
    session?.pickup_stop_id,
    session?.pickup_sequence_no_snapshot
  );

  const selectedDropoffTripStop = getSelectedTripStop(
    trip,
    session?.dropoff_stop_id,
    session?.dropoff_sequence_no_snapshot
  );

  return {
    ...session,
    scheduled_trip: trip || null,
    selected_pickup_trip_stop: selectedPickupTripStop,
    selected_dropoff_trip_stop: selectedDropoffTripStop,
  };
};

const DriverInfoModal = ({ visible, onClose, driverInfo }) => {
  if (!driverInfo) return null;

  const ratingNum = driverInfo.driver_average_rating
    ? parseFloat(driverInfo.driver_average_rating)
    : null;

  const hasRating = ratingNum !== null && !Number.isNaN(ratingNum);
  const ratingCount = driverInfo.driver_rating_count || 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}>
        <LinearGradient
          colors={[C.surfaceUp, C.surface]}
          style={{
            borderRadius: 28,
            width: '100%',
            borderWidth: 1,
            borderColor: C.border,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={['rgba(201,168,76,0.25)', 'transparent']}
            style={{ padding: 24 }}
          >
            <Text style={[T.headingSm, { marginBottom: 10 }]}>Your Driver</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LinearGradient
                colors={[C.goldDim, 'rgba(201,168,76,0.05)']}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Ionicons name="person" size={26} color={C.gold} />
              </LinearGradient>

              <View>
                <Text style={T.displayMd}>{driverInfo.driver_name || 'N/A'}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons
                      key={i}
                      name={i < Math.round(ratingNum || 0) ? 'star' : 'star-outline'}
                      size={12}
                      color={C.gold}
                    />
                  ))}

                  <Text style={[T.bodySm, { marginLeft: 6 }]}>
                    {hasRating ? `${ratingNum.toFixed(1)} (${ratingCount})` : 'New driver'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={{ padding: 24, paddingTop: 0 }}>
            <View style={{
              backgroundColor: C.surfaceUp,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: C.border,
            }}>
              <Text style={[T.headingSm, { marginBottom: 12 }]}>Vehicle</Text>

              {[
                { label: 'Model', value: driverInfo.vehicle_name || 'Bus' },
                { label: 'Details', value: `${driverInfo.vehicle_model || '—'} · ${driverInfo.vehicle_color || '—'}` },
                { label: 'Reg. No.', value: driverInfo.vehicle_registration_number || 'N/A' },
                { label: 'Capacity', value: `${driverInfo.vehicle_total_seat || '?'} seats` },
              ].map((item, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    borderBottomWidth: i < 3 ? 1 : 0,
                    borderColor: C.border,
                  }}
                >
                  <Text style={[T.bodySm, { color: C.textMuted }]}>{item.label}</Text>
                  <Text style={T.bodyMd}>{item.value}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
              <LinearGradient
                colors={[C.gold, C.goldLight]}
                style={{
                  borderRadius: 16,
                  paddingVertical: 15,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#000', fontWeight: '700' }}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default function MyBookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('upcoming');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [currentDriverInfo, setCurrentDriverInfo] = useState(null);
  const [debugRawData, setDebugRawData] = useState(null);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const now = new Date();

      const allRes = await getBookingSessions();
      const allItems = parseResponse(allRes);

      console.log(`[DEBUG] Total sessions from API: ${allItems.length}`);

      if (allItems.length > 0) {
        console.log(
          '[DEBUG] First session sample:',
          JSON.stringify(allItems[0], null, 2).substring(0, 500)
        );
      }

      const unique = [];
      const seen = new Set();

      for (const session of allItems) {
        if (session?.id && !seen.has(session.id)) {
          seen.add(session.id);
          unique.push(session);
        }
      }

      const tripCache = new Map();
      const enriched = await Promise.all(
        unique.map((session) => enrichSessionWithTrip(session, tripCache))
      );

      let filtered = [];

      if (activeTab === 'upcoming') {
        filtered = enriched.filter((session) =>
          isSessionUpcoming(session, session.scheduled_trip, now)
        );
      } else if (activeTab === 'ongoing') {
        filtered = enriched.filter((session) =>
          isSessionOngoing(session, session.scheduled_trip, now)
        );
      } else {
        filtered = enriched.filter((session) =>
          isSessionHistory(session, session.scheduled_trip, now)
        );
      }

      filtered = sortSessionsForTab(filtered, activeTab);

      console.log(`[DEBUG] Unique sessions: ${unique.length}`);
      console.log(`[DEBUG] Filtered ${activeTab} count: ${filtered.length}`);

      setDebugRawData({
        totalCount: allItems.length,
        uniqueCount: unique.length,
        filteredCount: filtered.length,
        firstSession: enriched[0] || allItems[0],
      });

      setSessions(filtered);
    } catch (err) {
      console.error('Load error:', err);
      Alert.alert('Error', err?.message || 'Could not load bookings');
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();

    const handleRefresh = () => loadData(true);

    eventEmitter.on('refreshData', handleRefresh);

    return () => eventEmitter.off('refreshData', handleRefresh);
  }, [loadData]);

  const onRefresh = () => loadData(true);

  const showDriverInfo = async (tripId) => {
    if (!tripId) {
      Alert.alert('Error', 'Trip ID is missing');
      return;
    }

    try {
      const info = await getDriverVehicleInfo(tripId);
      setCurrentDriverInfo(info);
      setDriverModalVisible(true);
    } catch (e) {
      console.error('Driver info error:', e);
      Alert.alert('Error', 'Could not fetch driver info');
    }
  };

  const renderItem = ({ item }) => {
    const trip = item.scheduled_trip || {};
    const pickupStop = item.selected_pickup_trip_stop?.stop?.name || 'Pickup';
    const dropoffStop = item.selected_dropoff_trip_stop?.stop?.name || 'Dropoff';

    const bookings = getSessionBookings(item);
    const seatCount = bookings.length;

    const totalFare = parseFloat(item.total_fare_amount) || 0;
    const refunded = item.payments?.[0]?.refunded_amount
      ? parseFloat(item.payments[0].refunded_amount)
      : 0;

    const tripId = item.scheduled_trip_id || trip.id;

    const pickupTime = item.selected_pickup_trip_stop?.planned_time_at_stop;
    const tripStartTime = trip.planned_start_at;
    const startTime = formatDateTime(pickupTime || tripStartTime);

    const seatStatusSummary = getSeatStatusSummary(item);

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BookingDetail', { sessionId: item.id })}
        style={{ marginHorizontal: 16, marginBottom: 12 }}
      >
        <LinearGradient
          colors={[C.surfaceUp, C.surface]}
          style={{
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <Text style={[T.bodyMd, { flex: 1 }]}>
              {pickupStop} → {dropoffStop}
            </Text>

            <Text style={{
              color: getStatusColor(item.status),
              fontWeight: '700',
            }}>
              {String(item.status || 'unknown').toUpperCase()}
            </Text>
          </View>

          <Text style={[T.bodySm, { marginVertical: 4 }]}>
            {startTime}
          </Text>

          <Text style={T.bodySm}>
            {seatCount} seat(s) · ₹{totalFare}
          </Text>

          {seatStatusSummary ? (
            <Text style={[T.bodySm, { marginTop: 4, color: C.textMuted }]}>
              {seatStatusSummary}
            </Text>
          ) : null}

          {refunded > 0 ? (
            <Text style={{ color: C.gold, marginTop: 4 }}>
              Refunded: ₹{refunded}
            </Text>
          ) : null}

          {tripId ? (
            <TouchableOpacity
              onPress={() => showDriverInfo(tripId)}
              style={{
                marginTop: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="car-outline" size={14} color={C.textMuted} />
              <Text style={[T.bodySm, { marginLeft: 4, color: C.textMuted }]}>
                View driver & vehicle
              </Text>
            </TouchableOpacity>
          ) : null}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const DebugView = () => {
    if (!debugRawData) return null;

    return (
      <View style={{
        padding: 16,
        backgroundColor: '#1a1a2e',
        marginTop: 20,
        borderRadius: 12,
        marginHorizontal: 16,
      }}>
        <Text style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: 8 }}>
          🔍 Debug Info
        </Text>

        <Text style={{ color: '#aaa', fontSize: 12 }}>
          Total sessions from API: {debugRawData.totalCount}
        </Text>

        <Text style={{ color: '#aaa', fontSize: 12 }}>
          Unique sessions: {debugRawData.uniqueCount}
        </Text>

        <Text style={{ color: '#aaa', fontSize: 12 }}>
          Filtered {activeTab}: {debugRawData.filteredCount}
        </Text>

        {debugRawData.firstSession ? (
          <Text style={{ color: '#aaa', fontSize: 10, marginTop: 4 }}>
            Sample: {JSON.stringify(debugRawData.firstSession).substring(0, 300)}...
          </Text>
        ) : null}

        <TouchableOpacity
          onPress={() => loadData(true)}
          style={{
            marginTop: 12,
            backgroundColor: C.gold,
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#000', fontWeight: 'bold' }}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="My Bookings" />

      <View style={{
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}>
        {['upcoming', 'ongoing', 'history'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: activeTab === tab ? C.gold : 'transparent',
            }}
          >
            <Text style={[
              T.bodySm,
              {
                fontWeight: activeTab === tab ? '700' : '500',
                color: activeTab === tab ? C.gold : C.textSecondary,
              },
            ]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color={C.gold}
          style={{ marginTop: 40 }}
        />
      ) : sessions.length === 0 ? (
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            paddingTop: 40,
            paddingBottom: 20,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.gold}
            />
          }
        >
          <Ionicons name="calendar-outline" size={60} color={C.textMuted} />
          <Text style={[T.bodyMd, { marginTop: 12 }]}>
            No {activeTab} bookings
          </Text>
          <DebugView />
        </ScrollView>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={C.gold}
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <DriverInfoModal
        visible={driverModalVisible}
        onClose={() => setDriverModalVisible(false)}
        driverInfo={currentDriverInfo}
      />
    </View>
  );
}