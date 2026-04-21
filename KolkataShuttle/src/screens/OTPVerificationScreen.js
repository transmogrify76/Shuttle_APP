import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from '../components/AnimatedButton';
import { useAuth } from '../context/AuthContext';
import { fetchProfile } from '../services/profileApi';

export default function OTPVerificationScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { email, flow, role } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, '');
    setOtp(newOtp);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    let result;
    if (flow === 'signup') {
      result = await signup(email, otpString, role);
    } else {
      result = await login(email, otpString);
    }

    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error);
      return;
    }

    // After successful authentication, check if profile exists (has full_name)
    try {
      const profile = await fetchProfile();
      if (profile && profile.full_name && profile.full_name.trim().length > 0) {
        // Profile exists → go to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        // No profile or empty name → go to profile screen to complete it
        navigation.reset({
          index: 0,
          routes: [{ name: 'Profile' }],
        });
      }
    } catch (error) {
      // Profile not found → treat as missing profile
      navigation.reset({
        index: 0,
        routes: [{ name: 'Profile' }],
      });
    }
  };

  return (
    <View className="flex-1 bg-black">
      <View className="absolute top-[-120px] left-[-80px] w-[260px] h-[260px] rounded-full bg-white/5" />
      <View className="absolute bottom-[-140px] right-[-80px] w-[300px] h-[300px] rounded-full bg-white/5" />

      <LinearGradient colors={['#000000', '#050505', '#000000']} className="flex-1">
        <View style={{ paddingTop: insets.top }} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <View className="flex-1 justify-center px-6">
            <View>
              <View className="mb-10">
                <Text className="text-white text-3xl font-extrabold tracking-tight">Verify OTP</Text>
                <Text className="text-gray-400 text-sm mt-2">Enter the 6-digit code sent to</Text>
                <Text className="text-white text-sm mt-1 font-medium">{email}</Text>
              </View>

              <View className="flex-row justify-between mb-10">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputs.current[index] = ref)}
                    className={`w-12 h-14 rounded-2xl text-center text-xl border ${
                      digit
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-white border-white/10'
                    }`}
                    value={digit}
                    onChangeText={(text) => handleChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                  />
                ))}
              </View>

              <AnimatedButton title={loading ? 'Verifying...' : 'Verify'} onPress={handleSubmit} disabled={loading} />

              <TouchableOpacity className="mt-6 items-center">
                <Text className="text-gray-400 text-sm">
                  Didn’t receive code? <Text className="text-white font-semibold">Resend</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>

        <View style={{ paddingBottom: insets.bottom + 10 }} />
      </LinearGradient>
    </View>
  );
}