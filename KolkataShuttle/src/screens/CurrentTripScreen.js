import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import Header from '../components/Header';
import { getBookingSessionCurrentStatus, getBookingSessionLiveLocation } from '../services/bookingApi';
import { C, T } from '../styles/design';

export default function CurrentTripScreen({ route, navigation }) {
  const { sessionId } = route.params;
  const insets = useSafeAreaInsets();
  const [statusData, setStatusData] = useState(null);
  const [liveLocation, setLiveLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchData = async () => {
    try {
      const status = await getBookingSessionCurrentStatus(sessionId);
      setStatusData(status);
      const location = await getBookingSessionLiveLocation(sessionId);
      setLiveLocation(location);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 10000);
    return () => clearInterval(intervalRef.current);
  }, [sessionId]);

  if (loading) return <ActivityIndicator size="large" color={C.gold} style={{ flex:1, backgroundColor:C.bg }} />;
  if (!statusData || !statusData.items || statusData.items.length === 0) {
    return (
      <View style={{ flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center' }}>
        <Text style={T.bodyMd}>No active trip found</Text>
      </View>
    );
  }

  const firstBooking = statusData.items[0];
  const locationItem = liveLocation?.items?.[0];
  const hasLocation = locationItem?.tracking_active && locationItem.last_lat && locationItem.last_lng;

  return (
    <View style={{ flex:1, backgroundColor:C.bg, paddingTop: insets.top }}>
      <Header title="Current Trip" showBack />
      {hasLocation && (
        <View style={{ height: 300 }}>
          <MapView
            style={{ flex:1 }}
            initialRegion={{
              latitude: parseFloat(locationItem.last_lat),
              longitude: parseFloat(locationItem.last_lng),
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(locationItem.last_lat),
                longitude: parseFloat(locationItem.last_lng),
              }}
              title="Bus"
            />
          </MapView>
        </View>
      )}
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {statusData.items.map((item) => (
          <LinearGradient key={item.booking_id} colors={[C.surfaceUp, C.surface]} style={{ borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
            <Text style={T.bodyLg}>Seat {item.seat_number}</Text>
            <Text style={T.bodyMd}>Traveller: {item.traveller_name_snapshot || 'N/A'}</Text>
            <Text style={T.bodySm}>Status: {item.booking_status}</Text>
            <Text style={T.bodySm}>Trip status: {item.trip_status}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text>Boarding: {item.boarding_scan_completed ? '✅' : '⏳'}</Text>
              <Text>Drop: {item.drop_scan_completed ? '✅' : '⏳'}</Text>
            </View>
            {item.current_progress_stop && (
              <Text style={[T.bodySm, { color: C.gold, marginTop: 8 }]}>
                Current stop: {item.current_progress_stop.stop?.name}
              </Text>
            )}
            {item.estimated_arrival_time && (
              <Text style={[T.bodySm, { color: C.gold, marginTop: 4 }]}>
                Est. arrival: {new Date(item.estimated_arrival_time).toLocaleTimeString()}
              </Text>
            )}
          </LinearGradient>
        ))}
      </ScrollView>
    </View>
  );
}