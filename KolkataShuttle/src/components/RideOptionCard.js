import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function RideOptionCard({ icon, name, price, duration, selected, onSelect }) {
  return (
    <TouchableOpacity style={[styles.card, selected && styles.selectedCard]} onPress={onSelect}>
      <View style={styles.left}>
        <Ionicons name={icon} size={28} color="#000" />
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.duration}>{duration}</Text>
        </View>
      </View>
      <Text style={styles.price}>₹{price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  selectedCard: {
    backgroundColor: '#f8f8f8',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  duration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});