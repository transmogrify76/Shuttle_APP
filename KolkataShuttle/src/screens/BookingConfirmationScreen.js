import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import CustomButton from '../components/CustomButton';

export default function BookingConfirmationScreen({ route, navigation }) {
  const { route: busRoute, busType, seats, fare } = route.params;
  const total = seats.length * fare;

  const handleDone = () => {
    navigation.navigate('MainTabs', { screen: 'Bookings' });
  };

  return (
    <View style={styles.container}>
      <Header title="Booking Confirmed" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={80} color="#10b981" />
        </View>
        <Text style={styles.title}>Thank you for booking!</Text>

        <View style={styles.card}>
          <View style={styles.detailRow}>
            <Ionicons name="bus" size={20} color="#10b981" />
            <Text style={styles.detailText}>{busRoute.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="car-sport" size={20} color="#10b981" />
            <Text style={styles.detailText}>{busType.toUpperCase()} Bus</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color="#10b981" />
            <Text style={styles.detailText}>{busRoute.time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="grid" size={20} color="#10b981" />
            <Text style={styles.detailText}>Seats: {seats.join(', ')}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash" size={20} color="#10b981" />
            <Text style={styles.detailText}>Total: ₹{total}</Text>
          </View>
        </View>

        <CustomButton title="View My Bookings" onPress={handleDone} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  successIcon: {
    marginVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  detailText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#4b5563',
  },
});