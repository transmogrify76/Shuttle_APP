import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import AnimatedButton from '../components/AnimatedButton';

export default function BookingConfirmationScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { route: busRoute, busType, seats, fare } = route.params;
  const total = seats.length * fare;

  const handleDone = () => navigation.navigate('MainTabs', { screen: 'Bookings' });

  return (
    <View className="flex-1 bg-black">
      <Header title="Booking Confirmed" />
      <ScrollView contentContainerClassName="items-center px-5 py-8">
        <Ionicons name="checkmark-circle" size={80} color="#fff" />
        <Text className="text-white text-2xl font-bold mt-4 mb-6">Thank you for booking!</Text>

        <View className="bg-gray-900 w-full rounded-2xl p-5 mb-8">
          <View className="flex-row items-center mb-3">
            <Ionicons name="bus" size={20} color="#fff" />
            <Text className="text-gray-200 text-base ml-3">{busRoute.name}</Text>
          </View>
          <View className="flex-row items-center mb-3">
            <Ionicons name="car-sport" size={20} color="#fff" />
            <Text className="text-gray-200 text-base ml-3">{busType.toUpperCase()} Bus</Text>
          </View>
          <View className="flex-row items-center mb-3">
            <Ionicons name="time" size={20} color="#fff" />
            <Text className="text-gray-200 text-base ml-3">{busRoute.time}</Text>
          </View>
          <View className="flex-row items-center mb-3">
            <Ionicons name="grid" size={20} color="#fff" />
            <Text className="text-gray-200 text-base ml-3">Seats: {seats.join(', ')}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="cash" size={20} color="#fff" />
            <Text className="text-gray-200 text-base ml-3">Total: ₹{total}</Text>
          </View>
        </View>

        <AnimatedButton title="View My Bookings" onPress={handleDone} />
      </ScrollView>
    </View>
  );
}