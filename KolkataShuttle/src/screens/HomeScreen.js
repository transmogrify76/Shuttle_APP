import React, { useState, useEffect } from 'react';
import { View, TextInput,Text,  ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import OSMMap from '../components/OSMMap';
import RideOptionCard from '../components/RideOptionCard';
import { useAuth } from '../context/AuthContext';
import { routes } from '../utils/dummyData';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0] || 'User';

  const [userLocation, setUserLocation] = useState(null);
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedRide, setSelectedRide] = useState(null);
  const [rides, setRides] = useState([]);

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
        icon: 'bus-outline',
        name: route.name.split(' → ')[0],
        price: route.fare.ac,
        duration: route.time,
        route,
        busType: 'ac',
      }));
      setRides(rideOptions);
      setSelectedRide(rideOptions[0]);
    }
  }, [routes]);

  const handleConfirm = () => {
    if (selectedRide) {
      navigation.navigate('SeatSelection', {
        route: selectedRide.route,
        busType: selectedRide.busType,
      });
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <View className="flex-1">
        <View style={{ height: '50%', width: '100%', paddingTop: insets.top }}>
          <OSMMap userLocation={userLocation} />
        </View>

        <View
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-lg"
          style={{ paddingBottom: insets.bottom }}
        >
          <View className="w-10 h-1 bg-gray-300 rounded-full self-center mt-3 mb-4" />

          <ScrollView showsVerticalScrollIndicator={false} className="px-5">
            <Text className="text-3xl font-bold text-black mb-4">Where to, {firstName}?</Text>

            <View className="bg-gray-50 rounded-2xl mb-6 py-2">
              <View className="flex-row items-center px-4 py-3">
                <View className="w-3 h-3 rounded-full bg-black mr-3" />
                <TextInput
                  className="flex-1 text-base text-black"
                  placeholder="Pickup location"
                  value={pickup}
                  onChangeText={setPickup}
                  placeholderTextColor="#aaa"
                />
              </View>
              <View className="flex-row items-center px-4 py-3">
                <View className="w-3 h-3 bg-black mr-3" />
                <TextInput
                  className="flex-1 text-base text-black"
                  placeholder="Destination"
                  value={destination}
                  onChangeText={setDestination}
                  placeholderTextColor="#aaa"
                />
              </View>
            </View>

            <Text className="text-lg font-semibold text-black mb-2">Choose a ride</Text>
            {rides.map(ride => (
              <RideOptionCard
                key={ride.id}
                icon={ride.icon}
                name={ride.name}
                price={ride.price}
                duration={ride.duration}
                selected={selectedRide?.id === ride.id}
                onSelect={() => setSelectedRide(ride)}
              />
            ))}

            <TouchableOpacity
              className={`mt-4 mb-6 py-3 rounded-full items-center ${selectedRide && destination ? 'bg-black' : 'bg-gray-300'}`}
              onPress={handleConfirm}
              disabled={!selectedRide || !destination}
            >
              <Text className="text-white font-semibold text-base">Confirm ₹{selectedRide ? selectedRide.price : ''}</Text>
            </TouchableOpacity>

            <Text className="text-center text-gray-500 text-xs mb-8">Scheduled rides available</Text>
          </ScrollView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}