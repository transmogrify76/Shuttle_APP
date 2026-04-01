import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BusCard({ route, onSelect }) {
  return (
    <View className="bg-card rounded-2xl p-4 mx-4 my-2 shadow-lg border border-border">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-white font-bold text-base flex-1">{route.name}</Text>
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={14} color="#aaa" />
          <Text className="text-gray-400 text-xs ml-1">{route.time}</Text>
        </View>
      </View>
      <Text className="text-gray-400 text-xs mb-3">{route.stops.join(' • ')}</Text>
      <View className="flex-row justify-between">
        {route.busType === 'ac' || route.busType === 'both' ? (
          <TouchableOpacity
            className="bg-gray-800 px-4 py-2 rounded-full flex-row items-center"
            onPress={() => onSelect(route, 'ac')}
          >
            <Ionicons name="car-sport" size={16} color="#10b981" />
            <Text className="text-primary text-sm ml-1">AC ₹{route.fare.ac}</Text>
          </TouchableOpacity>
        ) : null}
        {route.busType === 'nonAc' || route.busType === 'both' ? (
          <TouchableOpacity
            className="bg-gray-800 px-4 py-2 rounded-full flex-row items-center"
            onPress={() => onSelect(route, 'nonAc')}
          >
            <Ionicons name="bus" size={16} color="#10b981" />
            <Text className="text-primary text-sm ml-1">Non‑AC ₹{route.fare.nonAc}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}