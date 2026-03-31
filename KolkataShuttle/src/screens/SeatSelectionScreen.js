import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Text, Card, Button } from 'react-native-paper';
import Header from '../components/Header';
import SeatMap from '../components/SeatMap';
import { seatLayout } from '../utils/dummyData';

export default function SeatSelectionScreen({ route, navigation }) {
  const { route: busRoute, busType } = route.params;
  const [selectedSeats, setSelectedSeats] = useState([]);
  const farePerSeat = busType === 'ac' ? busRoute.fare.ac : busRoute.fare.nonAc;
  const total = selectedSeats.length * farePerSeat;

  const handleConfirm = () => {
    if (selectedSeats.length === 0) return;
    navigation.navigate('BookingConfirmation', {
      route: busRoute,
      busType,
      seats: selectedSeats,
      fare: farePerSeat,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Header title="Select Seats" />
      <ScrollView>
        <Card style={{ margin: 16, backgroundColor: '#1a1a1a' }}>
          <Card.Content>
            <Text variant="titleLarge" style={{ color: '#fff' }}>{busRoute.name}</Text>
            <Text variant="bodyMedium" style={{ color: '#10b981', marginVertical: 4 }}>{busType.toUpperCase()} Bus</Text>
            <Text variant="bodySmall" style={{ color: '#aaa' }}>{busRoute.time}</Text>
          </Card.Content>
        </Card>

        <SeatMap bookedSeats={seatLayout.bookedSeats} onSeatSelect={setSelectedSeats} />

        <Card style={{ margin: 16, backgroundColor: '#1a1a1a' }}>
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: '#fff' }}>Selected Seats: {selectedSeats.join(', ') || 'None'}</Text>
            <Text variant="titleMedium" style={{ color: '#10b981', marginTop: 8 }}>Total: ₹{total}</Text>
          </Card.Content>
          <Card.Actions>
            <Button mode="contained" onPress={handleConfirm} disabled={selectedSeats.length === 0} buttonColor="#10b981" style={{ flex: 1 }}>
              Confirm Booking
            </Button>
          </Card.Actions>
        </Card>
      </ScrollView>
    </View>
  );
}