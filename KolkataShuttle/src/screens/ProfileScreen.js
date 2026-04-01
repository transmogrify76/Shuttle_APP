import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: 'card-outline', label: 'Payment Methods' },
    { icon: 'help-circle-outline', label: 'Help & Support' },
    { icon: 'settings-outline', label: 'Settings' },
    { icon: 'log-out-outline', label: 'Logout', color: '#ef4444', onPress: logout },
  ];

  return (
    <View className="flex-1 bg-black">
      <Header title="Profile" />
      <ScrollView>
        <View className="items-center py-6 border-b border-gray-800">
          <View className="w-24 h-24 rounded-full bg-gray-800 items-center justify-center mb-3">
            <Text className="text-white text-4xl font-bold">{user?.email?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <Text className="text-white text-xl font-bold">{user?.email?.split('@')[0] || 'User'}</Text>
          <Text className="text-gray-400 text-sm mt-1">{user?.email}</Text>
        </View>

        <View className="mt-4 px-4">
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              className="flex-row items-center py-4 border-b border-gray-800"
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={24} color={item.color || '#fff'} />
              <Text className={`flex-1 text-base ml-3 ${item.color ? 'text-red-500' : 'text-white'}`}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#555" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}