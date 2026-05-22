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
  const { route: busRoute, busType, seats, fare, otp } = route.params;
  const total = seats.length * fare;

  const formatTime = (time) => {
    if (!time) return 'TBD';
    const date = new Date(time);
    return isNaN(date.getTime()) ? time : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: insets.top }}>
      <Header title="Booking Confirmed" />
      <ScrollView contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Success icon with glow */}
        <View style={{ position: 'relative', marginVertical: 20 }}>
          <LinearGradient
            colors={[C.goldDim, 'transparent']}
            style={{ position: 'absolute', width: 100, height: 100, borderRadius: 50, alignSelf: 'center' }}
          />
          <Ionicons name="checkmark-circle" size={80} color={C.gold} />
        </View>

        <Text style={[T.displayMd, { textAlign: 'center', marginBottom: 8 }]}>Booking Confirmed!</Text>
        <Text style={[T.bodySm, { textAlign: 'center', marginBottom: 24 }]}>Your trip has been successfully booked.</Text>

        {/* OTP Card */}
        {otp && (
          <LinearGradient
            colors={[C.surfaceUp, C.surface]}
            style={{
              width: '100%',
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <Text style={[T.headingSm, { marginBottom: 4 }]}>Boarding OTP</Text>
            <Text style={{ fontSize: 42, fontWeight: '800', letterSpacing: 6, color: C.gold }}>{otp}</Text>
            <Text style={[T.bodySm, { marginTop: 6 }]}>Show this to the driver at pickup</Text>
          </LinearGradient>
        )}

        {/* Trip Details Card */}
        <LinearGradient
          colors={[C.surfaceUp, C.surface]}
          style={{
            width: '100%',
            borderRadius: 24,
            padding: 20,
            marginBottom: 30,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
            <Ionicons name="bus-outline" size={22} color={C.gold} />
            <Text style={[T.bodyLg, { marginLeft: 10 }]}>{busRoute.name}</Text>
          </View>
          {[
            { icon: 'car-sport', label: 'Bus Type', value: busType.toUpperCase() },
            { icon: 'time-outline', label: 'Departure', value: formatTime(busRoute.time) },
            { icon: 'grid-outline', label: 'Seats', value: seats.join(', ') },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name={item.icon} size={16} color={C.textMuted} />
              <Text style={[T.bodyMd, { marginLeft: 12, flex: 1 }]}>{item.label}</Text>
              <Text style={T.bodyMd}>{item.value}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
            <Ionicons name="cash-outline" size={20} color={C.gold} />
            <Text style={[T.bodyLg, { marginLeft: 12 }]}>Total Paid</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: C.gold, marginLeft: 'auto' }}>₹{total}</Text>
          </View>
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