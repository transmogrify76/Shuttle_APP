import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getRfidRides } from '../services/rfidApi';

export default function RfidRidesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadRides = async (refresh = false, pageNum = 1) => {
    if (refresh) setRefreshing(true);
    else if (pageNum === 1) setLoading(true);
    try {
      const data = await getRfidRides(pageNum, 25);
      if (refresh || pageNum === 1) setItems(data.items);
      else setItems(prev => [...prev, ...data.items]);
      setHasMore(data.items.length === 25);
      setPage(pageNum);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const onRefresh = () => loadRides(true, 1);
  const loadMore = () => { if (hasMore && !loading && !refreshing) loadRides(false, page + 1); };

  useEffect(() => { loadRides(); }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('RfidRideDetail', { rideId: item.id })} className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold">{item.pickup_stop?.name}</Text>
        <Text className="text-gray-400 text-xs">{new Date(item.boarded_at).toLocaleTimeString()}</Text>
      </View>
      {item.dropoff_stop && <Text className="text-gray-300 text-sm">→ {item.dropoff_stop.name}</Text>}
      <View className="flex-row justify-between mt-2">
        <Text className="text-gray-400 text-xs">Fare: ₹{item.final_fare_amount}</Text>
        <Text className={`text-xs font-bold ${item.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>{item.status.toUpperCase()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="RFID Rides" />
      {loading && !refreshing ? <ActivityIndicator size="large" color="#fff" /> : items.length === 0 ? (
        <View className="flex-1 justify-center items-center"><Ionicons name="bus-outline" size={60} color="#444" /><Text className="text-gray-500 mt-3">No RFID rides yet</Text></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </View>
  );
}