import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { C, T } from '../styles/design';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
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
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.back()) }),
      Animated.timing(slideUpAnim, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 400);
    setTimeout(() => {
      Animated.timing(buttonGroupTranslate, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }, 1000);
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(busTranslateY, { toValue: -8, duration: 1500, useNativeDriver: true }),
          Animated.timing(busRotate, { toValue: 0.03, duration: 1500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(busTranslateY, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(busRotate, { toValue: -0.03, duration: 1500, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const busStyle = {
    transform: [
      { translateY: busTranslateY },
      { rotate: busRotate.interpolate({ inputRange: [-0.03, 0.03], outputRange: ['-2deg', '2deg'] }) },
    ],
  };

  const animateIn = (scale) => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const animateOut = (scale, callback) => { Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start(); callback(); };
  const handleLoginPress = () => animateOut(loginScale, () => navigation.navigate('EmailEntry', { flow: 'login' }));
  const handleSignupPress = () => animateOut(signupScale, () => navigation.navigate('EmailEntry', { flow: 'signup' }));

  return (
      <SafeAreaView
    style={{ flex: 1, backgroundColor: C.bg }}
    edges={['top']}
  >
    <LinearGradient
      colors={[C.bg, C.surface]}
      style={{ flex: 1 }}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideUpAnim }], alignItems: 'center', width: '100%' }}>
          <Animated.View style={busStyle} className="mb-8">
            <LinearGradient colors={[C.surfaceUp, C.surface]} style={{ padding: 20, borderRadius: 60, borderWidth: 1, borderColor: C.border }}>
              <Ionicons name="bus" size={70} color={C.gold} />
            </LinearGradient>
          </Animated.View>
          <Text style={[T.displayLg, { textAlign: 'center' }]}>Kolkata Shuttle</Text>
          <Animated.Text style={{ opacity: taglineOpacity, marginTop: 8, textAlign: 'center' }} className="text-gray-400 text-sm">
            Move smarter. Ride cleaner.
          </Animated.Text>
          <Animated.View style={{ transform: [{ translateY: buttonGroupTranslate }], width: '100%', marginTop: 40 }}>
            <TouchableOpacity activeOpacity={1} onPressIn={() => animateIn(loginScale)} onPress={handleLoginPress} style={{ marginBottom: 16 }}>
              <Animated.View style={{ transform: [{ scale: loginScale }], backgroundColor: C.gold, borderRadius: 30, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16 }}>Login</Text>
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={1} onPressIn={() => animateIn(signupScale)} onPress={handleSignupPress}>
              <Animated.View style={{ transform: [{ scale: signupScale }], borderWidth: 1, borderColor: C.gold, borderRadius: 30, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: C.gold, fontWeight: 'bold', fontSize: 16 }}>Create Account</Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </LinearGradient>
  </SafeAreaView>
);
  
}