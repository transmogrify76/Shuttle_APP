import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import SeatMap from '../components/SeatMap';
import CustomButton from '../components/CustomButton';
import { seatLayout } from '../utils/dummyData';

export default function SeatSelectionScreen({ route, navigation }) {
  const { route: busRoute, busType } = route.params;
  const [selectedSeats, setSelectedSeats] = useState([]);

  const handleSeatSelect = (seats) => {
    setSelectedSeats(seats);
  };

  const handleConfirm = () => {
    if (selectedSeats.length === 0) return;
    navigation.navigate('BookingConfirmation', {
      route: busRoute,
      busType,
      seats: selectedSeats,
      fare: busType === 'ac' ? busRoute.fare.ac : busRoute.fare.nonAc,
    });
  };

  const farePerSeat = busType === 'ac' ? busRoute.fare.ac : busRoute.fare.nonAc;
  const total = selectedSeats.length * farePerSeat;

  return (
    <View style={styles.container}>
      <Header title="Select Seats" />
      <ScrollView>
        <View style={styles.info}>
          <Text style={styles.routeName}>{busRoute.name}</Text>
          <Text style={styles.busType}>{busType.toUpperCase()} Bus</Text>
          <Text style={styles.time}>{busRoute.time}</Text>
        </View>

        <SeatMap bookedSeats={seatLayout.bookedSeats} onSeatSelect={handleSeatSelect} />

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Selected Seats: {selectedSeats.join(', ') || 'None'}
          </Text>
          <Text style={styles.summaryText}>Total: ₹{total}</Text>
        </View>

        <CustomButton
          title="Confirm Booking"
          onPress={handleConfirm}
          disabled={selectedSeats.length === 0}
          style={styles.confirmButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  info: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  routeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  busType: {
    fontSize: 16,
    color: '#10b981',
    marginVertical: 4,
  },
  time: {
    fontSize: 14,
    color: '#6b7280',
  },
  summary: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginVertical: 12,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryText: {
    fontSize: 16,
    marginVertical: 2,
    fontWeight: '500',
    color: '#1f2937',
  },
  confirmButton: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
});