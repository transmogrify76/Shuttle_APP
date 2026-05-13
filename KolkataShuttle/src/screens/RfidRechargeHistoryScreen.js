import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getRfidRecharges } from '../services/rfidApi';

export default function RfidRechargeHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadRecharges = async (refresh = false, pageNum = 1) => {
    if (refresh) setRefreshing(true);
    else if (pageNum === 1) setLoading(true);
    try {
      const data = await getRfidRecharges(pageNum, 25);
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

  const onRefresh = () => loadRecharges(true, 1);
  const loadMore = () => { if (hasMore && !loading && !refreshing) loadRecharges(false, page + 1); };

  useEffect(() => { loadRecharges(); }, []);

  const renderItem = ({ item }) => (
    <View className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold">₹{item.amount}</Text>
        <View className={`px-2 py-1 rounded-full ${item.status === 'credited' ? 'bg-green-900' : 'bg-red-900'}`}>
          <Text className="text-white text-xs font-bold uppercase">{item.status}</Text>
        </View>
      </View>
      <Text className="text-gray-400 text-xs">{new Date(item.created_at).toLocaleString()}</Text>
      {item.credited_at && <Text className="text-gray-500 text-xs mt-1">Credited: {new Date(item.credited_at).toLocaleString()}</Text>}
      {item.failed_at && <Text className="text-red-400 text-xs mt-1">Failed: {new Date(item.failed_at).toLocaleString()}</Text>}
    </View>
  );

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="Recharge History" />
      {loading && !refreshing ? <ActivityIndicator size="large" color="#fff" /> : items.length === 0 ? (
        <View className="flex-1 justify-center items-center"><Ionicons name="time-outline" size={60} color="#444" /><Text className="text-gray-500 mt-3">No recharges</Text></View>
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