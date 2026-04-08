import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useNotifications } from '../context/NotificationContext';

export default function Header({ title }) {
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

  return (
    <SafeAreaView className="bg-black">
      <View className="flex-row justify-between items-center px-5 py-3 border-b border-gray-800">
        <Text className="text-white text-2xl font-bold">{title}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          className="relative"
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
              <Text className="text-white text-[10px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}