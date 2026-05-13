import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getRfidSummary } from '../services/rfidApi';

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
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const me = summary?.me;
  const hasCard = me?.has_assigned_card;
  const card = me?.card;
  const account = me?.account;
  const currentRide = summary?.current_ride;

  return (
    <View className="flex-1 bg-black" style={{ paddingTop: insets.top }}>
      <Header title="RFID Wallet" />
      <ScrollView className="flex-1 px-4 pt-4">
        {!hasCard ? (
          <View className="bg-gray-900 rounded-xl p-5 items-center">
            <Ionicons name="card-outline" size={48} color="#aaa" />
            <Text className="text-white text-lg font-bold mt-3">No RFID Card Assigned</Text>
            <Text className="text-gray-400 text-center mt-2">
              Please contact support to get an RFID card linked to your account.
            </Text>
          </View>
        ) : (
          <>
            {/* Card & Balance Info */}
            <View className="bg-gray-900 rounded-xl p-5 mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-white text-sm font-semibold">RFID Card</Text>
                <Text className="text-gray-400 text-xs">****{card.card_uid_masked}</Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-400 text-sm">Total Balance</Text>
                <Text className="text-white text-xl font-bold">₹{account.current_balance}</Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-400 text-sm">Held Balance</Text>
                <Text className="text-white text-base">₹{account.held_balance}</Text>
              </View>
              <View className="flex-row justify-between items-center pt-2 border-t border-gray-800">
                <Text className="text-gray-400 text-sm font-semibold">Available Balance</Text>
                <Text className="text-green-500 text-lg font-bold">₹{account.available_balance}</Text>
              </View>
            </View>

            {/* Current RFID Ride (if any) */}
            {currentRide && (
              <TouchableOpacity
                onPress={() => navigation.navigate('RfidRideDetail', { rideId: currentRide.id })}
                className="bg-gray-900 rounded-xl p-4 mb-4"
              >
                <Text className="text-white font-bold mb-1">Current RFID Ride</Text>
                <Text className="text-gray-300 text-sm">
                  Boarded at {currentRide.pickup_stop?.name} on {new Date(currentRide.boarded_at).toLocaleString()}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">Tap for details</Text>
              </TouchableOpacity>
            )}

            {/* Action Buttons */}
            <View className="flex-row flex-wrap justify-between mb-4">
              <TouchableOpacity
                onPress={() => navigation.navigate('RfidRecharge')}
                className="bg-white rounded-xl p-3 flex-1 mr-2 items-center"
              >
                <Ionicons name="add-circle-outline" size={24} color="#000" />
                <Text className="text-black font-semibold mt-1">Recharge</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('RfidLedger')}
                className="bg-gray-800 rounded-xl p-3 flex-1 mx-1 items-center"
              >
                <Ionicons name="receipt-outline" size={24} color="#fff" />
                <Text className="text-white font-semibold mt-1">Ledger</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('RfidRechargeHistory')}
                className="bg-gray-800 rounded-xl p-3 flex-1 ml-2 items-center"
              >
                <Ionicons name="time-outline" size={24} color="#fff" />
                <Text className="text-white font-semibold mt-1">Recharges</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('RfidRides')}
              className="bg-gray-800 rounded-xl p-3 mb-4 items-center"
            >
              <Ionicons name="bus-outline" size={24} color="#fff" />
              <Text className="text-white font-semibold mt-1">RFID Ride History</Text>
            </TouchableOpacity>

            {/* Recent activity preview */}
            {summary.recent_ledger_entries?.length > 0 && (
              <View className="mt-2">
                <Text className="text-white font-bold mb-2">Recent Wallet Activity</Text>
                {summary.recent_ledger_entries.slice(0, 3).map((entry, idx) => (
                  <View key={idx} className="bg-gray-900 rounded-lg p-3 mb-2">
                    <View className="flex-row justify-between">
                      <Text className="text-white text-sm">{entry.entry_type.replace('_', ' ')}</Text>
                      <Text className="text-gray-400 text-xs">{new Date(entry.created_at).toLocaleDateString()}</Text>
                    </View>
                    <View className="flex-row justify-between mt-1">
                      {entry.amount_delta !== '0.00' && (
                        <Text className={entry.amount_delta > 0 ? 'text-green-500' : 'text-red-500'}>
                          {entry.amount_delta > 0 ? `+₹${entry.amount_delta}` : `-₹${Math.abs(entry.amount_delta)}`}
                        </Text>
                      )}
                      {entry.held_delta !== '0.00' && (
                        <Text className="text-yellow-500">
                          Hold {entry.held_delta > 0 ? `+₹${entry.held_delta}` : `-₹${Math.abs(entry.held_delta)}`}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
                <TouchableOpacity onPress={() => navigation.navigate('RfidLedger')} className="mt-1">
                  <Text className="text-primary text-sm text-center">View all →</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}