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
  listStops,
  getRouteTripOptions,
  searchStops,
} from '../services/routeApi';
import {
  getDriverVehicleInfo,
  getPassengerProfile,
} from '../services/bookingApi';
import { getRouteBetweenStops } from '../services/routingApi';
import { fetchProfile } from '../services/profileApi';
import { eventEmitter } from '../utils/eventEmitter';

// Resources whose changes should refresh what's on the home/search screen,
// per the passenger API refresh WebSocket contract: new/updated stops mean
// the stop pickers may be stale; new/changed trips or seat counts mean the
// current from→to search results may be stale.
const HOME_STOPS_RESOURCES = new Set(['routes', 'stops']);
const HOME_SEARCH_RESOURCES = new Set(['route_trip_options', 'scheduled_trips', 'seat_availability']);

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
const StopSelector = ({ stops, selectedId, onSelect, label, icon, accent, userLocation, excludeId }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = show the static `stops` list
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef(null);
  const scale = useRef(new Animated.Value(1)).current;
  const selectedStop = stops?.find(s => s.stop?.id === selectedId);

  const pressIn = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20 }).start();

  // Debounced fuzzy/nearby search. The endpoint requires query OR lat/lng —
  // with neither (empty box, no location permission) we just fall back to
  // the full static stop list already loaded on Home. Also re-runs when the
  // modal opens so "nearby" results are fresh without requiring a keystroke.
  useEffect(() => {
    if (!modalVisible) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed && !userLocation) {
      setSearchResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchStops({
          query: trimmed || undefined,
          lat: userLocation?.lat,
          lng: userLocation?.lng,
          radiusKm: userLocation ? 10 : undefined,
          limit: 30,
        });
        setSearchResults((res.items || []).map((item) => ({ stop: item, name_match_score: item.name_match_score, distance_km: item.distance_km })));
      } catch (err) {
        console.warn('[StopSelector] search failed', err);
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, userLocation?.lat, userLocation?.lng, modalVisible]);

  const displayList = searchResults !== null ? searchResults : stops;

  const closeAndReset = () => {
    setModalVisible(false);
    setQuery('');
    setSearchResults(null);
  };

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
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeAndReset}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            borderTopWidth: 1, borderColor: C.borderStrong, maxHeight: screenHeight * 0.72,
          }}>
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 36, height: 4, backgroundColor: C.surfaceHigh, borderRadius: 2 }} />
            </View>
            <View style={{ paddingHorizontal: 24, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={T.displayMd}>{label}</Text>
              <TouchableOpacity onPress={closeAndReset} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search box — fuzzy name search, tolerant of typos/spacing/case */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceHigh,
                borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14,
              }}>
                <Ionicons name="search" size={16} color={C.textMuted} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search stops..."
                  placeholderTextColor={C.textMuted}
                  style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, color: C.textPrimary, fontSize: 14 }}
                  autoCorrect={false}
                />
                {searching && <ActivityIndicator size="small" color={C.gold} />}
                {!searching && query.length > 0 && (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={16} color={C.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              {userLocation && !query && (
                <Text style={[T.bodySm, { color: C.textMuted, marginTop: 6 }]}>Showing stops near you</Text>
              )}
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              {displayList?.length === 0 && (
                <Text style={[T.bodySm, { color: C.textMuted, textAlign: 'center', paddingVertical: 20 }]}>
                  No stops found
                </Text>
              )}
              {displayList?.map((stop, idx) => {
                const isExcluded = excludeId && stop.stop?.id === excludeId;
                const isSelected = selectedId === stop.stop?.id;
                return (
                  <TouchableOpacity
                    key={stop.stop?.id || idx}
                    disabled={isExcluded}
                    onPress={() => { onSelect(stop.stop?.id); closeAndReset(); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingVertical: 14,
                      borderBottomWidth: 1, borderColor: C.border,
                      opacity: isExcluded ? 0.4 : 1,
                    }}
                  >
                    <View style={{
                      width: 28, height: 28, borderRadius: 8,
                      backgroundColor: isSelected ? C.goldDim : C.surfaceHigh,
                      alignItems: 'center', justifyContent: 'center', marginRight: 14,
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: 'rgba(201,168,76,0.4)',
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? C.gold : C.textMuted }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={isSelected ? [T.bodyMd, { color: C.gold }] : T.bodyMd}>
                        {stop.stop?.name}
                      </Text>
                      {isExcluded && <Text style={[T.bodySm, { color: C.textMuted, fontSize: 11 }]}>Already selected as the other stop</Text>}
                      {!isExcluded && stop.distance_km != null && (
                        <Text style={[T.bodySm, { color: C.textMuted, fontSize: 11 }]}>{parseFloat(stop.distance_km).toFixed(1)} km away</Text>
                      )}
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color={C.gold} />
                    )}
                  </TouchableOpacity>
                );
              })}
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

// ─── TRIP NORMALIZATION ──────────────────────────────────────────────────
// /passenger/route-trip-options nests trips inside route options, with fare/
// GST/AC on the option and seats/vehicle/driver/timing on the trip. Flatten
// the two into the single shape RideCard/TripStopModal/handleConfirm expect,
// keeping the raw pieces around (__raw/__option) for re-matching after a
// refresh and for building the booking-session request.
const normalizeTrip = (apiTrip, option) => ({
  id: apiTrip.scheduled_trip_id,
  route_id: option.route?.id,
  route_name: option.route?.name,
  has_ac: option.route?.has_ac,
  planned_start_at: apiTrip.pickup_planned_time,
  dropoff_planned_time: apiTrip.dropoff_planned_time,
  vehicle: apiTrip.vehicle,
  driver: apiTrip.driver,
  trip_from_stop: apiTrip.pickup_stop,
  trip_to_stop: apiTrip.dropoff_stop,
  stops: option.route?.stops || [],
  available_seats: apiTrip.available_seats,
  seat_capacity: apiTrip.seat_capacity,
  trip_bookable: apiTrip.trip_bookable,
  fare_amount: option.fare_amount,
  gst_applicable: option.gst_applicable,
  gst_inclusive: option.gst_inclusive,
  total_tax_amount: option.total_tax_amount,
  __raw: apiTrip,
  __option: option,
});

// ─── MAIN SCREEN ───────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [userLocation, setUserLocation] = useState(null); // { lat, lng } — best-effort, for nearby stop search
  const [profileLoading, setProfileLoading] = useState(true);
  const [hasPassengerProfile, setHasPassengerProfile] = useState(false);

  const [allStops, setAllStops] = useState([]); // [{ stop: {...} }] — wrapped to match StopSelector's existing shape
  const [pickupStopId, setPickupStopId] = useState(null);
  const [dropoffStopId, setDropoffStopId] = useState(null);
  const [routeOptions, setRouteOptions] = useState([]); // raw items[] from /passenger/route-trip-options
  const [selectedTrip, setSelectedTrip] = useState(null); // normalized trip (see normalizeTrip)
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [tripStopModalVisible, setTripStopModalVisible] = useState(false);
  const [selectedTripStops, setSelectedTripStops] = useState([]);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [currentDriverInfo, setCurrentDriverInfo] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(true);

  const translateY = useRef(new Animated.Value(0)).current;

  // ── Shared loaders (used by initial mount effects AND by the passenger
  // API refresh WebSocket listener below). They preserve the user's current
  // pickup/dropoff selection instead of resetting it, per the "do not clear
  // filters on invalidation" contract.
  const loadStops = async ({ alertOnError = false } = {}) => {
    try {
      const { items } = await listStops(true);
      setAllStops((items || []).map((s) => ({ stop: s })));
    } catch (err) {
      console.warn('[HomeScreen] failed to load stops', err);
      if (alertOnError) Alert.alert('Error', 'Unable to load stops');
    }
  };

  const searchTrips = async ({ alertOnError = false } = {}) => {
    if (!pickupStopId || !dropoffStopId || pickupStopId === dropoffStopId) {
      setRouteOptions([]);
      return;
    }
    setSearching(true);
    try {
      const res = await getRouteTripOptions({ from_stop_id: pickupStopId, to_stop_id: dropoffStopId });
      const items = res.items || [];
      setRouteOptions(items);
      // Keep the selection if that exact trip is still offered; otherwise
      // clear it rather than silently substituting a different ride.
      setSelectedTrip((prev) => {
        if (!prev) return null;
        for (const opt of items) {
          const match = (opt.upcoming_scheduled_trips || []).find((t) => t.scheduled_trip_id === prev.id);
          if (match) return normalizeTrip(match, opt);
        }
        return null;
      });
    } catch (err) {
      console.warn('[HomeScreen] search failed', err);
      if (err.code === 'same_pickup_dropoff') {
        // Shouldn't happen given the guard above, but stay defensive.
        setRouteOptions([]);
      } else if (alertOnError) {
        Alert.alert('Error', err.message || 'Unable to search trips');
      }
      setRouteOptions([]);
    } finally {
      setSearching(false);
    }
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
    loadStops({ alertOnError: true });
  }, []);

  // Best-effort — nearby stop search just falls back to name-only/full-list
  // if permission is denied or location is unavailable. Never blocks the UI.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch (err) {
        console.warn('[HomeScreen] location unavailable', err);
      }
    })();
  }, []);

  useEffect(() => {
    setLoading(true);
    searchTrips({ alertOnError: true }).finally(() => setLoading(false));
  }, [pickupStopId, dropoffStopId]);

  useEffect(() => {
    if (pickupStopId && dropoffStopId && allStops.length) {
      const pk = allStops.find(s => s.stop?.id === pickupStopId);
      const dk = allStops.find(s => s.stop?.id === dropoffStopId);
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
  }, [pickupStopId, dropoffStopId, allStops]);

  // Passenger API refresh WebSocket: a driver creating a trip (trip.created),
  // a trip entering/leaving discovery (trip.catalog_changed), a seat-count
  // change (trip.seat_availability_changed), or a route/stop change means
  // the home search results may be stale. Refetch in place — keep the
  // pickup/dropoff filters exactly as the user left them.
  useEffect(() => {
    const handleRefresh = (payload) => {
      const resources = payload?.resources || payload?.keys || [];
      if (resources.length === 0) return;

      if (resources.some((r) => HOME_STOPS_RESOURCES.has(r))) {
        loadStops();
      }
      if (resources.some((r) => HOME_SEARCH_RESOURCES.has(r))) {
        searchTrips();
      }
    };
    eventEmitter.on('refreshData', handleRefresh);
    return () => eventEmitter.off('refreshData', handleRefresh);
  }, [pickupStopId, dropoffStopId]);

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

    if (!selectedTrip || !pickupStopId || !dropoffStopId) {
      Alert.alert('Incomplete', 'Select pickup, dropoff, and a ride first');
      return;
    }

    // Availability can change between discovery and booking — refresh
    // discovery right before navigating rather than trusting the last fetch.
    try {
      const res = await getRouteTripOptions({ from_stop_id: pickupStopId, to_stop_id: dropoffStopId });
      const items = res.items || [];
      setRouteOptions(items);
      let freshTrip = null;
      for (const opt of items) {
        const match = (opt.upcoming_scheduled_trips || []).find((t) => t.scheduled_trip_id === selectedTrip.id);
        if (match) { freshTrip = normalizeTrip(match, opt); break; }
      }
      if (!freshTrip || !freshTrip.trip_bookable || freshTrip.available_seats === 0) {
        setSelectedTrip(null);
        Alert.alert('No seats', 'This ride is no longer available. Please choose another.');
        return;
      }
      if (freshTrip.available_seats < 3) Alert.alert('Hurry!', `Only ${freshTrip.available_seats} seat(s) left.`);
      setSelectedTrip(freshTrip);

      navigation.navigate('SeatSelection', {
        scheduledTrip: { id: freshTrip.id, route_id: freshTrip.route_id, planned_start_at: freshTrip.planned_start_at },
        pickupStopId,
        dropoffStopId,
        fareAmount: parseFloat(freshTrip.fare_amount),
        farePreview: {
          amount: freshTrip.fare_amount,
          gst_applicable: freshTrip.gst_applicable,
          gst_inclusive: freshTrip.gst_inclusive,
          total_tax_amount: freshTrip.total_tax_amount,
        },
        routeName: freshTrip.route_name,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not verify availability. Try again.');
    }
  };

  const showDriverInfo = async (tripId) => {
    try {
      const info = await getDriverVehicleInfo(tripId);
      setCurrentDriverInfo(info);
      setDriverModalVisible(true);
    } catch { Alert.alert('Error', 'Could not fetch driver info'); }
  };

  // Derived directly from the selected trip's parent route option — fare and
  // GST breakdown are already embedded in the discovery response, so no
  // separate fare-preview call is needed.
  const fare = selectedTrip ? {
    amount: selectedTrip.fare_amount,
    gst_applicable: selectedTrip.gst_applicable,
    gst_inclusive: selectedTrip.gst_inclusive,
    total_tax_amount: selectedTrip.total_tax_amount,
    has_ac: selectedTrip.has_ac,
    route_name: selectedTrip.route_name,
  } : null;

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

          {/* Stop Selectors */}
          <Text style={[T.headingSm, { marginBottom: 10 }]}>Journey</Text>
          <StopSelector stops={allStops} selectedId={pickupStopId} onSelect={setPickupStopId} label="Pickup stop" icon="navigate-circle" accent="gold" userLocation={userLocation} excludeId={dropoffStopId} />
          <StopSelector stops={allStops} selectedId={dropoffStopId} onSelect={setDropoffStopId} label="Dropoff stop" icon="location" accent="blue" userLocation={userLocation} excludeId={pickupStopId} />

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
                {fare.gst_applicable && (
                  <Text style={[T.bodySm, { color: C.textMuted, marginTop: 2 }]}>
                    {fare.gst_inclusive ? 'GST included' : 'plus GST'} · ₹{fare.total_tax_amount} tax
                  </Text>
                )}
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
            {searching && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ActivityIndicator size="small" color={C.gold} />
                <Text style={[T.bodySm, { color: C.textMuted, fontSize: 11 }]}>Searching</Text>
              </View>
            )}
          </View>

          {!pickupStopId || !dropoffStopId ? (
            <GlassCard style={{ padding: 32, alignItems: 'center' }}>
              <Ionicons name="navigate-outline" size={44} color={C.textMuted} />
              <Text style={[T.bodyMd, { color: C.textMuted, marginTop: 12, textAlign: 'center' }]}>
                Select a pickup and dropoff stop to see available buses
              </Text>
            </GlassCard>
          ) : pickupStopId === dropoffStopId ? (
            <GlassCard style={{ padding: 32, alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={44} color={C.textMuted} />
              <Text style={[T.bodyMd, { color: C.textMuted, marginTop: 12, textAlign: 'center' }]}>
                Pickup and dropoff must be different stops
              </Text>
            </GlassCard>
          ) : loading && routeOptions.length === 0 ? (
            <View style={{ gap: 10 }}>
              {[1, 2].map(i => <Skeleton key={i} width="100%" height={100} borderRadius={20} />)}
            </View>
          ) : routeOptions.every(opt => (opt.upcoming_scheduled_trips || []).length === 0) ? (
            <GlassCard style={{ padding: 32, alignItems: 'center' }}>
              <Ionicons name="bus-outline" size={44} color={C.textMuted} />
              <Text style={[T.bodyMd, { color: C.textMuted, marginTop: 12 }]}>
                {routeOptions.length === 0 ? 'No route serves this pickup and dropoff yet' : 'No upcoming trips right now'}
              </Text>
            </GlassCard>
          ) : (
            routeOptions.map((option, optIdx) => {
              const optionTrips = option.upcoming_scheduled_trips || [];
              if (optionTrips.length === 0) return null;
              return (
                <View key={option.route?.id || optIdx} style={{ marginBottom: 4 }}>
                  {routeOptions.length > 1 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: optIdx > 0 ? 8 : 0 }}>
                      <Text style={[T.bodySm, { color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }]}>
                        {option.route?.name}
                      </Text>
                      {option.route?.has_ac && <GoldTag label="AC" />}
                    </View>
                  )}
                  {optionTrips.map((apiTrip) => {
                    const trip = normalizeTrip(apiTrip, option);
                    return (
                      <RideCard
                        key={trip.id}
                        trip={trip}
                        selected={selectedTrip?.id === trip.id}
                        onPress={() => setSelectedTrip(trip)}
                        onViewStops={() => { setSelectedTripStops(trip.stops); setTripStopModalVisible(true); }}
                        onInfoPress={() => showDriverInfo(trip.id)}
                        seatInfo={{ available: trip.available_seats, total: trip.seat_capacity }}
                      />
                    );
                  })}
                </View>
              );
            })
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