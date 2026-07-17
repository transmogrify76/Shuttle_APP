import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C } from '../styles/design';

export default function CustomButton({ title, onPress, disabled, loading, className, style, buttonColor = 'gold' }) {
  const isGold = buttonColor === 'gold';
  const gradientColors = disabled
    ? [C.surfaceHigh, C.surfaceHigh]
    : isGold ? [C.gold, C.goldLight] : [C.surfaceHigh, C.surfaceHigh];
  const textColor = disabled ? C.textMuted : isGold ? '#000' : C.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      className={className}
      style={style}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          borderRadius: 30,
          paddingVertical: 14,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: isGold ? 0 : 1,
          borderColor: C.border,
        }}
      >
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <Text
            style={{
              color: textColor,
              fontWeight: 'bold',
              fontSize: 16,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}