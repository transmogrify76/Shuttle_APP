import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { C, T } from '../styles/design';

export default function RouteCard({ route, onSelect }) {
  return (
    <TouchableOpacity onPress={() => onSelect(route)} activeOpacity={0.8}>
      <LinearGradient
        colors={[C.surfaceUp, C.surface]}
        style={{
          borderRadius: 20,
          padding: 16,
          marginHorizontal: 16,
          marginVertical: 8,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Text style={[T.bodyLg, { flex: 1 }]}>{route.name}</Text>
            {route.has_ac && (
              <View style={{ backgroundColor: C.goldDim, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                <Text style={{ color: C.gold, fontSize: 10, fontWeight: 'bold' }}>AC</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.gold} />
        </View>
        <Text style={[T.bodySm, { color: C.textMuted }]}>{route.stops?.length} stops</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}