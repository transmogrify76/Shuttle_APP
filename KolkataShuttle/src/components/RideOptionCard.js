import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T } from '../styles/design';

export default function RideOptionCard({ icon, name, price, duration, selected, onSelect }) {
  return (
    <TouchableOpacity
      onPress={onSelect}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        backgroundColor: selected ? C.surfaceUp : 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={icon} size={28} color={selected ? C.gold : C.textPrimary} />
        <View style={{ marginLeft: 12 }}>
          <Text style={[T.bodyMd, { color: selected ? C.gold : C.textPrimary }]}>{name}</Text>
          <Text style={[T.bodySm, { marginTop: 2 }]}>{duration}</Text>
        </View>
      </View>
      <Text style={[T.bodyLg, { fontWeight: 'bold', color: selected ? C.gold : C.textPrimary }]}>
        ₹{price}
      </Text>
    </TouchableOpacity>
  );
}