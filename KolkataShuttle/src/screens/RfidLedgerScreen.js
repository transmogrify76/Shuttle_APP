import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { getRfidLedger } from '../services/rfidApi';
import { C, T } from '../styles/design';

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
    <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[T.bodyMd, { fontWeight: 'bold', textTransform: 'capitalize' }]}>{item.entry_type.replace('_', ' ')}</Text>
        <Text style={[T.bodySm, { color: C.textMuted }]}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        {item.amount_delta !== '0.00' && (
          <Text style={{ color: parseFloat(item.amount_delta) > 0 ? C.green : C.red, fontWeight: '500' }}>
            {parseFloat(item.amount_delta) > 0 ? `+₹${item.amount_delta}` : `-₹${Math.abs(parseFloat(item.amount_delta))}`}
          </Text>
        )}
        {item.held_delta !== '0.00' && (
          <Text style={{ color: C.gold }}>Hold {parseFloat(item.held_delta) > 0 ? `+₹${item.held_delta}` : `-₹${Math.abs(parseFloat(item.held_delta))}`}</Text>
        )}
      </View>
      <Text style={[T.bodySm, { color: C.textMuted }]}>Balance: ₹{item.balance_after} (Hold: ₹{item.held_balance_after})</Text>
      {item.note && <Text style={[T.bodySm, { marginTop: 6, color: C.textSecondary }]}>{item.note}</Text>}
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="RFID Ledger" />
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.gold} /></View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="receipt-outline" size={60} color={C.textMuted} /><Text style={[T.bodyMd, { marginTop: 12 }]}>No ledger entries</Text></View>
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