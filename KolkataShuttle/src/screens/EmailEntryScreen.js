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
import { C, T } from '../styles/design';

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
    const result = await sendOTP(email, flow);
    setLoading(false);

    if (result.success) {
      navigation.navigate('OTPVerification', {
        email,
        flow,
        role: 'passenger',
      });
    } else {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={[C.bg, C.surface]} style={{ flex: 1 }}>
        <View style={{ paddingTop: insets.top }} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
            <View>
              <Text style={[T.displayLg, { marginBottom: 8 }]}>
                {flow === 'login' ? 'Welcome back' : 'Create account'}
              </Text>
              <Text style={[T.bodySm, { marginBottom: 32 }]}>
                {flow === 'login'
                  ? 'Enter your email to receive a login OTP'
                  : 'Start your journey with Kolkata Shuttle'}
              </Text>

              <Text style={[T.headingSm, { marginBottom: 8 }]}>EMAIL</Text>
              <TextInput
                style={{
                  backgroundColor: C.surfaceUp,
                  borderRadius: 20,
                  padding: 16,
                  color: C.textPrimary,
                  marginBottom: 24,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
                placeholder="Enter your email"
                placeholderTextColor={C.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <AnimatedButton
                title={loading ? 'Sending...' : 'Continue'}
                onPress={handleSubmit}
                disabled={loading}
                buttonColor="gold"
              />

              <View style={{ marginTop: 24, alignItems: 'center' }}>
                <Text style={[T.bodySm, { textAlign: 'center', color: C.textMuted }]}>
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