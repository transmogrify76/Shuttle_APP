import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LocationInput() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Ionicons name="location" size={20} color="#10b981" />
        <Text style={styles.label}>Your current location</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="navigate-circle" size={20} color="#10b981" />
        <TextInput
          style={styles.input}
          placeholder="Enter pick-up location"
          placeholderTextColor="#9ca3af"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    marginLeft: 8,
  },
  input: {
    flex: 1,
    color: '#1f2937',
    fontSize: 14,
    marginLeft: 8,
    paddingVertical: 8,
  },
});