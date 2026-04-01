import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import SeatMap from '../components/SeatMap';
import CustomButton from '../components/CustomButton';
import { seatLayout } from '../utils/dummyData';

export default function SeatSelectionScreen({ route, navigation }) {
  const { route: busRoute, busType } = route.params;
  const [selectedSeats, setSelectedSeats] = useState([]);

  const handleSeatSelect = (seats) => setSelectedSeats(seats);
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
    <View className="flex-1 bg-black">
      <Header title="Select Seats" />
      <ScrollView>
        <View className="p-5 border-b border-gray-800">
          <Text className="text-white text-xl font-bold">{busRoute.name}</Text>
          <Text className="text-green-500 text-base mt-1">{busType.toUpperCase()} Bus</Text>
          <Text className="text-gray-400 text-sm mt-1">{busRoute.time}</Text>
        </View>

        <SeatMap bookedSeats={seatLayout.bookedSeats} onSeatSelect={handleSeatSelect} />

        <View className="bg-gray-900 mx-4 my-3 p-5 rounded-2xl">
          <Text className="text-white font-medium">Selected Seats: {selectedSeats.join(', ') || 'None'}</Text>
          <Text className="text-white font-medium mt-2">Total: ₹{total}</Text>
        </View>

        <CustomButton
          title="Confirm Booking"
          onPress={handleConfirm}
          disabled={selectedSeats.length === 0}
          className="mx-4 mb-6"
        />
      </ScrollView>
    </View>
  );
}