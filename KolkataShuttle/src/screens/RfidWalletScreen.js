import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { getRfidSummary } from '../services/rfidApi';
import { C, T } from '../styles/design';

export default function RfidWalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await getRfidSummary();
      setSummary(data);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={C.gold} />
      </View>
    );
  }

  const me = summary?.me;
  const hasCard = me?.has_assigned_card;
  const card = me?.card;
  const account = me?.account;
  const currentRide = summary?.current_ride;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="RFID Wallet" />
      <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
        {!hasCard ? (
          <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
            <Ionicons name="card-outline" size={56} color={C.textMuted} />
            <Text style={[T.displayMd, { marginTop: 16 }]}>No RFID Card Assigned</Text>
            <Text style={[T.bodySm, { textAlign: 'center', marginTop: 8, color: C.textSecondary }]}>Please contact support to get an RFID card linked to your account.</Text>
          </LinearGradient>
        ) : (
          <>
            {/* Card & Balance Info */}
            <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: C.border }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={[T.headingSm]}>RFID Card</Text>
                <Text style={[T.bodySm, { color: C.textMuted }]}>****{card.card_uid_masked}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[T.bodySm]}>Total Balance</Text>
                <Text style={[T.displayMd, { color: C.gold }]}>₹{account.current_balance}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[T.bodySm]}>Held Balance</Text>
                <Text style={[T.bodyMd]}>₹{account.held_balance}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
                <Text style={[T.headingSm]}>Available Balance</Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: C.gold }}>₹{account.available_balance}</Text>
              </View>
            </LinearGradient>

            {/* Current RFID Ride */}
            {currentRide && (
              <TouchableOpacity onPress={() => navigation.navigate('RfidRideDetail', { rideId: currentRide.id })} style={{ marginBottom: 16 }}>
                <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
                  <Text style={[T.headingSm, { marginBottom: 4 }]}>Current RFID Ride</Text>
                  <Text style={[T.bodySm, { color: C.textSecondary }]}>Boarded at {currentRide.pickup_stop?.name} on {new Date(currentRide.boarded_at).toLocaleString()}</Text>
                  <Text style={[T.bodySm, { marginTop: 8, color: C.gold }]}>Tap for details →</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <TouchableOpacity onPress={() => navigation.navigate('RfidRecharge')} style={{ flex: 1, marginRight: 8, backgroundColor: C.gold, borderRadius: 16, paddingVertical: 12, alignItems: 'center' }}>
                <Ionicons name="add-circle-outline" size={24} color="#000" />
                <Text style={{ color: '#000', fontWeight: 'bold', marginTop: 4 }}>Recharge</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('RfidLedger')} style={{ flex: 1, marginHorizontal: 4, backgroundColor: C.surfaceUp, borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                <Ionicons name="receipt-outline" size={24} color={C.gold} />
                <Text style={{ color: C.textPrimary, fontWeight: 'bold', marginTop: 4 }}>Ledger</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('RfidRechargeHistory')} style={{ flex: 1, marginLeft: 8, backgroundColor: C.surfaceUp, borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
                <Ionicons name="time-outline" size={24} color={C.gold} />
                <Text style={{ color: C.textPrimary, fontWeight: 'bold', marginTop: 4 }}>Recharges</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('RfidRides')} style={{ marginBottom: 16, backgroundColor: C.surfaceUp, borderRadius: 16, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border }}>
              <Ionicons name="bus-outline" size={24} color={C.gold} />
              <Text style={{ color: C.textPrimary, fontWeight: 'bold', marginTop: 4 }}>RFID Ride History</Text>
            </TouchableOpacity>

            {/* Recent Ledger Entries */}
            {summary.recent_ledger_entries?.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[T.headingSm, { marginBottom: 12 }]}>Recent Wallet Activity</Text>
                {summary.recent_ledger_entries.slice(0, 3).map((entry, idx) => (
                  <LinearGradient key={idx} colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 16, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.border }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={[T.bodySm, { fontWeight: 'bold', textTransform: 'capitalize' }]}>{entry.entry_type.replace('_', ' ')}</Text>
                      <Text style={[T.bodySm, { color: C.textMuted }]}>{new Date(entry.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      {entry.amount_delta !== '0.00' && (
                        <Text style={{ color: parseFloat(entry.amount_delta) > 0 ? C.green : C.red }}>
                          {parseFloat(entry.amount_delta) > 0 ? `+₹${entry.amount_delta}` : `-₹${Math.abs(parseFloat(entry.amount_delta))}`}
                        </Text>
                      )}
                      {entry.held_delta !== '0.00' && (
                        <Text style={{ color: C.gold }}>Hold {parseFloat(entry.held_delta) > 0 ? `+₹${entry.held_delta}` : `-₹${Math.abs(parseFloat(entry.held_delta))}`}</Text>
                      )}
                    </View>
                  </LinearGradient>
                ))}
                <TouchableOpacity onPress={() => navigation.navigate('RfidLedger')} style={{ marginTop: 4 }}>
                  <Text style={{ color: C.gold, textAlign: 'center', fontSize: 12 }}>View all →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}