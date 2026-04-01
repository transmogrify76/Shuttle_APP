import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RideOptionCard({ icon, name, price, duration, selected, onSelect }) {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between p-4 border-b border-gray-100 ${selected ? 'bg-gray-50' : ''}`}
      onPress={onSelect}
    >
      <View className="flex-row items-center">
        <Ionicons name={icon} size={28} color="#000" />
        <View className="ml-3">
          <Text className="text-base font-semibold text-black">{name}</Text>
          <Text className="text-xs text-gray-500">{duration}</Text>
        </View>
      </View>
      <Text className="text-base font-semibold text-black">₹{price}</Text>
    </TouchableOpacity>
  );
}