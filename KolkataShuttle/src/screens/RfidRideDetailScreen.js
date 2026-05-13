import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getRfidRideDetail } from '../services/rfidApi';

export default function RfidRideDetailScreen({ route }) {
  const { rideId } = route.params;
  const insets = useSafeAreaInsets();
  const [rideDetail, setRideDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, []);

  const loadDetail = async () => {
    try {
      const data = await getRfidRideDetail(rideId);
      setRideDetail(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator size="large" color="#fff" /></View>;
  const ride = rideDetail.ride;

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="RFID Ride Details" />
      <ScrollView className="flex-1 px-5 pt-5">
        <View className="bg-gray-900 rounded-2xl p-4 mb-4">
          <Text className="text-white text-lg font-bold mb-2">Trip Info</Text>
          <Text className="text-gray-300">Pickup: {ride.pickup_stop?.name}</Text>
          <Text className="text-gray-300 mt-1">Boarded at: {new Date(ride.boarded_at).toLocaleString()}</Text>
          {ride.dropoff_stop && <Text className="text-gray-300 mt-1">Dropoff: {ride.dropoff_stop.name}</Text>}
          {ride.dropped_at && <Text className="text-gray-300 mt-1">Dropped at: {new Date(ride.dropped_at).toLocaleString()}</Text>}
          <Text className="text-gray-300 mt-2">Hold amount: ₹{ride.hold_amount}</Text>
          <Text className="text-gray-300">Final fare: ₹{ride.final_fare_amount}</Text>
          {ride.reversed_amount && <Text className="text-red-400 mt-1">Reversed: ₹{ride.reversed_amount}</Text>}
          <Text className="text-gray-400 text-xs mt-2">Status: {ride.status}</Text>
        </View>

        {rideDetail.ledger_entries?.length > 0 && (
          <View className="bg-gray-900 rounded-2xl p-4 mb-4">
            <Text className="text-white text-lg font-bold mb-2">Wallet Movements</Text>
            {rideDetail.ledger_entries.map((entry, idx) => (
              <View key={idx} className="border-b border-gray-800 py-2">
                <Text className="text-gray-300 text-sm">{entry.entry_type.replace('_', ' ')}</Text>
                <Text className="text-gray-400 text-xs">{new Date(entry.created_at).toLocaleString()}</Text>
                <View className="flex-row justify-between mt-1">
                  {entry.amount_delta !== '0.00' && <Text className={entry.amount_delta > 0 ? 'text-green-500' : 'text-red-500'}>₹{entry.amount_delta}</Text>}
                  {entry.held_delta !== '0.00' && <Text className="text-yellow-500">Hold: {entry.held_delta}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}