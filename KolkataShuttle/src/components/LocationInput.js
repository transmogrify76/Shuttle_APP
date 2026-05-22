import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, T } from '../styles/design';

export default function LocationInput() {
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: C.surfaceUp, borderRadius: 16, padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Ionicons name="map-marker" size={20} color={C.gold} />
        <Text style={[T.bodySm, { marginLeft: 8, color: C.textSecondary }]}>Your current location</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name="navigation" size={20} color={C.gold} />
        <TextInput
          placeholder="Enter pick-up location"
          placeholderTextColor={C.textMuted}
          style={{ flex: 1, marginLeft: 8, color: C.textPrimary, fontSize: 14 }}
          underlineColorAndroid="transparent"
        />
      </View>
    </View>
  );
}