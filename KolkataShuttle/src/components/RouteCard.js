import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RouteCard({ route, onSelect }) {
  return (
    <TouchableOpacity
      className="bg-card rounded-2xl p-4 mx-4 my-2 shadow-lg border border-border"
      onPress={() => onSelect(route)}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold text-base flex-1">{route.name}</Text>
        <Ionicons name="chevron-forward" size={20} color="#10b981" />
      </View>
      <Text className="text-gray-400 text-xs">{route.stops.join(' → ')}</Text>
      <Text className="text-gray-400 text-xs mt-1">{route.time}</Text>
    </TouchableOpacity>
  );
}