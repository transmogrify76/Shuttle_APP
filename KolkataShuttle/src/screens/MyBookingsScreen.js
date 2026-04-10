import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getUpcomingBookings, getPassengerHistory, getDriverVehicleInfo } from '../services/bookingApi';
import { eventEmitter } from '../utils/eventEmitter';

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

export default function MyBookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [currentDriverInfo, setCurrentDriverInfo] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    const handleRefresh = (data) => {
      const { keys } = data;
      if (keys.includes('bookings_list') || keys.includes('history')) {
        loadData(true);
      }
    };
    eventEmitter.on('refreshData', handleRefresh);
    return () => eventEmitter.off('refreshData', handleRefresh);
  }, [activeTab]);

  const loadData = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      if (activeTab === 'upcoming') {
        const response = await getUpcomingBookings();
        setUpcoming(response.items || []);
      } else {
        const response = await getPassengerHistory();
        setHistory(response.items || []);
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Unable to load bookings');
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const onRefresh = () => loadData(true);

  const showDriverInfo = async (tripId) => {
    if (!tripId) return;
    try {
      const info = await getDriverVehicleInfo(tripId);
      setCurrentDriverInfo(info);
      setDriverModalVisible(true);
    } catch (err) {
      Alert.alert('Error', 'Could not fetch driver info');
    }
  };

  const renderBookingItem = ({ item, index }) => {
    const pickupName = item.pickup_stop?.stop?.name || item.pickup_stop?.name || 'Pickup';
    const dropoffName = item.dropoff_stop?.stop?.name || item.dropoff_stop?.name || 'Dropoff';
    const status = item.booking_status || 'unknown';

    let statusColor = 'bg-gray-800';
    let statusTextColor = 'text-gray-400';
    if (status === 'booked' || status === 'pending_payment') {
      statusColor = 'bg-green-900';
      statusTextColor = 'text-green-400';
    } else if (status === 'completed') {
      statusColor = 'bg-blue-900';
      statusTextColor = 'text-blue-400';
    } else if (status === 'cancelled' || status === 'canceled' || status === 'missed') {
      statusColor = 'bg-red-900';
      statusTextColor = 'text-red-400';
    }

    // AC badge from route (if present in the response)
    const hasAc = item.route?.has_ac;

    return (
      <TouchableOpacity
        key={item.id || index}
        onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })}
        className="bg-gray-900 rounded-xl p-4 mb-3 mx-4 border border-gray-800"
      >
        <View className="flex-row justify-between items-center mb-2">
          <View className="flex-row items-center flex-1">
            <Text className="text-white font-bold text-base flex-1">
              {pickupName} → {dropoffName}
            </Text>
            {hasAc && (
              <View className="ml-2 px-2 py-0.5 rounded-full bg-green-100">
                <Text className="text-green-700 text-xs font-bold">AC</Text>
              </View>
            )}
          </View>
          <View className={`px-3 py-1 rounded-full ${statusColor}`}>
            <Text className={`text-xs font-bold ${statusTextColor}`}>
              {status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center mb-1">
          <Ionicons name="bus-outline" size={14} color="#aaa" />
          <Text className="text-gray-400 text-sm ml-2">Shuttle</Text>
        </View>
        <View className="flex-row items-center mb-1">
          <Ionicons name="time-outline" size={14} color="#aaa" />
          <Text className="text-gray-400 text-sm ml-2">
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View className="flex-row items-center mb-1">
          <Ionicons name="cash-outline" size={14} color="#aaa" />
          <Text className="text-gray-400 text-sm ml-2">₹{item.fare_amount}</Text>
        </View>
        {item.scheduled_trip_id && (
          <TouchableOpacity
            onPress={() => showDriverInfo(item.scheduled_trip_id)}
            className="mt-2 flex-row items-center"
          >
            <Ionicons name="car-outline" size={14} color="#aaa" />
            <Text className="text-gray-400 text-xs ml-1">View driver & vehicle</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const data = activeTab === 'upcoming' ? upcoming : history;
  const isEmpty = (!loading && data.length === 0);

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="My Bookings" />
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

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : isEmpty ? (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="calendar-outline" size={60} color="#444" />
          <Text className="text-gray-500 text-base mt-3">
            No {activeTab === 'upcoming' ? 'upcoming' : 'past'} bookings
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => item.id || index.toString()}
          renderItem={renderBookingItem}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}

      <DriverInfoModal
        visible={driverModalVisible}
        onClose={() => setDriverModalVisible(false)}
        driverInfo={currentDriverInfo}
      />
    </View>
  );
}