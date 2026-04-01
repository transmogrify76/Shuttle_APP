import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(50)).current;
  const busTranslateY = useRef(new Animated.Value(0)).current;
  const busRotate = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const buttonGroupTranslate = useRef(new Animated.Value(30)).current;

  const loginScale = useRef(new Animated.Value(1)).current;
  const signupScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Entry animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back()),
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
    ]).start();

    setTimeout(() => {
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }, 400);

    setTimeout(() => {
      Animated.timing(buttonGroupTranslate, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 1000);

    // Floating bus animation
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(busTranslateY, {
            toValue: -8,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(busRotate, {
            toValue: 0.03,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(busTranslateY, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(busRotate, {
            toValue: -0.03,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const busStyle = {
    transform: [
      { translateY: busTranslateY },
      {
        rotate: busRotate.interpolate({
          inputRange: [-0.03, 0.03],
          outputRange: ['-2deg', '2deg'],
        }),
      },
    ],
  };

  // Button animations
  const animateIn = (scale) => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  };

  const animateOut = (scale, callback) => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    callback();
  };

  const handleLoginPress = () => {
    animateOut(loginScale, () =>
      navigation.navigate('EmailEntry', { flow: 'login' })
    );
  };

  const handleSignupPress = () => {
    animateOut(signupScale, () =>
      navigation.navigate('EmailEntry', { flow: 'signup' })
    );
  };

  return (
    <View className="flex-1 bg-black">
      
      {/* Glow Background */}
      <View className="absolute top-[-120px] left-[-80px] w-[260px] h-[260px] rounded-full bg-white/5" />
      <View className="absolute bottom-[-140px] right-[-80px] w-[300px] h-[300px] rounded-full bg-white/5" />

      <LinearGradient
        colors={['#000000', '#050505', '#000000']}
        className="flex-1"
      >
        <View className="flex-1 justify-center items-center px-6">

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideUpAnim }],
            }}
            className="items-center w-full"
          >

            {/* ICON */}
            <Animated.View style={busStyle} className="mb-8">
              <View className="p-6 rounded-full bg-white/5 border border-white/10 shadow-lg shadow-white/20">
                <Ionicons name="bus" size={70} color="#fff" />
              </View>
            </Animated.View>

            {/* TITLE */}
            <Text className="text-white text-4xl font-extrabold tracking-tight">
              Kolkata Shuttle
            </Text>

            {/* TAGLINE */}
            <Animated.Text
              style={{ opacity: taglineOpacity }}
              className="text-gray-400 text-sm mt-2 text-center px-6"
            >
              Move smarter. Ride cleaner.
            </Animated.Text>

            {/* BUTTONS */}
            <Animated.View
              style={{ transform: [{ translateY: buttonGroupTranslate }] }}
              className="w-full mt-10"
            >

              {/* LOGIN */}
              <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => animateIn(loginScale)}
                onPress={handleLoginPress}
                className="mb-4"
              >
                <Animated.View
                  style={{ transform: [{ scale: loginScale }] }}
                  className="bg-white py-4 rounded-full items-center shadow-lg shadow-white/30"
                >
                  <Text className="text-black font-bold text-base">
                    Login
                  </Text>
                </Animated.View>
              </TouchableOpacity>

              {/* SIGN UP */}
              <TouchableOpacity
                activeOpacity={1}
                onPressIn={() => animateIn(signupScale)}
                onPress={handleSignupPress}
              >
                <Animated.View
                  style={{ transform: [{ scale: signupScale }] }}
                  className="py-4 rounded-full items-center border border-white/40 bg-white/5"
                >
                  <Text className="text-white font-semibold text-base">
                    Create Account
                  </Text>
                </Animated.View>
              </TouchableOpacity>

            </Animated.View>

          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}