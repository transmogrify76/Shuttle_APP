import React, { useRef, useEffect } from 'react';
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../styles/design'; 

const { height: screenHeight } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = screenHeight * 0.65;

export default function AnimatedBottomSheet({ children, isVisible, onClose }) {
  const translateY = useRef(new Animated.Value(BOTTOM_SHEET_HEIGHT)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isVisible ? 0 : BOTTOM_SHEET_HEIGHT,
      useNativeDriver: true,
      tension: 40,
      friction: 8,
    }).start();
  }, [isVisible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: BOTTOM_SHEET_HEIGHT,
        backgroundColor: C.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        transform: [{ translateY }],
        shadowColor: C.gold,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 10,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: C.borderStrong,
      }}
    >
      <View
        {...panResponder.panHandlers}
        style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 6 }}
      >
        <View style={{ width: 36, height: 4, backgroundColor: C.surfaceHigh, borderRadius: 2 }} />
      </View>
      {children}
    </Animated.View>
  );
}