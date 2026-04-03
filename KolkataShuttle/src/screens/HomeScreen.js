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
import RazorpayCheckout from 'react-native-razorpay';
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
  createBooking,
  verifyBookingPayment,
} from '../services/bookingApi';
import { getRouteBetweenStops } from '../services/routingApi';

const { height: screenHeight } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = screenHeight * 0.65;
const BOTTOM_SHEET_MIN_HEIGHT = screenHeight * 0.15;

// ----- Stop Selector Modal Component -----
const StopSelector = ({ stops, selectedId, onSelect, label }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedStop = stops.find(s => s.stop.id === selectedId);
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
            {stops.map(stop => (
              <TouchableOpacity
                key={stop.stop.id}
                className="py-3 border-b border-gray-100"
                onPress={() => {
                  onSelect(stop.stop.id);
                  setModalVisible(false);
                }}
              >
                <Text className="text-black">{stop.stop.name}</Text>
              </TouchableOpacity>
            ))}
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
const RideCard = ({ trip, selected, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const animateIn = () =>
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
  const animateOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const timeStr = new Date(trip.planned_start_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={animateIn}
      onPressOut={animateOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale }],
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            marginBottom: 12,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: selected ? '#000' : '#e5e5e5',
            backgroundColor: selected ? '#000' : '#fff',
          },
        ]}
      >
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: selected ? '#fff' : '#f5f5f5' }}
          >
            <Ionicons
              name="bus-outline"
              size={24}
              color={selected ? '#000' : '#666'}
            />
          </View>
          <View className="ml-3">
            <Text
              className={`font-bold text-base ${
                selected ? 'text-white' : 'text-black'
              }`}
            >
              {trip.route?.name || 'Bus'}
            </Text>
            <Text
              className={`text-xs ${
                selected ? 'text-gray-300' : 'text-gray-500'
              }`}
            >
              {timeStr} | {trip.available_seats} seats left
            </Text>
          </View>
        </View>
        <Text
          className={`font-bold text-lg ${
            selected ? 'text-white' : 'text-black'
          }`}
        >
          ₹{trip.base_fare || '--'}
        </Text>
      </Animated.View>
    </TouchableOpacity>
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

  // UI states
  const [sheetVisible, setSheetVisible] = useState(true);
  const translateY = useRef(new Animated.Value(0)).current;

  // Route drawing state
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // Pan responder for bottom sheet
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

  // Animate sheet when visibility changes
  useEffect(() => {
    if (sheetVisible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: BOTTOM_SHEET_MAX_HEIGHT,
        useNativeDriver: true,
      }).start();
    }
  }, [sheetVisible, translateY]);

  // Load routes on mount
  useEffect(() => {
    (async () => {
      try {
        const { items } = await listRoutes(true);
        setRoutesData(items);
        if (items.length) setSelectedRoute(items[0]);
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    })();
  }, []);

  // When route changes, fetch its stops and scheduled trips
  useEffect(() => {
    if (!selectedRoute) return;
    (async () => {
      try {
        setLoading(true);
        // Fetch route details for stops
        const routeDetail = await getRouteDetails(selectedRoute.id);
        setStops(routeDetail.stops.sort((a, b) => a.sequence_no - b.sequence_no));

        // Fetch scheduled trips for this route
        const { items } = await listScheduledTrips(selectedRoute.id, true);
        setTrips(items);
        if (items.length) setSelectedTrip(items[0]);
      } catch (err) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedRoute]);

  // Fetch route between pickup and dropoff stops and draw on map
  useEffect(() => {
    if (pickupStopId && dropoffStopId && stops.length) {
      const pickupStop = stops.find(s => s.stop.id === pickupStopId);
      const dropoffStop = stops.find(s => s.stop.id === dropoffStopId);
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
            console.warn('Failed to fetch route:', err);
            setRouteCoordinates([]);
          }
        })();
      }
    } else {
      setRouteCoordinates([]);
    }
  }, [pickupStopId, dropoffStopId, stops]);

  // Recalculate fare when stops or trip change
  useEffect(() => {
    if (selectedTrip && pickupStopId && dropoffStopId) {
      (async () => {
        try {
          const fareData = await previewFare({
            route_id: selectedRoute.id,
            pickup_stop_id: pickupStopId,
            dropoff_stop_id: dropoffStopId,
          });
          setFare(fareData);
        } catch (err) {
          console.log(err);
          setFare(null);
        }
      })();
    } else {
      setFare(null);
    }
  }, [selectedTrip, pickupStopId, dropoffStopId, selectedRoute]);

  const handleConfirm = () => {
  if (!selectedTrip || !pickupStopId || !dropoffStopId || !fare) {
    Alert.alert('Missing Info', 'Please select pickup, dropoff and a ride');
    return;
  }

  // Navigate to seat selection with all required data
  navigation.navigate('SeatSelection', {
    scheduledTrip: selectedTrip,
    pickupStopId,
    dropoffStopId,
    fareAmount: fare.amount,
    routeName: selectedRoute?.name,
  });
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
        {/* Draggable handle */}
        <View {...panResponder.panHandlers} className="items-center pt-3 pb-2">
          <View className="w-10 h-1 bg-gray-300 rounded-full" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >
          <Text className="text-4xl font-bold text-black mb-4">
            Where to, {firstName}?
          </Text>

          {/* Route selector (horizontal scroll) */}
          <Text className="text-black font-medium mb-1">Select Route</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            {routesData.map(route => (
              <TouchableOpacity
                key={route.id}
                onPress={() => setSelectedRoute(route)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedRoute?.id === route.id ? 'bg-black' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={
                    selectedRoute?.id === route.id ? 'text-white' : 'text-black'
                  }
                >
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
                {fare.route_name} – from stop {fare.pickup_sequence_no} to{' '}
                {fare.dropoff_sequence_no}
              </Text>
            </View>
          )}

          {/* Available rides */}
          <Text className="text-black text-lg font-semibold mt-6 mb-3">
            Available Rides
          </Text>
          {loading && trips.length === 0 ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            trips.map(trip => (
              <RideCard
                key={trip.id}
                trip={trip}
                selected={selectedTrip?.id === trip.id}
                onPress={() => setSelectedTrip(trip)}
              />
            ))
          )}

          {/* Confirm button */}
          <AnimatedButton
            title={`Confirm ₹${fare?.amount || '0'}`}
            onPress={handleConfirm}
            disabled={!selectedTrip || !pickupStopId || !dropoffStopId || !fare}
            style={{ marginTop: 20 }}
          />
          <Text className="text-center text-gray-500 text-xs mt-4">
            Scheduled rides available
          </Text>
        </ScrollView>
      </Animated.View>

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