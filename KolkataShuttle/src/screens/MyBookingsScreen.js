import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { listBookings } from '../services/bookingApi';

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { items } = await listBookings(); // fetch all or filter by status
      setBookings(items);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <View className="bg-gray-900 rounded-xl p-4 mb-3 mx-4">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-white font-bold text-base flex-1">
          {item.pickup_stop?.stop?.name} → {item.dropoff_stop?.stop?.name}
        </Text>
        <View className={`px-3 py-1 rounded-full ${item.booking_status === 'booked' ? 'bg-green-900' : 'bg-gray-800'}`}>
          <Text className={`text-xs font-bold ${item.booking_status === 'booked' ? 'text-green-400' : 'text-gray-400'}`}>
            {item.booking_status.toUpperCase()}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center mt-1">
        <Ionicons name="calendar" size={14} color="#aaa" />
        <Text className="text-gray-400 text-sm ml-2">{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View className="flex-row items-center mt-1">
        <Ionicons name="cash" size={14} color="#aaa" />
        <Text className="text-gray-400 text-sm ml-2">₹{item.fare_amount}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="My Bookings" />
      {bookings.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="calendar-outline" size={60} color="#444" />
          <Text className="text-gray-500 text-base mt-3">No bookings yet</Text>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}
    </View>
  );
}