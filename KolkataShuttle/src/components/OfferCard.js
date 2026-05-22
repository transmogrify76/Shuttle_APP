import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { C, T } from '../styles/design';

export default function OfferCard({ vehicle, price, duration, onSelect }) {
  return (
    <TouchableOpacity onPress={onSelect} activeOpacity={0.8}>
      <LinearGradient
        colors={[C.surfaceUp, C.surface]}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 20,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ backgroundColor: C.goldDim, borderRadius: 12, padding: 8 }}>
            <Ionicons name="bus" size={22} color={C.gold} />
          </View>
          <Text style={[T.bodyMd, { marginLeft: 12 }]}>{vehicle}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: C.gold }}>₹{price}</Text>
          <Text style={[T.bodySm, { marginTop: 2 }]}>{duration}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}