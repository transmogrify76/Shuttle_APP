import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { C, T } from '../styles/design';

export default function DriverInfo({ name, rating, pickup, dropoff }) {
  return (
    <LinearGradient
      colors={[C.surfaceUp, C.surface]}
      style={{
        borderRadius: 24,
        padding: 16,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: C.borderStrong,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <LinearGradient
          colors={[C.goldDim, 'rgba(201,168,76,0.05)']}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            borderWidth: 1,
            borderColor: 'rgba(201,168,76,0.3)',
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: C.gold }}>
            {name.charAt(0)}
          </Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={T.bodyMd}>{name}</Text>
          {rating && <Text style={[T.bodySm, { marginTop: 2 }]}>{rating}</Text>}
        </View>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: C.surfaceHigh,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            gap: 6,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <Ionicons name="chatbubble-outline" size={16} color={C.gold} />
          <Text style={[T.bodySm, { color: C.gold }]}>Message</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'flex-start' }}>
        <Ionicons name="location" size={16} color={C.gold} style={{ marginTop: 2 }} />
        <Text style={[T.bodySm, { flex: 1, marginLeft: 8, color: C.textSecondary }]}>
          {pickup}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'flex-start' }}>
        <Ionicons name="navigate" size={16} color={C.gold} style={{ marginTop: 2 }} />
        <Text style={[T.bodySm, { flex: 1, marginLeft: 8, color: C.textSecondary }]}>
          {dropoff}
        </Text>
      </View>
    </LinearGradient>
  );
}