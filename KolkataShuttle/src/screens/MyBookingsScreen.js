import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import {
  getUpcomingBookings,
  getPassengerHistory,
  getCurrentBookings,
  getDriverVehicleInfo,
  getBookingCurrentStatus,
} from '../services/bookingApi';
import { eventEmitter } from '../utils/eventEmitter';
import { C, T } from '../styles/design';

const DriverInfoModal = ({ visible, onClose, driverInfo }) => {
  if (!driverInfo) return null;
  let rating = driverInfo.driver_average_rating;
  const ratingNum = rating != null && !isNaN(parseFloat(rating)) ? parseFloat(rating) : null;
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
                  {[...Array(5)].map((_, i) => <Ionicons key={i} name={i < Math.round(ratingNum || 0) ? 'star' : 'star-outline'} size={12} color={C.gold} />)}
                  <Text style={[T.bodySm, { marginLeft: 6 }]}>{hasRating ? `${ratingNum.toFixed(1)} (${ratingCount})` : 'New driver'}</Text>
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
            <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}><LinearGradient colors={[C.gold, C.goldLight]} style={{ borderRadius: 16, paddingVertical: 15, alignItems: 'center' }}><Text style={{ color: '#000', fontWeight: '700' }}>Close</Text></LinearGradient></TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

export default function MyBookingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [upcoming, setUpcoming] = useState([]);
  const [ongoing, setOngoing] = useState([]);
  const [history, setHistory] = useState([]);
  const [ongoingStatus, setOngoingStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [driverModalVisible, setDriverModalVisible] = useState(false);
  const [currentDriverInfo, setCurrentDriverInfo] = useState(null);

  useEffect(() => { loadData(); }, [activeTab]);
  useEffect(() => {
    const handleRefresh = (data) => {
      if (data.keys.includes('bookings_list') || data.keys.includes('history')) loadData(true);
      if (data.keys.includes('current_booking') && activeTab === 'ongoing') loadData(true);
    };
    eventEmitter.on('refreshData', handleRefresh);
    return () => eventEmitter.off('refreshData', handleRefresh);
  }, [activeTab]);

  const loadData = async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      if (activeTab === 'upcoming') {
        const res = await getUpcomingBookings();
        setUpcoming(res.items || []);
      } else if (activeTab === 'ongoing') {
        const res = await getCurrentBookings();
        const items = res.items || [];
        setOngoing(items);
        const statusMap = {};
        for (const b of items) {
          try { statusMap[b.id] = await getBookingCurrentStatus(b.id); } catch(e) {}
        }
        setOngoingStatus(statusMap);
      } else {
        const res = await getPassengerHistory();
        setHistory(res.items || []);
      }
    } catch (err) { Alert.alert('Error', err.message); }
    finally { if (refresh) setRefreshing(false); else setLoading(false); }
  };
  const onRefresh = () => loadData(true);
  const showDriverInfo = async (tripId) => { try { setCurrentDriverInfo(await getDriverVehicleInfo(tripId)); setDriverModalVisible(true); } catch(e) { Alert.alert('Error', 'Could not fetch driver info'); } };

  const renderItem = ({ item, index }) => {
    const pickup = item.pickup_stop?.stop?.name || item.pickup_stop?.name || 'Pickup';
    const dropoff = item.dropoff_stop?.stop?.name || item.dropoff_stop?.name || 'Dropoff';
    const status = item.booking_status;
    const isOngoing = activeTab === 'ongoing';
    const live = ongoingStatus[item.id];
    const seatNumber = item.seat_number;
    let statusColor = '#2A2A35';
    let statusText = '#9CA3AF';
    if (status === 'booked' || status === 'pending_payment') { statusColor = '#2C5F2D'; statusText = '#34C97E'; }
    else if (status === 'completed') { statusColor = '#1F3A5F'; statusText = '#4A90D9'; }
    else if (status === 'cancelled' || status === 'canceled' || status === 'missed') { statusColor = '#5F2C2C'; statusText = '#E05252'; }

    return (
      <TouchableOpacity onPress={() => navigation.navigate('BookingDetail', { bookingId: item.id })} style={{ marginHorizontal: 16, marginBottom: 12 }}>
        <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[T.bodyMd, { flex: 1 }]}>{pickup} → {dropoff}</Text>
            <View style={{ backgroundColor: statusColor, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}><Text style={{ color: statusText, fontSize: 10, fontWeight: 'bold' }}>{status.replace('_', ' ').toUpperCase()}</Text></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><Ionicons name="bus-outline" size={14} color={C.textMuted} /><Text style={[T.bodySm, { marginLeft: 6 }]}>Shuttle</Text></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><Ionicons name="time-outline" size={14} color={C.textMuted} /><Text style={[T.bodySm, { marginLeft: 6 }]}>{new Date(item.created_at).toLocaleDateString()}</Text></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><Ionicons name="cash-outline" size={14} color={C.textMuted} /><Text style={[T.bodySm, { marginLeft: 6 }]}>₹{item.fare_amount}</Text></View>
          {seatNumber && <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><Ionicons name="grid-outline" size={14} color={C.textMuted} /><Text style={[T.bodySm, { marginLeft: 6 }]}>Seat: {seatNumber}</Text></View>}
          {item.otp && <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}><Ionicons name="key-outline" size={14} color={C.textMuted} /><Text style={[T.bodySm, { marginLeft: 6 }]}>OTP: {item.otp}</Text></View>}
          {isOngoing && live && (
            <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.border }}>
              <Text style={[T.bodySm]}>{live.trip_status === 'in_progress' ? '🚌 Trip in progress' : live.trip_status}</Text>
              {live.current_progress_stop && <Text style={[T.bodySm, { color: C.textMuted }]}>Current: {live.current_progress_stop.stop?.name}</Text>}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={[T.bodySm, { color: C.textMuted }]}>Boarding: {live.boarding_scan_completed ? '✅' : '⏳'}</Text>
                <Text style={[T.bodySm, { color: C.textMuted }]}>Drop: {live.drop_scan_completed ? '✅' : '⏳'}</Text>
              </View>
            </View>
          )}
          {item.scheduled_trip_id && (
            <TouchableOpacity onPress={() => showDriverInfo(item.scheduled_trip_id)} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="car-outline" size={14} color={C.textMuted} />
              <Text style={[T.bodySm, { marginLeft: 4, color: C.textMuted }]}>View driver & vehicle</Text>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };
  const data = activeTab === 'upcoming' ? upcoming : (activeTab === 'ongoing' ? ongoing : history);
  const isEmpty = (!loading && data.length === 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="My Bookings" />
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border }}>
        {['upcoming', 'ongoing', 'history'].map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: activeTab === tab ? C.gold : 'transparent' }}>
            <Text style={[T.bodySm, { fontWeight: activeTab === tab ? '700' : '500', color: activeTab === tab ? C.gold : C.textSecondary }]}>{tab.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading && !refreshing ? <ActivityIndicator size="large" color={C.gold} style={{ marginTop: 40 }} /> : isEmpty ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="calendar-outline" size={60} color={C.textMuted} /><Text style={[T.bodyMd, { marginTop: 12 }]}>No {activeTab} bookings</Text></View>
      ) : (
        <FlatList data={data} keyExtractor={(item, idx) => item.id || idx.toString()} renderItem={renderItem} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} refreshing={refreshing} onRefresh={onRefresh} />
      )}
      <DriverInfoModal visible={driverModalVisible} onClose={() => setDriverModalVisible(false)} driverInfo={currentDriverInfo} />
    </View>
  );
}