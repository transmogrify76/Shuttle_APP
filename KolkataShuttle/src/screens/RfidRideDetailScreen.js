import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { getRfidRideDetail } from '../services/rfidApi';
import { eventEmitter } from '../utils/eventEmitter';
import { C, T } from '../styles/design';

const RELEVANT_RESOURCES = new Set(['rfid_rides']);

export default function RfidRideDetailScreen({ route }) {
  const { rideId } = route.params;
  const insets = useSafeAreaInsets();
  const [rideDetail, setRideDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();

    // rfid.scan_completed refreshes rides + "ride detail if open" per the
    // passenger refresh contract — this screen being mounted means it's open.
    const handleRefresh = (payload) => {
      const resources = payload?.resources || payload?.keys || [];
      if (resources.some((r) => RELEVANT_RESOURCES.has(r))) {
        loadDetail();
      }
    };
    eventEmitter.on('refreshData', handleRefresh);
    return () => eventEmitter.off('refreshData', handleRefresh);
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

  if (loading) return <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={C.gold} /></View>;
  const ride = rideDetail.ride;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="RFID Ride Details" />
      <ScrollView style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
          <Text style={[T.headingSm, { marginBottom: 12 }]}>Trip Info</Text>
          {[
            { label: 'Pickup', value: ride.pickup_stop?.name },
            { label: 'Boarded at', value: new Date(ride.boarded_at).toLocaleString() },
            ride.dropoff_stop && { label: 'Dropoff', value: ride.dropoff_stop.name },
            ride.dropped_at && { label: 'Dropped at', value: new Date(ride.dropped_at).toLocaleString() },
            { label: 'Hold amount', value: `₹${ride.hold_amount}` },
            { label: 'Final fare', value: `₹${ride.final_fare_amount}` },
            ride.reversed_amount && { label: 'Reversed', value: `₹${ride.reversed_amount}`, color: C.red },
            { label: 'Status', value: ride.status.toUpperCase() },
          ].filter(Boolean).map((field, idx) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: idx < 6 ? 1 : 0, borderBottomColor: C.border }}>
              <Text style={[T.bodySm, { color: C.textMuted }]}>{field.label}</Text>
              <Text style={[T.bodyMd, { color: field.color || C.textPrimary }]}>{field.value}</Text>
            </View>
          ))}
        </LinearGradient>

        {rideDetail.ledger_entries?.length > 0 && (
          <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
            <Text style={[T.headingSm, { marginBottom: 12 }]}>Wallet Movements</Text>
            {rideDetail.ledger_entries.map((entry, idx) => (
              <View key={idx} style={{ paddingVertical: 10, borderBottomWidth: idx < rideDetail.ledger_entries.length - 1 ? 1 : 0, borderBottomColor: C.border }}>
                <Text style={[T.bodyMd, { textTransform: 'capitalize' }]}>{entry.entry_type.replace('_', ' ')}</Text>
                <Text style={[T.bodySm, { color: C.textMuted, marginBottom: 4 }]}>{new Date(entry.created_at).toLocaleString()}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {entry.amount_delta !== '0.00' && <Text style={{ color: parseFloat(entry.amount_delta) > 0 ? C.green : C.red }}>₹{entry.amount_delta}</Text>}
                  {entry.held_delta !== '0.00' && <Text style={{ color: C.gold }}>Hold: {entry.held_delta}</Text>}
                </View>
              </View>
            ))}
          </LinearGradient>
        )}
      </ScrollView>
    </View>
  );
}