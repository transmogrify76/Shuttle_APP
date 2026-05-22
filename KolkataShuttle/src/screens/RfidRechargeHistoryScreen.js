import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { getRfidRecharges } from '../services/rfidApi';
import { C, T } from '../styles/design';

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
    <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[T.displayMd, { color: C.gold }]}>₹{item.amount}</Text>
        <View style={{ backgroundColor: item.status === 'credited' ? C.greenDim : C.redDim, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ color: item.status === 'credited' ? C.green : C.red, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' }}>{item.status}</Text>
        </View>
      </View>
      <Text style={[T.bodySm, { color: C.textMuted }]}>{new Date(item.created_at).toLocaleString()}</Text>
      {item.credited_at && <Text style={[T.bodySm, { marginTop: 4, color: C.textSecondary }]}>Credited: {new Date(item.credited_at).toLocaleString()}</Text>}
      {item.failed_at && <Text style={[T.bodySm, { marginTop: 4, color: C.red }]}>Failed: {new Date(item.failed_at).toLocaleString()}</Text>}
    </LinearGradient>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="Recharge History" />
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={C.gold} style={{ marginTop: 40 }} />
      ) : items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="time-outline" size={60} color={C.textMuted} /><Text style={[T.bodyMd, { marginTop: 12 }]}>No recharges</Text></View>
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