import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { getRfidRides } from '../services/rfidApi';
import { C, T } from '../styles/design';

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

  const renderItem = ({ item }) => {
    const netFare = item.fare_net_amount !== undefined ? item.fare_net_amount : item.fare_amount;
    const hasReversal = item.fare_reversed_amount && parseFloat(item.fare_reversed_amount) !== 0;
    return (
      <TouchableOpacity onPress={() => navigation.navigate('RfidRideDetail', { rideId: item.id })}>
        <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[T.bodyMd, { fontWeight: 'bold' }]}>{item.pickup_stop?.name}</Text>
            <Text style={[T.bodySm, { color: C.textMuted }]}>{new Date(item.boarded_at).toLocaleTimeString()}</Text>
          </View>
          {item.dropoff_stop && <Text style={[T.bodySm, { marginBottom: 8 }]}>→ {item.dropoff_stop.name}</Text>}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[T.bodySm, { color: C.textMuted }]}>Fare: ₹{netFare}</Text>
            {hasReversal && <Text style={{ color: C.gold, fontSize: 10, fontWeight: 'bold' }}>Reversal applied</Text>}
            <Text style={{ color: item.status === 'completed' ? C.green : C.gold, fontSize: 10, fontWeight: 'bold' }}>{item.status.toUpperCase()}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="RFID Rides" />
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.gold} /></View>
      ) : items.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="bus-outline" size={60} color={C.textMuted} />
          <Text style={[T.bodyMd, { marginTop: 12 }]}>No RFID rides yet</Text>
        </View>
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