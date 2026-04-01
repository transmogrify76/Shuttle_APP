import React, { useRef } from 'react';
import { TouchableWithoutFeedback, Animated, Text } from 'react-native';

export default function AnimatedButton({ title, onPress, disabled, style, textStyle }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const animateOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={animateIn}
      onPressOut={animateOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View
        style={[
          {
            transform: [{ scale }],
            backgroundColor: disabled ? '#333' : '#fff',
            paddingVertical: 14,
            borderRadius: 30,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}
      >
        <Text style={[{ color: disabled ? '#aaa' : '#000', fontWeight: 'bold', fontSize: 16 }, textStyle]}>
          {title}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}