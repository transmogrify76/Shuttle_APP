import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { C, T } from '../styles/design';

export default function ServiceCard({ title, subtitle, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={[C.surfaceUp, C.surface]}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 20,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <View style={{ backgroundColor: C.goldDim, borderRadius: 12, padding: 8 }}>
          <Ionicons name="time-outline" size={22} color={C.gold} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={T.bodyMd}>{title}</Text>
          <Text style={[T.bodySm, { marginTop: 2 }]}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      </LinearGradient>
    </TouchableOpacity>
  );
}