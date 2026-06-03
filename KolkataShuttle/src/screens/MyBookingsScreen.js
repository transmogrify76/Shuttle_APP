import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { getBookingSessions, getDriverVehicleInfo } from '../services/bookingApi';
import { eventEmitter } from '../utils/eventEmitter';
import { C, T } from '../styles/design';

const DriverInfoModal = ({ visible, onClose, driverInfo }) => {
  if (!driverInfo) return null;
  const ratingNum = driverInfo.driver_average_rating ? parseFloat(driverInfo.driver_average_rating) : null;
  const hasRating = ratingNum !== null;
  const ratingCount = driverInfo.driver_rating_count || 0;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 28, width: '100%', borderWidth: 1, borderColor: C.border, overflow: 'hidden' }}>
          <LinearGradient colors={['rgba(201,168,76,0.25)', 'transparent']} style={{ padding: 24 }}>
            <Text style={[T.headingSm, { marginBottom: 10 }]}>Your Driver</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LinearGradient colors={[C.goldDim, 'rgba(201,168,76,0.05)']} style={{ width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                <Ionicons name="person" size={26} color={C.gold} />
              </LinearGradient>
              <View>
                <Text style={T.displayMd}>{driverInfo.driver_name || 'N/A'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  {[...Array(5)].map((_, i) => (
                    <Ionicons key={i} name={i < Math.round(ratingNum || 0) ? 'star' : 'star-outline'} size={12} color={C.gold} />
                  ))}
                  <Text style={[T.bodySm, { marginLeft: 6 }]}>
                    {hasRating ? `${ratingNum.toFixed(1)} (${ratingCount})` : 'New driver'}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
          <View style={{ padding: 24, paddingTop: 0 }}>
            <View style={{ backgroundColor: C.surfaceUp, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={[T.headingSm, { marginBottom: 12 }]}>Vehicle</Text>
              {[
                { label: 'Model', value: driverInfo.vehicle_name || 'Bus' },
                { label: 'Details', value: `${driverInfo.vehicle_model || '—'} · ${driverInfo.vehicle_color || '—'}` },
                { label: 'Reg. No.', value: driverInfo.vehicle_registration_number || 'N/A' },
                { label: 'Capacity', value: `${driverInfo.vehicle_total_seat || '?'} seats` },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < 3 ? 1 : 0, borderColor: C.border }}>
                  <Text style={[T.bodySm, { color: C.textMuted }]}>{item.label}</Text>
                  <Text style={T.bodyMd}>{item.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
              <LinearGradient colors={[C.gold, C.goldLight]} style={{ borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}>
                <Text style={{ color: '#000', fontWeight: '700' }}>Close</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default function MyBookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [currentDriverInfo, setCurrentDriverInfo] = useState(null);

  useEffect(() => { loadData(); }, [activeTab]);
  useEffect(() => {
    const handleRefresh = () => loadData(true);
    eventEmitter.on('refreshData', handleRefresh);
    return () => eventEmitter.off('refreshData', handleRefresh);
  }, []);

  const loadData = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      let statusFilter = null;
      if (activeTab === 'upcoming') statusFilter = 'confirmed';
      else if (activeTab === 'history') statusFilter = 'cancelled,expired';
      // For 'ongoing' we fetch all confirmed and filter later
      const res = await getBookingSessions(statusFilter);
      let items = res.items || [];
      if (activeTab === 'ongoing') {
        items = items.filter(s => s.status === 'confirmed' && new Date(s.scheduled_trip?.planned_start_at) > new Date());
      }
      setSessions(items);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      if (refresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  const onRefresh = () => loadData(true);

  const showDriverInfo = async (tripId) => {
    if (!tripId) {
      Alert.alert('Info', 'Driver information not available for this booking.');
      return;
    }
    try {
      setCurrentDriverInfo(await getDriverVehicleInfo(tripId));
      setDriverModalVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Could not fetch driver info');
    }
  };

  const renderItem = ({ item }) => {
    // Safely extract trip data
    const trip = item.scheduled_trip || {};
    const pickupStop = trip.trip_from_stop?.name || 'Pickup';
    const dropoffStop = trip.trip_to_stop?.name || 'Dropoff';
    const seatCount = item.bookings?.length || 0;
    const totalFare = parseFloat(item.total_fare_amount) || 0;
    const refunded = item.payments?.[0]?.refunded_amount ? parseFloat(item.payments[0].refunded_amount) : 0;
    // Get trip ID for driver info – prefer scheduled_trip_id, fallback to trip.id
    const tripId = item.scheduled_trip_id || trip.id;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BookingDetail', { sessionId: item.id })}
        style={{ marginHorizontal: 16, marginBottom: 12 }}
      >
        <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={T.bodyMd}>{pickupStop} → {dropoffStop}</Text>
            <Text style={{ color: item.status === 'confirmed' ? C.green : C.red }}>
              {item.status.toUpperCase()}
            </Text>
          </View>
          <Text style={[T.bodySm, { marginVertical: 4 }]}>
            {trip.planned_start_at ? new Date(trip.planned_start_at).toLocaleString() : 'Date not set'}
          </Text>
          <Text style={T.bodySm}>{seatCount} seat(s) · ₹{totalFare}</Text>
          {refunded > 0 && <Text style={{ color: C.gold, marginTop: 4 }}>Refunded: ₹{refunded}</Text>}
          {tripId && (
            <TouchableOpacity
              onPress={() => showDriverInfo(tripId)}
              style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="car-outline" size={14} color={C.textMuted} />
              <Text style={[T.bodySm, { marginLeft: 4, color: C.textMuted }]}>View driver & vehicle</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="My Bookings" />
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border }}>
        {['upcoming', 'ongoing', 'history'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 12,
              alignItems: 'center',
              borderBottomWidth: activeTab === tab ? 2 : 0,
              borderBottomColor: activeTab === tab ? C.gold : 'transparent',
            }}
          >
            <Text style={[T.bodySm, { fontWeight: activeTab === tab ? '700' : '500', color: activeTab === tab ? C.gold : C.textSecondary }]}>
              {tab.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={C.gold} style={{ marginTop: 40 }} />
      ) : sessions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="calendar-outline" size={60} color={C.textMuted} />
          <Text style={[T.bodyMd, { marginTop: 12 }]}>No {activeTab} bookings</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        />
      )}

      <DriverInfoModal visible={driverModalVisible} onClose={() => setDriverModalVisible(false)} driverInfo={currentDriverInfo} />
    </View>
  );
}