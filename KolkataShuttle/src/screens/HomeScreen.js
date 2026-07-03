import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  PanResponder,
  Alert,
  Modal,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import OSMMap from '../components/OSMMap';
import AnimatedButton from '../components/AnimatedButton';
import { useAuth } from '../context/AuthContext';
import {
  listRoutes,
  listScheduledTrips,
  getRouteDetails,
} from '../services/routeApi';
import {
  previewFare,
  getDriverVehicleInfo,
  getLegAvailableSeats,
  getPassengerProfile,
} from '../services/bookingApi';
import { getRouteBetweenStops } from '../services/routingApi';
import { fetchProfile } from '../services/profileApi';
import { eventEmitter } from '../utils/eventEmitter';

// Resources whose changes should refresh what's on the home/search screen,
// per the passenger API refresh WebSocket contract: new/updated routes and
// stops, newly created or catalog-relevant trips, and seat availability.
const HOME_ROUTE_RESOURCES = new Set(['routes', 'stops']);
const HOME_TRIP_RESOURCES = new Set(['route_trip_options', 'scheduled_trips']);
const HOME_SEAT_RESOURCES = new Set(['seat_availability']);

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = screenHeight * 0.72;
const BOTTOM_SHEET_MIN_HEIGHT = screenHeight * 0.18;

// ─── DESIGN TOKENS (unchanged) ─────────────────────────────────────────────────
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
  shimmer: 'rgba(255,255,255,0.04)',
};

// ─── TYPOGRAPHY (unchanged) ─────────────────────────────────────────────────
const T = StyleSheet.create({
  displayLg: { fontSize: 34, fontWeight: '800', color: C.textPrimary, letterSpacing: -1.2, lineHeight: 40 },
  displayMd: { fontSize: 26, fontWeight: '700', color: C.textPrimary, letterSpacing: -0.8 },
  headingSm: { fontSize: 13, fontWeight: '700', color: C.textSecondary, letterSpacing: 1.6, textTransform: 'uppercase' },
  bodyLg: { fontSize: 16, fontWeight: '600', color: C.textPrimary },
  bodyMd: { fontSize: 14, fontWeight: '500', color: C.textPrimary },
  bodySm: { fontSize: 12, fontWeight: '400', color: C.textSecondary },
  mono: { fontSize: 11, fontWeight: '600', color: C.gold, letterSpacing: 0.5 },
});

// ─── GLASS CARD WRAPPER (unchanged) ─────────────────────────────────────────
const GlassCard = ({ children, style, noBorder }) => (
  <View style={[{
    backgroundColor: C.surfaceUp,
    borderRadius: 20,
    borderWidth: noBorder ? 0 : 1,
    borderColor: C.border,
    overflow: 'hidden',
  }, style]}>
    {children}
  </View>
);

