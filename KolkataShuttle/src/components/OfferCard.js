import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function OfferCard({ vehicle, price, duration, onSelect }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onSelect}>
      <View style={styles.left}>
        <Ionicons name="bus" size={24} color="#10b981" />
        <Text style={styles.vehicle}>{vehicle}</Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.price}>₹{price}</Text>
        <Text style={styles.duration}>{duration}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 12,
  },
  right: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  duration: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});