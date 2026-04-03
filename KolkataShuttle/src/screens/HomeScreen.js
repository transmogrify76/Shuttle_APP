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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import OSMMap from '../components/OSMMap';
import AnimatedButton from '../components/AnimatedButton';
import { useAuth } from '../context/AuthContext';
import {
  listRoutes,
  listScheduledTrips,
  getRouteDetails,
} from '../services/routeApi';
import { previewFare, getDriverVehicleInfo, getLegAvailableSeats } from '../services/bookingApi';
import { getRouteBetweenStops } from '../services/routingApi';

const { height: screenHeight } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = screenHeight * 0.65;
const BOTTOM_SHEET_MIN_HEIGHT = screenHeight * 0.15;

// ----- Stop Selector Modal Component (keys fixed) -----
const StopSelector = ({ stops, selectedId, onSelect, label }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedStop = stops?.find(s => s.stop?.id === selectedId);
  return (
    <>
      <TouchableOpacity
        className="flex-row items-center justify-between bg-gray-100 rounded-xl p-3 mb-2"
        onPress={() => setModalVisible(true)}
      >
        <View className="flex-row items-center">
          <Ionicons name="location-outline" size={20} color="#666" />
          <Text className="ml-2 text-black flex-1">
            {selectedStop ? selectedStop.stop.name : label}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5">
            <Text className="text-xl font-bold mb-4">{label}</Text>
            {stops?.length ? (
              stops.map((stop, idx) => (
                <TouchableOpacity
                  key={stop.stop?.id ? `${stop.stop.id}-${idx}` : `stop-${idx}`}
                  className="py-3 border-b border-gray-100"
                  onPress={() => {
                    onSelect(stop.stop?.id);
                    setModalVisible(false);
                  }}
                >
                  <Text className="text-black">{stop.stop?.name || stop.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="text-gray-500 text-center py-4">No stops available</Text>
            )}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              className="mt-4 py-3 bg-gray-200 rounded-full"
            >
              <Text className="text-center text-black">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ----- Ride Card Component -----
const RideCard = ({ trip, selected, onPress, onViewStops, onInfoPress, availableSeats }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const animateIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const animateOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const vehicle = trip?.vehicle || {};
  const vehicleName = vehicle?.vehicle_name || vehicle?.registration_number || 'Bus';
  const hasAC = vehicle?.has_ac;
  const seatCount = vehicle?.seat_count;
  const startTime = trip?.planned_start_at
    ? new Date(trip.planned_start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'TBD';
  const fromStop = trip?.trip_from_stop?.name || '?';
  const toStop = trip?.trip_to_stop?.name || '?';

  const seatsDisplay = availableSeats !== undefined
    ? `${availableSeats} seats left`
    : 'Checking availability...';

  return (
    <TouchableOpacity activeOpacity={1} onPressIn={animateIn} onPressOut={animateOut} onPress={onPress}>
      <Animated.View
        style={[
          {
            transform: [{ scale }],
            padding: 16,
            marginBottom: 12,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: selected ? '#000' : '#e5e5e5',
            backgroundColor: selected ? '#000' : '#fff',
          },
        ]}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: selected ? '#fff' : '#f5f5f5' }}
            >
              <Ionicons name="bus-outline" size={24} color={selected ? '#000' : '#666'} />
            </View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center flex-wrap">
                <Text className={`font-bold text-base ${selected ? 'text-white' : 'text-black'}`}>
                  {vehicleName}
                </Text>
                {hasAC && (
                  <View className="ml-2 px-2 py-0.5 rounded-full bg-green-100">
                    <Text className="text-green-700 text-xs font-bold">AC</Text>
                  </View>
                )}
              </View>
              <Text className={`text-xs ${selected ? 'text-gray-300' : 'text-gray-500'}`}>
                Starts at {startTime} • {seatCount} seats
              </Text>
              <Text className={`text-xs ${selected ? 'text-gray-400' : 'text-gray-500'}`}>
                {fromStop} → {toStop}
              </Text>
              <Text className={`text-xs ${selected ? 'text-gray-400' : 'text-gray-500'}`}>
                {seatsDisplay}
              </Text>
            </View>
          </View>
          <View className="flex-row">
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onViewStops(); }}
              className="px-3 py-1 rounded-full bg-gray-200 mr-2"
            >
              <Text className="text-black text-xs">Stops</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onInfoPress(); }}
              className="px-3 py-1 rounded-full bg-gray-200"
            >
              <Ionicons name="information-circle-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// ----- Modal for showing trip stops (keys fixed) -----
const TripStopModal = ({ visible, onClose, stops }) => {
  if (!stops) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-5 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Trip Stops</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {stops.map((stop, idx) => {
              const plannedTime = stop.planned_time_at_stop
                ? new Date(stop.planned_time_at_stop).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '--:--';
              const minutesFromStart = stop.minutes_from_trip_start ?? '?';
              const isPickup = stop.boarding_allowed;
              const isDropoff = stop.deboarding_allowed;
              return (
                <View key={stop.route_stop_id ? `${stop.route_stop_id}-${idx}` : `stop-${idx}`} className="flex-row items-start py-3 border-b border-gray-100">
                  <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center mr-3">
                    <Text className="text-black text-xs font-bold">{stop.sequence_no}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-black font-medium">{stop.stop?.name}</Text>
                    <Text className="text-gray-500 text-xs">
                      {minutesFromStart} min from start • {plannedTime}
                    </Text>
                    <View className="flex-row mt-1">
                      {isPickup && <Text className="text-green-600 text-xs mr-2">Pickup</Text>}
                      {isDropoff && <Text className="text-blue-600 text-xs">Dropoff</Text>}
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

// ----- Driver/Vehicle Info Modal -----
const DriverInfoModal = ({ visible, onClose, driverInfo }) => {
  if (!driverInfo) return null;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-center items-center p-5">
        <View className="bg-white rounded-2xl p-5 w-full">
          <Text className="text-xl font-bold mb-4">Driver & Vehicle</Text>
          <Text className="font-bold">Driver: {driverInfo.driver_name || 'N/A'}</Text>
          <Text className="text-gray-600 mt-1">
            Rating: {driverInfo.driver_average_rating?.toFixed(1)} ({driverInfo.driver_rating_count} reviews)
          </Text>
          <Text className="font-bold mt-3">Vehicle</Text>
          <Text>{driverInfo.vehicle_name || 'Bus'}</Text>
          <Text className="text-gray-600">{driverInfo.vehicle_model} ({driverInfo.vehicle_color})</Text>
          <Text className="text-gray-600">Reg: {driverInfo.vehicle_registration_number || 'N/A'}</Text>
          <TouchableOpacity onPress={onClose} className="mt-4 py-2 bg-black rounded-full">
            <Text className="text-white text-center">Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0] || 'User';

  // Data states
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

  // UI states
  const [sheetVisible, setSheetVisible] = useState(true);
  const translateY = useRef(new Animated.Value(0)).current;

  // Pan responder (unchanged)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else if (
          gestureState.dy < 0 &&
          translateY.__getValue() > -(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT)
        ) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          setSheetVisible(false);
        } else if (gestureState.dy < -50) {
          Animated.spring(translateY, {
            toValue: -(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT),
            useNativeDriver: true,
          }).start();
        } else {
          if (
            translateY.__getValue() <
            -(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT) / 2
          ) {
            Animated.spring(translateY, {
              toValue: -(BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT),
              useNativeDriver: true,
            }).start();
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        }
      },
    })
  ).current;

  useEffect(() => {
    if (sheetVisible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
    } else {
      Animated.spring(translateY, { toValue: BOTTOM_SHEET_MAX_HEIGHT, useNativeDriver: true }).start();
    }
  }, [sheetVisible]);

  // Load routes on mount
  useEffect(() => {
    (async () => {
      try {
        const { items } = await listRoutes(true);
        setRoutesData(items || []);
        if (items?.length) setSelectedRoute(items[0]);
      } catch (err) {
        Alert.alert('Error', 'Unable to load routes');
      }
    })();
  }, []);

  // When route changes, fetch its stops and scheduled trips
  useEffect(() => {
    if (!selectedRoute) return;
    (async () => {
      try {
        setLoading(true);
        const routeDetail = await getRouteDetails(selectedRoute.id);
        setStops(routeDetail.stops?.sort((a, b) => a.sequence_no - b.sequence_no) || []);
        const { items } = await listScheduledTrips(selectedRoute.id, true);
        setTrips(items || []);
        if (items?.length) setSelectedTrip(items[0]);
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedRoute]);

  // Draw route on map
  useEffect(() => {
    if (pickupStopId && dropoffStopId && stops.length) {
      const pickupStop = stops.find(s => s.stop?.id === pickupStopId);
      const dropoffStop = stops.find(s => s.stop?.id === dropoffStopId);
      if (pickupStop && dropoffStop) {
        (async () => {
          try {
            const coords = await getRouteBetweenStops(
              parseFloat(pickupStop.stop.lat),
              parseFloat(pickupStop.stop.lng),
              parseFloat(dropoffStop.stop.lat),
              parseFloat(dropoffStop.stop.lng)
            );
            setRouteCoordinates(coords);
          } catch (err) {
            setRouteCoordinates([]);
          }
        })();
      }
    } else {
      setRouteCoordinates([]);
    }
  }, [pickupStopId, dropoffStopId, stops]);

  // Fetch leg availability for all trips when stops are selected
  useEffect(() => {
    if (!pickupStopId || !dropoffStopId || trips.length === 0 || !selectedRoute) {
      setLegAvailability({});
      return;
    }

    const fetchAllLegAvailability = async () => {
      setLoadingSeats(true);
      const results = {};
      for (const trip of trips) {
        try {
          const seatInfo = await getLegAvailableSeats(
            trip.id,
            selectedRoute.id,
            pickupStopId,
            dropoffStopId
          );
          results[trip.id] = seatInfo.available_seats;
        } catch (err) {
          results[trip.id] = null;
        }
      }
      setLegAvailability(results);
      setLoadingSeats(false);
    };

    fetchAllLegAvailability();
  }, [pickupStopId, dropoffStopId, trips, selectedRoute]);

  // Fetch fare preview
  useEffect(() => {
    if (selectedTrip && pickupStopId && dropoffStopId && selectedRoute) {
      (async () => {
        try {
          const fareData = await previewFare({
            route_id: selectedRoute.id,
            pickup_stop_id: pickupStopId,
            dropoff_stop_id: dropoffStopId,
          });
          setFare(fareData);
        } catch (err) {
          setFare(null);
        }
      })();
    } else {
      setFare(null);
    }
  }, [selectedTrip, pickupStopId, dropoffStopId, selectedRoute]);

  const handleConfirm = async () => {
    if (!selectedTrip || !pickupStopId || !dropoffStopId || !fare) {
      Alert.alert('Missing Info', 'Please select pickup, dropoff and a ride');
      return;
    }

    // Double-check seat availability before proceeding
    try {
      const seatInfo = await getLegAvailableSeats(
        selectedTrip.id,
        selectedRoute.id,
        pickupStopId,
        dropoffStopId
      );
      if (!seatInfo.trip_bookable || seatInfo.available_seats === 0) {
        Alert.alert('No seats available', 'Sorry, no seats are available for this trip segment. Please choose another ride.');
        return;
      }
      if (seatInfo.available_seats < 3) {
        Alert.alert('Limited seats', `Only ${seatInfo.available_seats} seat(s) left. Be quick!`);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not verify seat availability. Please try again.');
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
    } catch (err) {
      Alert.alert('Error', 'Could not fetch driver info');
    }
  };

  return (
    <View className="flex-1 bg-black">
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <OSMMap routeCoordinates={routeCoordinates} />
      </View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: BOTTOM_SHEET_MAX_HEIGHT,
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: [{ translateY }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        <View {...panResponder.panHandlers} className="items-center pt-3 pb-2">
          <View className="w-10 h-1 bg-gray-300 rounded-full" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >
          <Text className="text-4xl font-bold text-black mb-4">Where to, {firstName}?</Text>

          {/* Route selector (horizontal scroll) – key fixed */}
          <Text className="text-black font-medium mb-1">Select Route</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {routesData.map((route, idx) => (
              <TouchableOpacity
                key={route.id ? `${route.id}-${idx}` : `route-${idx}`}
                onPress={() => setSelectedRoute(route)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedRoute?.id === route.id ? 'bg-black' : 'bg-gray-100'
                }`}
              >
                <Text className={selectedRoute?.id === route.id ? 'text-white' : 'text-black'}>
                  {route.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pickup stop */}
          <Text className="text-black font-medium mt-2 mb-1">Pickup Stop</Text>
          <StopSelector
            stops={stops}
            selectedId={pickupStopId}
            onSelect={setPickupStopId}
            label="Select pickup stop"
          />

          {/* Dropoff stop */}
          <Text className="text-black font-medium mt-2 mb-1">Dropoff Stop</Text>
          <StopSelector
            stops={stops}
            selectedId={dropoffStopId}
            onSelect={setDropoffStopId}
            label="Select dropoff stop"
          />

          {/* Fare preview */}
          {fare && (
            <View className="bg-gray-100 p-4 rounded-2xl mt-4">
              <Text className="text-black font-bold text-lg">
                Fare: ₹{fare.amount}
              </Text>
              <Text className="text-gray-600 text-sm">
                {fare.route_name} – from stop {fare.pickup_sequence_no} to {fare.dropoff_sequence_no}
              </Text>
            </View>
          )}

          {/* Available rides – key fixed */}
          <Text className="text-black text-lg font-semibold mt-6 mb-3">Available Buses</Text>
          {loading && trips.length === 0 ? (
            <ActivityIndicator size="large" color="#000" />
          ) : trips.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="bus-outline" size={48} color="#ccc" />
              <Text className="text-gray-500 mt-2">No buses available for this route</Text>
            </View>
          ) : (
            trips.map((trip, idx) => (
              <RideCard
                key={trip.id ? `${trip.id}-${idx}` : `trip-${idx}`}
                trip={trip}
                selected={selectedTrip?.id === trip.id}
                onPress={() => setSelectedTrip(trip)}
                onViewStops={() => {
                  setSelectedTripStops(trip.stops || []);
                  setTripStopModalVisible(true);
                }}
                onInfoPress={() => showDriverInfo(trip.id)}
                availableSeats={legAvailability[trip.id]}
              />
            ))
          )}
          {loadingSeats && (
            <ActivityIndicator size="small" color="#000" className="mt-2" />
          )}

          {/* Confirm button */}
          <AnimatedButton
            title={`Select Seats & Pay ₹${fare?.amount || '0'}`}
            onPress={handleConfirm}
            disabled={!selectedTrip || !pickupStopId || !dropoffStopId || !fare}
            style={{ marginTop: 20 }}
          />
          <Text className="text-center text-gray-500 text-xs mt-4">
            Scheduled rides available
          </Text>
        </ScrollView>
      </Animated.View>

      <TripStopModal
        visible={tripStopModalVisible}
        onClose={() => setTripStopModalVisible(false)}
        stops={selectedTripStops}
      />

      <DriverInfoModal
        visible={driverModalVisible}
        onClose={() => setDriverModalVisible(false)}
        driverInfo={currentDriverInfo}
      />

      {!sheetVisible && (
        <TouchableOpacity
          className="absolute bottom-6 right-6 bg-white rounded-full p-3 shadow-lg"
          onPress={() => setSheetVisible(true)}
        >
          <Ionicons name="chevron-up" size={24} color="#000" />
        </TouchableOpacity>
      )}
    </View>
  );
}