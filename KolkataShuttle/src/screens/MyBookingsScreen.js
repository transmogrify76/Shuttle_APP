import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { getUpcomingBookings, getPassengerHistory } from '../services/bookingApi';

const StatusBadge = ({ status }) => {
  let config = {
    booked: { bg: 'bg-green-500/20', text: 'text-green-400', icon: 'checkmark-circle', label: 'Confirmed' },
    pending_payment: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: 'time', label: 'Pending' },
    completed: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: 'checkmark-done', label: 'Completed' },
    cancelled: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'close-circle', label: 'Cancelled' },
    missed: { bg: 'bg-red-500/20', text: 'text-red-400', icon: 'alert-circle', label: 'Missed' },
  };
  const c = config[status] || config.booked;
  return (
    <View className={`flex-row items-center px-3 py-1 rounded-full ${c.bg}`}>
      <Ionicons name={c.icon} size={12} color={c.text.replace('text-', '')} />
      <Text className={`text-xs font-bold ml-1 ${c.text}`}>{c.label}</Text>
    </View>
  );
};

export default function MyBookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      if (activeTab === 'upcoming') {
        const { items } = await getUpcomingBookings();
        setUpcoming(items || []);
      } else {
        const { items } = await getPassengerHistory();
        setHistory(items || []);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const onRefresh = () => loadData(true);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const renderBookingItem = ({ item }) => {
    const pickupName = item.pickup_stop?.stop?.name || 'Pickup';
    const dropoffName = item.dropoff_stop?.stop?.name || 'Dropoff';
    const date = formatDate(item.created_at);
    const time = formatTime(item.created_at);
    const seats = item.seats ? item.seats.join(', ') : '—';

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
        className="mx-4 mb-4"
      >
        <LinearGradient
          colors={['#1a1a1a', '#0d0d0d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-2xl p-4 border border-gray-800"
        >
          <View className="flex-row justify-between items-start mb-3">
            <View className="flex-1">
              <Text className="text-white font-bold text-base">{pickupName}</Text>
              <View className="flex-row items-center my-1">
                <Ionicons name="arrow-down" size={14} color="#666" />
                <Text className="text-gray-400 text-xs ml-1">to</Text>
              </View>
              <Text className="text-white font-bold text-base">{dropoffName}</Text>
            </View>
            <StatusBadge status={item.booking_status} />
          </View>

          <View className="flex-row items-center mt-2 pt-2 border-t border-gray-800">
            <View className="flex-row items-center mr-4">
              <Ionicons name="calendar-outline" size={14} color="#aaa" />
              <Text className="text-gray-400 text-xs ml-1">{date}</Text>
            </View>
            <View className="flex-row items-center mr-4">
              <Ionicons name="time-outline" size={14} color="#aaa" />
              <Text className="text-gray-400 text-xs ml-1">{time}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="cash-outline" size={14} color="#aaa" />
              <Text className="text-gray-400 text-xs ml-1">₹{item.fare_amount}</Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center mt-3">
            <View className="flex-row items-center">
              <Ionicons name="bus-outline" size={14} color="#aaa" />
              <Text className="text-gray-400 text-xs ml-1">Seats: {seats}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const data = activeTab === 'upcoming' ? upcoming : history;
  const isEmpty = (!loading && data.length === 0);

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="My Bookings" />

      <View className="flex-row border-b border-gray-800 mx-4 mt-2">
        <TouchableOpacity
          onPress={() => setActiveTab('upcoming')}
          className={`flex-1 py-3 ${activeTab === 'upcoming' ? 'border-b-2 border-white' : ''}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'upcoming' ? 'text-white' : 'text-gray-500'}`}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('history')}
          className={`flex-1 py-3 ${activeTab === 'history' ? 'border-b-2 border-white' : ''}`}
        >
          <Text className={`text-center font-semibold ${activeTab === 'history' ? 'text-white' : 'text-gray-500'}`}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : isEmpty ? (
        <View className="flex-1 justify-center items-center px-8">
          <Ionicons name="calendar-outline" size={80} color="#333" />
          <Text className="text-gray-500 text-lg font-semibold mt-4 text-center">
            No {activeTab === 'upcoming' ? 'upcoming' : 'past'} bookings
          </Text>
          <Text className="text-gray-600 text-sm mt-2 text-center">
            {activeTab === 'upcoming' 
              ? 'You have no upcoming trips. Book a ride from the home screen.' 
              : 'Your past trips will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        />
      )}
    </View>
  );
}