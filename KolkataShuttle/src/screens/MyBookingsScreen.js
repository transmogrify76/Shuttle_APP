import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getUpcomingBookings, getPassengerHistory } from '../services/bookingApi';

export default function MyBookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'history'
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'upcoming') {
        const { items } = await getUpcomingBookings();
        setUpcoming(items);
      } else {
        const { items } = await getPassengerHistory();
        setHistory(items);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const statusColor = {
      booked: 'bg-green-900',
      pending_payment: 'bg-yellow-900',
      completed: 'bg-gray-800',
      cancelled: 'bg-red-900',
      missed: 'bg-red-900',
    }[item.booking_status] || 'bg-gray-800';

    const statusTextColor = {
      booked: 'text-green-400',
      pending_payment: 'text-yellow-400',
      completed: 'text-gray-400',
      cancelled: 'text-red-400',
      missed: 'text-red-400',
    }[item.booking_status] || 'text-gray-400';

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
        className="bg-gray-900 rounded-xl p-4 mb-3 mx-4"
      >
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-white font-bold text-base flex-1">
            {item.pickup_stop?.stop?.name} → {item.dropoff_stop?.stop?.name}
          </Text>
          <View className={`px-3 py-1 rounded-full ${statusColor}`}>
            <Text className={`text-xs font-bold ${statusTextColor}`}>
              {item.booking_status.toUpperCase()}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons name="calendar" size={14} color="#aaa" />
          <Text className="text-gray-400 text-sm ml-2">
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons name="cash" size={14} color="#aaa" />
          <Text className="text-gray-400 text-sm ml-2">₹{item.fare_amount}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const data = activeTab === 'upcoming' ? upcoming : history;

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

      {/* Tabs */}
      <View className="flex-row border-b border-gray-800">
        <TouchableOpacity
          onPress={() => setActiveTab('upcoming')}
          className={`flex-1 py-3 ${activeTab === 'upcoming' ? 'border-b-2 border-white' : ''}`}
        >
          <Text className={`text-center ${activeTab === 'upcoming' ? 'text-white font-bold' : 'text-gray-500'}`}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          className={`flex-1 py-3 ${activeTab === 'history' ? 'border-b-2 border-white' : ''}`}
        >
          <Text className={`text-center ${activeTab === 'history' ? 'text-white font-bold' : 'text-gray-500'}`}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {data.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="calendar-outline" size={60} color="#444" />
          <Text className="text-gray-500 text-base mt-3">
            No {activeTab === 'upcoming' ? 'upcoming' : 'past'} bookings
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}
    </View>
  );
}