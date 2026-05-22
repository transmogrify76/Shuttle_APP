import React, { useRef } from 'react';
import { TouchableWithoutFeedback, Animated, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, T } from '../styles/design';

export default function AnimatedButton({ title, onPress, disabled, style, textStyle, buttonColor = 'gold' }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const animateOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const gradientColors = !disabled && buttonColor === 'gold'
    ? [C.gold, C.goldLight]
    : [C.surfaceHigh, C.surfaceHigh];

  const textColor = disabled
    ? C.textMuted
    : buttonColor === 'gold' ? '#000' : C.textPrimary;

  return (
    <TouchableWithoutFeedback
      onPressIn={animateIn}
      onPressOut={animateOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 30,
            paddingVertical: 14,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={[
              {
                color: textColor,
                fontWeight: 'bold',
                fontSize: 16,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </LinearGradient>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}