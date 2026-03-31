import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { myBookings } from '../utils/dummyData';

export default function MyBookingsScreen() {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.route}>{item.routeName}</Text>
        <View style={[styles.statusBadge, item.status === 'upcoming' ? styles.upcoming : styles.past]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="calendar" size={16} color="#6b7280" />
        <Text style={styles.detailText}>{item.date} at {item.time}</Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="bus" size={16} color="#6b7280" />
        <Text style={styles.detailText}>{item.busType} | Seats: {item.seats.join(', ')} | ₹{item.fare}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="My Bookings" />
      {myBookings.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>No bookings yet</Text>
        </View>
      ) : (
        <FlatList
          data={myBookings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  route: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    color: '#1f2937',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  upcoming: {
    backgroundColor: '#d1fae5',
  },
  past: {
    backgroundColor: '#f3f4f6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
});