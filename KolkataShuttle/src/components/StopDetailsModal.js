import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function StopDetailsModal({ visible, onClose, stops, routeName }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-5 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Route Stops: {routeName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {stops.map((stop, idx) => (
              <View key={stop.stop?.id || idx} className="flex-row items-start py-3 border-b border-gray-100">
                <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Text className="text-black text-xs font-bold">{stop.sequence_no}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-black font-medium">{stop.stop?.name || stop.name}</Text>
                  {stop.boarding_allowed && (
                    <Text className="text-green-600 text-xs">Pickup allowed</Text>
                  )}
                  {stop.deboarding_allowed && (
                    <Text className="text-blue-600 text-xs">Dropoff allowed</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}  