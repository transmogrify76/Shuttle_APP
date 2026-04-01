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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import OSMMap from '../components/OSMMap';
import AnimatedButton from '../components/AnimatedButton';
import { useAuth } from '../context/AuthContext';
import { routes } from '../utils/dummyData';

const { height: screenHeight } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = screenHeight * 0.65;
const BOTTOM_SHEET_MIN_HEIGHT = screenHeight * 0.15;

const RideCard = ({ name, price, duration, icon, selected, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

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
            shadowColor: selected ? '#000' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: selected ? 0.1 : 0,
            shadowRadius: 4,
            elevation: selected ? 2 : 0,
          },
        ]}
      >
        <View className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: selected ? '#fff' : '#f5f5f5' }}
          >
            <Ionicons name={icon} size={24} color={selected ? '#000' : '#666'} />
          </View>
          <View className="ml-3">
            <Text className={`font-bold text-base ${selected ? 'text-white' : 'text-black'}`}>
              {name}
            </Text>
            <Text className={`text-xs ${selected ? 'text-gray-300' : 'text-gray-500'}`}>
              {duration}
            </Text>
          </View>
        </View>
        <Text className={`font-bold text-lg ${selected ? 'text-white' : 'text-black'}`}>
          ₹{price}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0] || 'User';

  const [userLocation, setUserLocation] = useState(null);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [rides, setRides] = useState([]);
  const [sheetVisible, setSheetVisible] = useState(true);

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setPickup('Your current location');
      }
    })();
  }, []);

  useEffect(() => {
    if (routes.length) {
      const rideOptions = routes.map(route => ({
        id: route.id,
        name: route.name.split(' → ')[0],
        price: route.fare.ac,
        duration: route.time,
        route,
        busType: 'ac',
        icon: 'bus-outline',
      }));
      setRides(rideOptions);
      setSelectedRide(rideOptions[0]);
    }
  }, [routes]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else if (gestureState.dy < 0 && translateY.__getValue() > - (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT)) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          setSheetVisible(false);
        } else if (gestureState.dy < -50) {
          Animated.spring(translateY, {
            toValue: - (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT),
            useNativeDriver: true,
          }).start();
        } else {
          if (translateY.__getValue() < - (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT) / 2) {
            Animated.spring(translateY, {
              toValue: - (BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT),
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
  }, [sheetVisible]);

  const handleConfirm = () => {
    if (selectedRide && destination) {
      navigation.navigate('SeatSelection', {
        route: selectedRide.route,
        busType: selectedRide.busType,
      });
    }
  };

  return (
    <View className="flex-1 bg-black">
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <OSMMap userLocation={userLocation} />
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

          <View className="bg-gray-100 rounded-2xl mb-6 py-2">
            <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
              <Ionicons name="location-outline" size={20} color="#000" />
              <TextInput
                className="flex-1 text-black ml-3 text-base"
                placeholder="Pickup location"
                placeholderTextColor="#666"
                value={pickup}
                onChangeText={setPickup}
              />
            </View>
            <View className="flex-row items-center px-4 py-3">
              <Ionicons name="navigate-outline" size={20} color="#000" />
              <TextInput
                className="flex-1 text-black ml-3 text-base"
                placeholder="Destination"
                placeholderTextColor="#666"
                value={destination}
                onChangeText={setDestination}
              />
            </View>
          </View>

          <Text className="text-black text-lg font-semibold mb-3">Choose a ride</Text>
          {rides.map(ride => (
            <RideCard
              key={ride.id}
              name={ride.name}
              price={ride.price}
              duration={ride.duration}
              icon={ride.icon}
              selected={selectedRide?.id === ride.id}
              onPress={() => setSelectedRide(ride)}
            />
          ))}

          <AnimatedButton
            title={`Confirm ₹${selectedRide ? selectedRide.price : ''}`}
            onPress={handleConfirm}
            disabled={!selectedRide || !destination}
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