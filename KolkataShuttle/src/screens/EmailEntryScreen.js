import React, { useState } from 'react';
import { View, Text, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnimatedButton from '../components/AnimatedButton';
import { useAuth } from '../context/AuthContext';

export default function EmailEntryScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { flow } = route.params;
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('passenger');
  const [loading, setLoading] = useState(false);
  const { sendOTP } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    const result = await sendOTP(email, flow === 'signup' ? role : null);
    setLoading(false);
    if (result.success) {
      navigation.navigate('OTPVerification', { email, flow, role: flow === 'signup' ? role : null });
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View className="flex-1 bg-black px-6" style={{ paddingTop: insets.top + 20 }}>
      <Text className="text-white text-2xl font-bold mb-2">
        {flow === 'login' ? 'Login' : 'Create account'}
      </Text>
      <Text className="text-gray-400 text-base mb-8">
        {flow === 'login'
          ? 'Enter your email to receive a login OTP'
          : 'Enter your email and role to start using Kolkata Shuttle'}
      </Text>

      <TextInput
        className="bg-gray-900 text-white rounded-xl p-4 text-base mb-4"
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {flow === 'signup' && (
        <View className="mb-6">
          <Text className="text-white mb-2">I am a:</Text>
          <View className="flex-row">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-l-xl border ${role === 'passenger' ? 'bg-white border-white' : 'border-gray-700'}`}
              onPress={() => setRole('passenger')}
            >
              <Text className={`text-center ${role === 'passenger' ? 'text-black' : 'text-white'}`}>Passenger</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-r-xl border ${role === 'driver' ? 'bg-white border-white' : 'border-gray-700'}`}
              onPress={() => setRole('driver')}
            >
              <Text className={`text-center ${role === 'driver' ? 'text-black' : 'text-white'}`}>Driver (Owner)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <AnimatedButton
        title={loading ? 'Sending...' : 'Continue'}
        onPress={handleSubmit}
        disabled={loading}
        style={{ marginTop: 8 }}
      />
    </View>
  );
}