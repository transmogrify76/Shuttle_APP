import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CustomButton({ title, onPress, disabled, loading, className }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={className}
    >
      <LinearGradient
        colors={disabled ? ['#333', '#222'] : ['#10b981', '#059669']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="py-3.5 rounded-full items-center justify-center"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}