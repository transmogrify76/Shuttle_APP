import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../styles/design';

export default function CustomButton({ title, onPress, disabled, loading, className }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={className}
    >
      <LinearGradient
        colors={disabled ? [C.surfaceHigh, C.surfaceHigh] : [C.gold, C.goldLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 30,
          paddingVertical: 14,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <ActivityIndicator color={disabled ? C.textMuted : '#000'} />
        ) : (
          <Text
            style={{
              color: disabled ? C.textMuted : '#000',
              fontWeight: 'bold',
              fontSize: 16,
            }}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}