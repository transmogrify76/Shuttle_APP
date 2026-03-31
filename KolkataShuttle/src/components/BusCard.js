import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BusCard({ route, onSelect }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.routeName}>{route.name}</Text>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.time}>{route.time}</Text>
        </View>
      </View>

      <View style={styles.stopsContainer}>
        <Text style={styles.stopsLabel}>Stops: </Text>
        <Text style={styles.stops}>{route.stops.join(' • ')}</Text>
      </View>

      <View style={styles.fareRow}>
        {route.busType === 'ac' || route.busType === 'both' ? (
          <TouchableOpacity style={styles.fareButton} onPress={() => onSelect(route, 'ac')}>
            <Ionicons name="car-sport" size={18} color="#2c7da0" />
            <Text style={styles.fareText}>AC ₹{route.fare.ac}</Text>
          </TouchableOpacity>
        ) : null}
        {route.busType === 'nonAc' || route.busType === 'both' ? (
          <TouchableOpacity style={styles.fareButton} onPress={() => onSelect(route, 'nonAc')}>
            <Ionicons name="bus" size={18} color="#2c7da0" />
            <Text style={styles.fareText}>Non‑AC ₹{route.fare.nonAc}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  time: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  stopsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stopsLabel: {
    fontSize: 14,
    color: '#666',
  },
  stops: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7fa',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 6,
  },
  fareText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c7da0',
  },
});