import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { C, T } from '../styles/design';

export default function BusCard({ route, onSelect }) {
  return (
    <LinearGradient
      colors={[C.surfaceUp, C.surface]}
      style={{
        borderRadius: 20,
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: C.borderStrong,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[T.bodyLg, { flex: 1 }]}>{route.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="time-outline" size={14} color={C.textMuted} />
          <Text style={[T.bodySm, { marginLeft: 4 }]}>{route.time}</Text>
        </View>
      </View>
      <Text style={[T.bodySm, { marginBottom: 12 }]}>{route.stops.join(' • ')}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {(route.busType === 'ac' || route.busType === 'both') && (
          <TouchableOpacity
            onPress={() => onSelect(route, 'ac')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: C.surfaceHigh,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 30,
              gap: 6,
            }}
          >
            <Ionicons name="car-sport" size={16} color={C.gold} />
            <Text style={[T.bodySm, { color: C.gold }]}>AC ₹{route.fare.ac}</Text>
          </TouchableOpacity>
        )}
        {(route.busType === 'nonAc' || route.busType === 'both') && (
          <TouchableOpacity
            onPress={() => onSelect(route, 'nonAc')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: C.surfaceHigh,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 30,
              gap: 6,
            }}
          >
            <Ionicons name="bus" size={16} color={C.gold} />
            <Text style={[T.bodySm, { color: C.gold }]}>Non‑AC ₹{route.fare.nonAc}</Text>
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}