import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AnimatedButton from '../components/AnimatedButton';
import { useAuth } from '../context/AuthContext';

export default function EmailEntryScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { flow } = route.params;

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const { sendOTP } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    // Pass the flow (login or signup) – the API will always include role='passenger'
    const result = await sendOTP(email, flow);
    setLoading(false);

    if (result.success) {
      navigation.navigate('OTPVerification', {
        email,
        flow,
        // role is no longer needed because it's hardcoded on the backend side
        // but we keep it for consistency, though unused
        role: 'passenger',
      });
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <View className="absolute top-[-120px] left-[-80px] w-[260px] h-[260px] rounded-full bg-white/5" />
      <View className="absolute bottom-[-140px] right-[-80px] w-[300px] h-[300px] rounded-full bg-white/5" />

      <LinearGradient
        colors={['#000000', '#050505', '#000000']}
        className="flex-1"
      >
        <View style={{ paddingTop: insets.top }} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1 justify-center px-6">
            <View>
              <View className="mb-10">
                <Text className="text-white text-3xl font-extrabold tracking-tight">
                  {flow === 'login' ? 'Welcome back' : 'Create account'}
                </Text>
                <Text className="text-gray-400 text-sm mt-2">
                  {flow === 'login'
                    ? 'Enter your email to receive a login OTP'
                    : 'Start your journey with Kolkata Shuttle'}
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-gray-400 text-xs mb-2">EMAIL</Text>
                <TextInput
                  className="bg-white/5 text-white rounded-2xl p-4 text-base border border-white/10"
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <AnimatedButton
                title={loading ? 'Sending...' : 'Continue'}
                onPress={handleSubmit}
                disabled={loading}
              />

              <View className="mt-6 items-center">
                <Text className="text-gray-500 text-xs text-center">
                  By continuing, you agree to our Terms & Privacy Policy
                </Text>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>

        <View style={{ paddingBottom: insets.bottom + 10 }} />
      </LinearGradient>
    </View>
  );
}