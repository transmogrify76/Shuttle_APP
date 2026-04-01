import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function Header({ title }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const scale = useRef(new Animated.Value(1)).current;

  const animateAvatar = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.1, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={{ paddingTop: insets.top }} className="bg-black">
      <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-800">
        <Text className="text-white text-2xl font-bold">{title}</Text>
        <TouchableOpacity onPress={animateAvatar}>
          <Animated.View
            style={{
              transform: [{ scale }],
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#333',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text className="text-white font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}