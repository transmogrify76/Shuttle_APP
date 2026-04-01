import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedButton from '../components/AnimatedButton';
import { useAuth } from '../context/AuthContext';

export default function OTPVerificationScreen({ route }) {
  const insets = useSafeAreaInsets();
  const { email, flow, role } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < 5) inputs.current[index + 1]?.focus();
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
    }
  };

  return (
    <View className="flex-1 bg-black px-6" style={{ paddingTop: insets.top + 20 }}>
      <Text className="text-white text-2xl font-bold mb-2">Enter OTP</Text>
      <Text className="text-gray-400 text-base mb-8">
        We've sent a 6-digit code to {email}
      </Text>

      <View className="flex-row justify-between mb-8">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            className="w-12 h-12 bg-gray-900 text-white rounded-xl text-center text-xl"
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
          />
        ))}
      </View>

      <AnimatedButton
        title={loading ? 'Verifying...' : 'Verify'}
        onPress={handleSubmit}
        disabled={loading}
      />

      <TouchableOpacity className="mt-4" onPress={() => {}}>
        <Text className="text-gray-400 text-center">Resend OTP</Text>
      </TouchableOpacity>
    </View>
  );
}