import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import AnimatedButton from '../components/AnimatedButton';

export default function BookingConfirmationScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { route: busRoute, busType, seats, fare, otp } = route.params;
  const total = seats.length * fare;

  const formatTime = (time) => {
    if (!time) return 'TBD';
    const date = new Date(time);
    return isNaN(date.getTime()) ? time : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Booking Confirmed" />
      <ScrollView contentContainerClassName="items-center px-5 py-8">
        <View className="relative mb-4">
          <View className="absolute inset-0 bg-white/20 rounded-full w-24 h-24" />
          <Ionicons name="checkmark-circle" size={80} color="#fff" />
        </View>
        <Text className="text-white text-3xl font-bold text-center">Booking Confirmed!</Text>
        <Text className="text-gray-400 text-base text-center mt-2 mb-6">Your trip has been successfully booked.</Text>
        {otp && (
          <View className="bg-gray-900 rounded-2xl p-4 mb-6 w-full border border-gray-800">
            <Text className="text-gray-400 text-sm text-center mb-1">Boarding OTP</Text>
            <Text className="text-white text-4xl font-bold text-center tracking-widest">{otp}</Text>
            <Text className="text-gray-500 text-xs text-center mt-2">Show this to the driver at pickup</Text>
          </View>
        )}

        <LinearGradient colors={['#1a1a1a', '#0a0a0a']} className="w-full rounded-2xl p-5 mb-8 border border-gray-800">
          <View className="flex-row items-center mb-4 pb-3 border-b border-gray-800">
            <Ionicons name="bus-outline" size={22} color="#fff" />
            <Text className="text-white text-lg font-bold ml-3 flex-1">{busRoute.name}</Text>
          </View>
          <View className="flex-row items-center mb-3"><Ionicons name="car-sport" size={20} color="#fff" /><Text className="text-gray-300 text-base ml-3">Bus Type: {busType.toUpperCase()}</Text></View>
          <View className="flex-row items-center mb-3"><Ionicons name="time-outline" size={20} color="#fff" /><Text className="text-gray-300 text-base ml-3">Departure: {formatTime(busRoute.time)}</Text></View>
          <View className="flex-row items-center mb-3"><Ionicons name="grid-outline" size={20} color="#fff" /><Text className="text-gray-300 text-base ml-3">Seats: {seats.join(', ')}</Text></View>
          <View className="flex-row items-center mt-2 pt-3 border-t border-gray-800"><Ionicons name="cash-outline" size={22} color="#fff" /><Text className="text-white text-xl font-bold ml-3">Total Paid: ₹{total}</Text></View>
        </LinearGradient>

        <AnimatedButton
          title="View My Bookings"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}
          style={{ width: '100%', backgroundColor: '#fff' }}
          textStyle={{ color: '#000', fontWeight: 'bold' }}
        />
      </ScrollView>
    </View>
  );
}