// ─── GOLD PILL TAG (unchanged) ──────────────────────────────────────────────
const GoldTag = ({ label }) => (
  <View style={{ backgroundColor: C.goldDim, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' }}>
    <Text style={T.mono}>{label}</Text>
  </View>
);

// ─── STOP SELECTOR (unchanged) ──────────────────────────────────────────────
const StopSelector = ({ stops, selectedId, onSelect, label, icon, accent }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const selectedStop = stops?.find(s => s.stop?.id === selectedId);

  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  return (
    <>
      <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={() => setModalVisible(true)}>
        <Animated.View style={[{
          transform: [{ scale }],
          backgroundColor: C.surfaceUp,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: selectedStop ? 'rgba(201,168,76,0.35)' : C.border,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
        }]}>
          <View style={{
            width: 36, height: 36, borderRadius: 10,
            backgroundColor: accent === 'gold' ? C.goldDim : C.blueDim,
            alignItems: 'center', justifyContent: 'center', marginRight: 12,
          }}>
            <Ionicons name={icon} size={18} color={accent === 'gold' ? C.gold : C.blue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[T.bodySm, { marginBottom: 2 }]}>{label}</Text>
            <Text style={selectedStop ? T.bodyMd : [T.bodySm, { color: C.textMuted }]} numberOfLines={1}>
              {selectedStop ? selectedStop.stop.name : 'Tap to select'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
        </Animated.View>
      </TouchableOpacity>

      {/* Stop Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: C.borderStrong, maxHeight: screenHeight * 0.65,
          }}>
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 36, height: 4, backgroundColor: C.surfaceHigh, borderRadius: 2 }} />
            </View>
            <View style={{ paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={T.displayMd}>{label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              {stops?.map((stop, idx) => (
                <TouchableOpacity
                  key={stop.stop?.id || idx}
                  onPress={() => { onSelect(stop.stop?.id); setModalVisible(false); }}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 14,
                    borderBottomWidth: 1, borderColor: C.border,
                  }}
                >
                  <View style={{
                    width: 28, height: 28, borderRadius: 8,
                    backgroundColor: selectedId === stop.stop?.id ? C.goldDim : C.surfaceHigh,
                    alignItems: 'center', justifyContent: 'center', marginRight: 14,
                    borderWidth: selectedId === stop.stop?.id ? 1 : 0,
                    borderColor: 'rgba(201,168,76,0.4)',
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: selectedId === stop.stop?.id ? C.gold : C.textMuted }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={selectedId === stop.stop?.id ? [T.bodyMd, { color: C.gold }] : T.bodyMd}>
                    {stop.stop?.name}
                  </Text>
                  {selectedId === stop.stop?.id && (
                    <Ionicons name="checkmark" size={16} color={C.gold} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ─── RIDE CARD (unchanged) ──────────────────────────────────────────────────
const RideCard = ({ trip, selected, onPress, onViewStops, onInfoPress, seatInfo }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selected) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: false }),
          Animated.timing(shimmer, { toValue: 0, duration: 2000, useNativeDriver: false }),
        ])
      ).start();
    } else {
      shimmer.stopAnimation();
      shimmer.setValue(0);
    }
  }, [selected]);

  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  const vehicle = trip?.vehicle || {};
  const vehicleName = vehicle?.vehicle_name || vehicle?.registration_number || 'Shuttle';
  const hasAC = vehicle?.has_ac;
  const startTime = trip?.planned_start_at
    ? new Date(trip.planned_start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'TBD';
  const fromStop = trip?.trip_from_stop?.name || '—';
  const toStop = trip?.trip_to_stop?.name || '—';
  const availableSeats = seatInfo?.available ?? null;
  const totalSeats = seatInfo?.total ?? null;
  const seatPct = totalSeats ? availableSeats / totalSeats : null;
  const seatColor = seatPct === null ? C.textMuted : seatPct > 0.5 ? C.green : seatPct > 0.2 ? C.gold : C.red;

  const borderColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(201,168,76,0.4)', 'rgba(201,168,76,0.9)'],
  });

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={pressIn} onPressOut={pressOut} onPress={onPress}>
      <Animated.View style={{
        transform: [{ scale }],
        marginBottom: 10,
      }}>
        <Animated.View style={{
          borderRadius: 20,
          borderWidth: selected ? 1.5 : 1,
          borderColor: selected ? borderColor : C.border,
          backgroundColor: selected ? '#16151F' : C.surfaceUp,
          overflow: 'hidden',
        }}>
          {selected && (
            <LinearGradient
              colors={[C.gold, 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ height: 2, width: '100%' }}
            />
          )}
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: selected ? C.goldDim : C.surfaceHigh,
                borderWidth: 1, borderColor: selected ? 'rgba(201,168,76,0.3)' : C.border,
                alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}>
                <Ionicons name="bus" size={22} color={selected ? C.gold : C.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                  <Text style={[T.bodyLg, selected ? { color: C.textPrimary } : {}]}>{vehicleName}</Text>
                  {hasAC && <GoldTag label="AC" />}
                </View>
                <Text style={[T.bodySm, { marginBottom: 2 }]}>{fromStop} → {toStop}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="time-outline" size={11} color={C.textMuted} />
                    <Text style={[T.bodySm, { color: C.textMuted }]}>{startTime}</Text>
                  </View>
                  {seatInfo && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: seatColor }} />
                      <Text style={[T.bodySm, { color: seatColor }]}>
                        {availableSeats} seats left
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={{ gap: 6 }}>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); onViewStops(); }}
                  style={{
                    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10,
                    backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border,
                  }}
                >
                  <Text style={[T.bodySm, { color: C.textPrimary, fontSize: 11 }]}>Stops</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); onInfoPress(); }}
                  style={{
                    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10,
                    backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border,
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="person-outline" size={14} color={C.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            {seatInfo && (
              <View style={{ marginTop: 14 }}>
                <View style={{ height: 3, backgroundColor: C.surfaceHigh, borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{
                    height: '100%',
                    width: `${Math.min((availableSeats / totalSeats) * 100, 100)}%`,
                    backgroundColor: seatColor,
                    borderRadius: 2,
                  }} />
                </View>
                <Text style={[T.bodySm, { color: C.textMuted, fontSize: 10, marginTop: 4, textAlign: 'right' }]}>
                  {availableSeats}/{totalSeats} available
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── TRIP STOP MODAL (unchanged) ────────────────────────────────────────────
const TripStopModal = ({ visible, onClose, stops }) => {
  if (!stops) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
        <View style={{
          backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
          borderTopWidth: 1, borderColor: C.borderStrong, maxHeight: '80%',
        }}>
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, backgroundColor: C.surfaceHigh, borderRadius: 2 }} />
          </View>
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={T.displayMd}>Route Stops</Text>
            <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
              <Ionicons name="close" size={22} color={C.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
            {stops.map((stop, idx) => {
              const plannedTime = stop.planned_time_at_stop
                ? new Date(stop.planned_time_at_stop).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--';
              const isFirst = idx === 0;
              const isLast = idx === stops.length - 1;
              return (
                <View key={stop.route_stop_id || idx} style={{ flexDirection: 'row', alignItems: 'stretch' }}>
                  <View style={{ width: 32, alignItems: 'center' }}>
                    <View style={{
                      width: 12, height: 12, borderRadius: 6, marginTop: 18,
                      backgroundColor: isFirst || isLast ? C.gold : C.surfaceHigh,
                      borderWidth: isFirst || isLast ? 0 : 2,
                      borderColor: C.borderStrong,
                    }} />
                    {!isLast && <View style={{ flex: 1, width: 2, backgroundColor: C.border, marginVertical: 2 }} />}
                  </View>
                  <View style={{ flex: 1, paddingVertical: 12, paddingLeft: 12, borderBottomWidth: isLast ? 0 : 1, borderColor: C.border }}>
                    <Text style={T.bodyMd}>{stop.stop?.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                      <Text style={[T.bodySm, { color: C.textMuted }]}>{plannedTime}</Text>
                      <Text style={[T.bodySm, { color: C.textMuted }]}>·</Text>
                      <Text style={[T.bodySm, { color: C.textMuted }]}>{stop.minutes_from_trip_start ?? '?'} min</Text>
                      {stop.boarding_allowed && (
                        <View style={{ backgroundColor: C.greenDim, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={[T.bodySm, { color: C.green, fontSize: 10 }]}>Pickup</Text>
                        </View>
                      )}
                      {stop.deboarding_allowed && (
                        <View style={{ backgroundColor: C.blueDim, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={[T.bodySm, { color: C.blue, fontSize: 10 }]}>Dropoff</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── DRIVER INFO MODAL (unchanged) ──────────────────────────────────────────
const DriverInfoModal = ({ visible, onClose, driverInfo }) => {
  if (!driverInfo) return null;
  const ratingNum = parseFloat(driverInfo.driver_average_rating);
  const hasRating = !isNaN(ratingNum);
  const ratingCount = driverInfo.driver_rating_count || 0;

  const renderStars = (rating) => {
    return [1, 2, 3, 4, 5].map(i => (
      <Ionicons key={i} name={i <= Math.round(rating) ? 'star' : 'star-outline'} size={13} color={C.gold} style={{ marginRight: 2 }} />
    ));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{
          backgroundColor: C.surface, borderRadius: 28, width: '100%',
          borderWidth: 1, borderColor: C.borderStrong, overflow: 'hidden',
        }}>
          <LinearGradient
            colors={['rgba(201,168,76,0.25)', 'transparent']}
            style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 }}
          >
            <Text style={[T.headingSm, { marginBottom: 10 }]}>Your Driver</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LinearGradient colors={[C.goldDim, 'rgba(201,168,76,0.05)']} style={{
                width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', marginRight: 16,
              }}>
                <Ionicons name="person" size={26} color={C.gold} />
              </LinearGradient>
              <View>
                <Text style={T.displayMd}>{driverInfo.driver_name || 'N/A'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  {hasRating ? renderStars(ratingNum) : null}
                  <Text style={[T.bodySm, { marginLeft: 6 }]}>
                    {hasRating ? `${ratingNum.toFixed(1)} (${ratingCount})` : `New driver`}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
          <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
            <GlassCard style={{ padding: 16 }}>
              <Text style={[T.headingSm, { marginBottom: 12 }]}>Vehicle</Text>
              {[
                { label: 'Model', value: driverInfo.vehicle_name || 'Bus' },
                { label: 'Details', value: `${driverInfo.vehicle_model || '—'} · ${driverInfo.vehicle_color || '—'}` },
                { label: 'Reg. No.', value: driverInfo.vehicle_registration_number || 'N/A' },
                { label: 'Capacity', value: `${driverInfo.vehicle_total_seat || '?'} seats` },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < 3 ? 1 : 0, borderColor: C.border }}>
                  <Text style={[T.bodySm, { color: C.textMuted }]}>{item.label}</Text>
                  <Text style={T.bodyMd}>{item.value}</Text>
                </View>
              ))}
            </GlassCard>
            <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
              <LinearGradient colors={[C.gold, C.goldLight]} style={{ borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}>
                <Text style={{ color: '#000', fontWeight: '700', fontSize: 15 }}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── SKELETON (unchanged) ──────────────────────────────────────────────────
const Skeleton = ({ width, height, borderRadius = 8 }) => {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.9, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return <Animated.View style={{ width, height, borderRadius, backgroundColor: C.surfaceHigh, opacity }} />;
};

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [hasPassengerProfile, setHasPassengerProfile] = useState(false);

  const [routesData, setRoutesData] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [pickupStopId, setPickupStopId] = useState(null);
  const [dropoffStopId, setDropoffStopId] = useState(null);
  const [fare, setFare] = useState(null);
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [tripStopModalVisible, setTripStopModalVisible] = useState(false);
  const [selectedTripStops, setSelectedTripStops] = useState([]);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [currentDriverInfo, setCurrentDriverInfo] = useState(null);
  const [legAvailability, setLegAvailability] = useState({});
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(true);

  const translateY = useRef(new Animated.Value(0)).current;

  // ── Shared loaders (used by initial mount effects AND by the
  // passenger API refresh WebSocket listener below). They preserve the
  // user's current route/pickup/dropoff selection instead of resetting it,
  // per the "do not clear filters on invalidation" contract.
  const loadRoutesList = async ({ alertOnError = false } = {}) => {
    try {
      const { items } = await listRoutes(true);
      setRoutesData(items || []);
      setSelectedRoute((prev) => {
        if (prev) {
          const stillExists = items?.find((r) => r.id === prev.id);
          if (stillExists) return stillExists;
        }
        return items?.length ? items[0] : null;
      });
    } catch (err) {
      console.warn('[HomeScreen] failed to refresh routes', err);
      if (alertOnError) Alert.alert('Error', 'Unable to load routes');
    }
  };

  const loadTripsForRoute = async (routeId, { alertOnError = false } = {}) => {
    if (!routeId) return;
    try {
      const routeDetail = await getRouteDetails(routeId);
      setStops(routeDetail.stops?.sort((a, b) => a.sequence_no - b.sequence_no) || []);
      const { items } = await listScheduledTrips(routeId, true);
      setTrips(items || []);
      setSelectedTrip((prev) => {
        if (prev) {
          const stillExists = items?.find((t) => t.id === prev.id);
          if (stillExists) return stillExists;
        }
        return items?.length ? items[0] : null;
      });
    } catch (err) {
      console.warn('[HomeScreen] failed to refresh trips', err);
      if (alertOnError) Alert.alert('Error', err.message);
    }
  };

  const refreshLegAvailability = async (tripList, routeId, pickup, dropoff) => {
    if (!pickup || !dropoff || !tripList?.length || !routeId) {
      setLegAvailability({});
      return;
    }
    setLoadingSeats(true);
    const results = {};
    for (const trip of tripList) {
      try {
        const s = await getLegAvailableSeats(trip.id, routeId, pickup, dropoff);
        results[trip.id] = { available: s.available_seats, total: s.seat_capacity };
      } catch { results[trip.id] = null; }
    }
    setLegAvailability(results);
    setLoadingSeats(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
        else if (g.dy < 0 && translateY.__getValue() > -(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT))
          translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 100) setSheetVisible(false);
        else if (g.dy < -50)
          Animated.spring(translateY, { toValue: -(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT), useNativeDriver: true }).start();
        else {
          const snap = translateY.__getValue() < -(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT) / 2
            ? -(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT) : 0;
          Animated.spring(translateY, { toValue: snap, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: sheetVisible ? 0 : BOTTOM_SHEET_MAX_HEIGHT,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [sheetVisible]);

  useEffect(() => {
    loadRoutesList({ alertOnError: true });
  }, []);

  useEffect(() => {
    if (!selectedRoute) return;
    setLoading(true);
    loadTripsForRoute(selectedRoute.id, { alertOnError: true }).finally(() => setLoading(false));
  }, [selectedRoute?.id]);

  useEffect(() => {
    if (pickupStopId && dropoffStopId && stops.length) {
      const pk = stops.find(s => s.stop?.id === pickupStopId);
      const dk = stops.find(s => s.stop?.id === dropoffStopId);
      if (pk && dk) {
        (async () => {
          try {
            const coords = await getRouteBetweenStops(
              parseFloat(pk.stop.lat), parseFloat(pk.stop.lng),
              parseFloat(dk.stop.lat), parseFloat(dk.stop.lng)
            );
            setRouteCoordinates(coords);
          } catch { setRouteCoordinates([]); }
        })();
      }
    } else setRouteCoordinates([]);
  }, [pickupStopId, dropoffStopId, stops]);

  useEffect(() => {
    refreshLegAvailability(trips, selectedRoute?.id, pickupStopId, dropoffStopId);
  }, [pickupStopId, dropoffStopId, trips, selectedRoute]);

  // Passenger API refresh WebSocket: a driver creating a trip (trip.created),
  // a trip entering/leaving discovery (trip.catalog_changed), or a route/stop
  // change (route.created/route.updated) means the home search results may
  // be stale. Refetch in place — keep the selected route and pickup/dropoff
  // filters exactly as the user left them; only the underlying data updates.
  useEffect(() => {
    const handleRefresh = (payload) => {
      const resources = payload?.resources || payload?.keys || [];
      if (resources.length === 0) return;

      if (resources.some((r) => HOME_ROUTE_RESOURCES.has(r))) {
        loadRoutesList();
      }
      if (selectedRoute && resources.some((r) => HOME_TRIP_RESOURCES.has(r))) {
        loadTripsForRoute(selectedRoute.id);
      }
      if (resources.some((r) => HOME_SEAT_RESOURCES.has(r))) {
        refreshLegAvailability(trips, selectedRoute?.id, pickupStopId, dropoffStopId);
      }
    };
    eventEmitter.on('refreshData', handleRefresh);
    return () => eventEmitter.off('refreshData', handleRefresh);
  }, [selectedRoute, trips, pickupStopId, dropoffStopId]);

  useEffect(() => {
    if (selectedTrip && pickupStopId && dropoffStopId && selectedRoute) {
      (async () => {
        try {
          const f = await previewFare({ route_id: selectedRoute.id, pickup_stop_id: pickupStopId, dropoff_stop_id: dropoffStopId });
          setFare(f);
        } catch { setFare(null); }
      })();
    } else setFare(null);
  }, [selectedTrip, pickupStopId, dropoffStopId, selectedRoute]);

  useEffect(() => {
    (async () => {
      try {
        const profile = await fetchProfile();
        setUserName(profile?.full_name || user?.email?.split('@')[0] || 'User');
        // Check passenger profile existence
        try {
          const passengerProfile = await getPassengerProfile();
          setHasPassengerProfile(!!passengerProfile?.id);
        } catch { setHasPassengerProfile(false); }
      } catch {
        setUserName(user?.email?.split('@')[0] || 'User');
      } finally {
        setProfileLoading(false);
      }
    })();
  }, [user]);

  const handleConfirm = async () => {
    // Passenger profile check
    if (!hasPassengerProfile) {
      Alert.alert(
        'Profile Required',
        'Please complete your passenger profile before booking.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create Profile', onPress: () => navigation.navigate('Profile') }
        ]
      );
      return;
    }

    if (!selectedTrip || !pickupStopId || !dropoffStopId || !fare) {
      Alert.alert('Incomplete', 'Select pickup, dropoff, and a ride first');
      return;
    }
    try {
      const s = await getLegAvailableSeats(selectedTrip.id, selectedRoute.id, pickupStopId, dropoffStopId);
      if (!s.trip_bookable || s.available_seats === 0) {
        Alert.alert('No seats', 'No seats available for this leg. Try another ride.');
        return;
      }
      if (s.available_seats < 3) Alert.alert('Hurry!', `Only ${s.available_seats} seat(s) left.`);
    } catch {
      Alert.alert('Error', 'Could not verify availability. Try again.');
      return;
    }
    navigation.navigate('SeatSelection', {
      scheduledTrip: selectedTrip,
      pickupStopId,
      dropoffStopId,
      fareAmount: fare.amount,
      routeName: selectedRoute?.name,
    });
  };

  const showDriverInfo = async (tripId) => {
    try {
      const info = await getDriverVehicleInfo(tripId);
      setCurrentDriverInfo(info);
      setDriverModalVisible(true);
    } catch { Alert.alert('Error', 'Could not fetch driver info'); }
  };

  const canBook = selectedTrip && pickupStopId && dropoffStopId && fare;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <OSMMap routeCoordinates={routeCoordinates} />
      </View>

      <Animated.View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: BOTTOM_SHEET_MAX_HEIGHT,
        backgroundColor: C.surface,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
        borderColor: C.borderStrong,
        transform: [{ translateY }],
        shadowColor: C.gold,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 20,
      }}>
        <View {...panResponder.panHandlers} style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}>
          <View style={{ width: 36, height: 4, backgroundColor: C.surfaceHigh, borderRadius: 2 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 50 }}
        >
          {/* Welcome Header with travellers and profile buttons */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, marginTop: 4 }}>
            <View>
              <Text style={[T.headingSm, { marginBottom: 6 }]}>Welcome Back!</Text>
              {profileLoading
                ? <Skeleton width={140} height={34} borderRadius={10} />
                : <Text style={T.displayLg}>{userName}</Text>
              }
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('TravellerProfiles')}
                style={{
                  width: 46, height: 46, borderRadius: 14,
                  backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="people-outline" size={20} color={C.gold} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                style={{
                  width: 46, height: 46, borderRadius: 14,
                  backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="person-outline" size={20} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Route Selector */}
          <Text style={[T.headingSm, { marginBottom: 10 }]}>Route</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8 }}>
            {routesData.map((route, idx) => {
              const sel = selectedRoute?.id === route.id;
              return (
                <TouchableOpacity
                  key={route.id || idx}
                  onPress={() => setSelectedRoute(route)}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 16, paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: sel ? C.gold : C.surfaceUp,
                    borderWidth: 1, borderColor: sel ? C.goldLight : C.border,
                    gap: 6,
                  }}
                >
                  <Text style={[T.bodyMd, { color: sel ? '#000' : C.textPrimary, fontWeight: sel ? '700' : '500' }]}>
                    {route.name}
                  </Text>
                  {route.has_ac && !sel && <GoldTag label="AC" />}
                  {route.has_ac && sel && (
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#000' }}>AC</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Stop Selectors */}
          <Text style={[T.headingSm, { marginBottom: 10 }]}>Journey</Text>
          <StopSelector stops={stops} selectedId={pickupStopId} onSelect={setPickupStopId} label="Pickup stop" icon="navigate-circle" accent="gold" />
          <StopSelector stops={stops} selectedId={dropoffStopId} onSelect={setDropoffStopId} label="Dropoff stop" icon="location" accent="blue" />

          {/* Fare Card */}
          {fare && (
            <LinearGradient
              colors={['rgba(201,168,76,0.15)', 'rgba(201,168,76,0.05)']}
              style={{
                borderRadius: 18, padding: 16, marginTop: 4, marginBottom: 8,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                borderWidth: 1, borderColor: 'rgba(201,168,76,0.25)',
              }}
            >
              <View>
                <Text style={[T.headingSm, { marginBottom: 4 }]}>Estimated Fare</Text>
                <Text style={{ fontSize: 30, fontWeight: '800', color: C.gold, letterSpacing: -1 }}>
                  ₹{fare.amount}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                {fare.has_ac && <GoldTag label="AC" />}
                <Text style={[T.bodySm, { color: C.textMuted }]}>{fare.route_name}</Text>
              </View>
            </LinearGradient>
          )}

          {/* Available Buses */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 12 }}>
            <Text style={[T.headingSm]}>Available Buses</Text>
            {loadingSeats && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ActivityIndicator size="small" color={C.gold} />
                <Text style={[T.bodySm, { color: C.textMuted, fontSize: 11 }]}>Checking seats</Text>
              </View>
            )}
          </View>

          {loading && trips.length === 0 ? (
            <View style={{ gap: 10 }}>
              {[1, 2].map(i => <Skeleton key={i} width="100%" height={100} borderRadius={20} />)}
            </View>
          ) : trips.length === 0 ? (
            <GlassCard style={{ padding: 32, alignItems: 'center' }}>
              <Ionicons name="bus-outline" size={44} color={C.textMuted} />
              <Text style={[T.bodyMd, { color: C.textMuted, marginTop: 12 }]}>No buses on this route</Text>
            </GlassCard>
          ) : (
            trips.map((trip, idx) => (
              <RideCard
                key={trip.id || idx}
                trip={trip}
                selected={selectedTrip?.id === trip.id}
                onPress={() => setSelectedTrip(trip)}
                onViewStops={() => { setSelectedTripStops(trip.stops || []); setTripStopModalVisible(true); }}
                onInfoPress={() => showDriverInfo(trip.id)}
                seatInfo={legAvailability[trip.id]}
              />
            ))
          )}

          {/* CTA Button */}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!canBook}
            style={{ marginTop: 24 }}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canBook ? [C.gold, C.goldLight] : [C.surfaceHigh, C.surfaceHigh]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 18, paddingVertical: 17,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 8,
                borderWidth: canBook ? 0 : 1, borderColor: C.border,
              }}
            >
              <Ionicons
                name="ticket-outline"
                size={18}
                color={canBook ? '#000' : C.textMuted}
              />
              <Text style={{
                fontSize: 16, fontWeight: '700',
                color: canBook ? '#000' : C.textMuted,
                letterSpacing: 0.2,
              }}>
                {fare ? `Book Seats · ₹${fare.amount}` : 'Select Journey Details'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={[T.bodySm, { color: C.textMuted, textAlign: 'center', marginTop: 12 }]}>
            Scheduled rides · Confirmed seats
          </Text>
        </ScrollView>
      </Animated.View>

      {/* Floating restore button */}
      {!sheetVisible && (
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          style={{
            position: 'absolute', bottom: insets.bottom + 24, right: 20,
            width: 52, height: 52, borderRadius: 16,
            backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderStrong,
            alignItems: 'center', justifyContent: 'center',
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
            elevation: 8,
          }}
        >
          <Ionicons name="chevron-up" size={22} color={C.gold} />
        </TouchableOpacity>
      )}

      <TripStopModal visible={tripStopModalVisible} onClose={() => setTripStopModalVisible(false)} stops={selectedTripStops} />
      <DriverInfoModal visible={driverModalVisible} onClose={() => setDriverModalVisible(false)} driverInfo={currentDriverInfo} />
    </View>
  );
}