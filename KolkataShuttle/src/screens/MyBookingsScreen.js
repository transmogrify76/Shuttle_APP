import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { myBookings } from '../utils/dummyData';

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();

  const renderItem = ({ item }) => (
    <View className="bg-gray-900 rounded-xl p-4 mb-3 mx-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white font-bold text-base flex-1">{item.routeName}</Text>
        <View className={`px-3 py-1 rounded-full ${item.status === 'upcoming' ? 'bg-white' : 'bg-gray-800'}`}>
          <Text className={`text-xs font-bold ${item.status === 'upcoming' ? 'text-black' : 'text-gray-400'}`}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center mt-1">
        <Ionicons name="calendar" size={14} color="#aaa" />
        <Text className="text-gray-400 text-sm ml-2">{item.date} at {item.time}</Text>
      </View>
      <View className="flex-row items-center mt-1">
        <Ionicons name="bus" size={14} color="#aaa" />
        <Text className="text-gray-400 text-sm ml-2">{item.busType} | Seats: {item.seats.join(', ')} | ₹{item.fare}</Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <Header title="My Bookings" />
      {myBookings.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="calendar-outline" size={60} color="#444" />
          <Text className="text-gray-500 text-base mt-3">No bookings yet</Text>
        </View>
      ) : (
        <FlatList
          data={myBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}
    </View>
  );
}