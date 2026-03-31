import React from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Card, Button, IconButton } from 'react-native-paper';
import Header from '../components/Header';

export default function BookingConfirmationScreen({ route, navigation }) {
  const { route: busRoute, busType, seats, fare } = route.params;
  const total = seats.length * fare;

  const handleDone = () => navigation.navigate('MainTabs', { screen: 'Bookings' });

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Header title="Booking Confirmed" />
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 16 }}>
        <IconButton icon="check-circle" iconColor="#10b981" size={80} />
        <Text variant="headlineSmall" style={{ color: '#fff', marginBottom: 24 }}>Thank you for booking!</Text>

        <Card style={{ width: '100%', backgroundColor: '#1a1a1a', marginBottom: 24 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <IconButton icon="bus" iconColor="#10b981" size={20} style={{ margin: 0 }} />
              <Text variant="bodyMedium" style={{ color: '#fff', marginLeft: 8 }}>{busRoute.name}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <IconButton icon="car-sport" iconColor="#10b981" size={20} style={{ margin: 0 }} />
              <Text variant="bodyMedium" style={{ color: '#fff', marginLeft: 8 }}>{busType.toUpperCase()} Bus</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <IconButton icon="clock-outline" iconColor="#10b981" size={20} style={{ margin: 0 }} />
              <Text variant="bodyMedium" style={{ color: '#fff', marginLeft: 8 }}>{busRoute.time}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <IconButton icon="seat" iconColor="#10b981" size={20} style={{ margin: 0 }} />
              <Text variant="bodyMedium" style={{ color: '#fff', marginLeft: 8 }}>Seats: {seats.join(', ')}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconButton icon="cash" iconColor="#10b981" size={20} style={{ margin: 0 }} />
              <Text variant="titleMedium" style={{ color: '#10b981', marginLeft: 8 }}>Total: ₹{total}</Text>
            </View>
          </Card.Content>
        </Card>

        <Button mode="contained" onPress={handleDone} buttonColor="#10b981" style={{ width: '100%' }}>
          View My Bookings
        </Button>
      </ScrollView>
    </View>
  );
}