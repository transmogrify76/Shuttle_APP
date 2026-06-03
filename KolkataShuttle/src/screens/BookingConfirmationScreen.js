import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import AnimatedButton from '../components/AnimatedButton';
import { C, T } from '../styles/design';

export default function BookingConfirmationScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { sessionId, seats, fare, routeName, scheduledTrip } = route.params;
  const total = fare;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="Booking Confirmed" />
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 }}>
        <Ionicons name="checkmark-circle" size={80} color={C.gold} />
        <Text style={[T.displayMd, { marginVertical: 12 }]}>Booking Confirmed!</Text>
        <Text style={[T.bodySm, { marginBottom: 8 }]}>Session ID: {sessionId}</Text>

        <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ width: '100%', borderRadius: 24, padding: 20, marginVertical: 20, borderWidth: 1, borderColor: C.border }}>
          <Text style={[T.headingSm, { marginBottom: 12 }]}>Trip Summary</Text>
          <Text style={T.bodyMd}>{routeName}</Text>
          <Text style={[T.bodySm, { marginBottom: 8 }]}>{new Date(scheduledTrip.planned_start_at).toLocaleString()}</Text>
          <Text style={T.bodyMd}>Seats: {seats.join(', ')}</Text>
          <Text style={[T.bodyLg, { marginTop: 12, color: C.gold }]}>Total Paid: ₹{total}</Text>
        </LinearGradient>

        <AnimatedButton
          title="View My Bookings"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Bookings' })}
          style={{ width: '100%' }}
          buttonColor="gold"
        />
      </ScrollView>
    </View>
  );
}