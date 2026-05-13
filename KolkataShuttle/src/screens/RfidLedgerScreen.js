import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getRfidLedger } from '../services/rfidApi';

export default function RfidLedgerScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadLedger = async (refresh = false, pageNum = 1) => {
    if (refresh) setRefreshing(true);
    else if (pageNum === 1) setLoading(true);
    try {
      const data = await getRfidLedger(pageNum, 25);
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

  const onRefresh = () => loadLedger(true, 1);
  const loadMore = () => { if (hasMore && !loading && !refreshing) loadLedger(false, page + 1); };

  useEffect(() => { loadLedger(); }, []);

  const renderItem = ({ item }) => (
    <View className="bg-gray-900 rounded-xl p-4 mb-3 border border-gray-800">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-white font-bold capitalize">{item.entry_type.replace('_', ' ')}</Text>
        <Text className="text-gray-400 text-xs">{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <View className="flex-row justify-between">
        {item.amount_delta !== '0.00' && (
          <Text className={item.amount_delta > 0 ? 'text-green-500' : 'text-red-500'}>
            {item.amount_delta > 0 ? `+₹${item.amount_delta}` : `-₹${Math.abs(item.amount_delta)}`}
          </Text>
        )}
        {item.held_delta !== '0.00' && (
          <Text className="text-yellow-500">Hold {item.held_delta > 0 ? `+₹${item.held_delta}` : `-₹${Math.abs(item.held_delta)}`}</Text>
        )}
      </View>
      <Text className="text-gray-400 text-xs mt-2">Balance: ₹{item.balance_after} (Hold: ₹{item.held_balance_after})</Text>
      {item.note && <Text className="text-gray-500 text-xs mt-1">{item.note}</Text>}
    </View>
  );

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="RFID Ledger" />
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#fff" /></View>
      ) : items.length === 0 ? (
        <View className="flex-1 justify-center items-center"><Ionicons name="receipt-outline" size={60} color="#444" /><Text className="text-gray-500 mt-3">No ledger entries</Text></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
        />
      )}
    </View>
  );
}