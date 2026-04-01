import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';

export default function Header({ title }) {
  return (
    <SafeAreaView className="bg-black">
      <View className="px-5 py-3 border-b border-gray-800">
        <Text className="text-white text-2xl font-bold">{title}</Text>
      </View>
    </SafeAreaView>
  );
}