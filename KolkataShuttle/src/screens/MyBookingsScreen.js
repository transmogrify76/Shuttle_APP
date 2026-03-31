import React from 'react';
import { View, FlatList } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import Header from '../components/Header';
import { myBookings } from '../utils/dummyData';

export default function MyBookingsScreen() {
  const renderItem = ({ item }) => (
    <Card style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1a1a' }}>
      <Card.Content>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text variant="titleMedium" style={{ color: '#fff', flex: 1 }}>{item.routeName}</Text>
          <Chip icon={item.status === 'upcoming' ? 'calendar-clock' : 'check'} 
                style={{ backgroundColor: item.status === 'upcoming' ? '#10b98120' : '#2a2a2a' }}>
            {item.status.toUpperCase()}
          </Chip>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text variant="bodySmall" style={{ color: '#aaa' }}>{item.date} at {item.time}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text variant="bodySmall" style={{ color: '#aaa' }}>{item.busType} | Seats: {item.seats.join(', ')} | ₹{item.fare}</Text>
        </View>
      </Card.Content>
    </Card>
  );

  if (myBookings.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="titleMedium" style={{ color: '#aaa' }}>No bookings yet</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Header title="My Bookings" />
      <FlatList data={myBookings} keyExtractor={item => item.id} renderItem={renderItem} contentContainerStyle={{ paddingVertical: 8 }} />
    </View>
  );
}