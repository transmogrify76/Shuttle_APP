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
import { C, T } from '../styles/design';

export default function OTPVerificationScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { email, flow } = route.params;

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
      result = await signup(email, otpString);
    } else {
      result = await login(email, otpString);
    }

    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error);
      return;
    }

    // After successful authentication, check if profile exists
    try {
      const profile = await fetchProfile();
      if (profile && profile.full_name && profile.full_name.trim().length > 0) {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
      }
    } catch (error) {
      navigation.reset({ index: 0, routes: [{ name: 'Profile' }] });
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
              <Text style={[T.displayLg, { marginBottom: 8 }]}>Verify OTP</Text>
              <Text style={[T.bodySm, { marginTop: 4 }]}>Enter the 6-digit code sent to</Text>
              <Text style={[T.bodyMd, { marginTop: 2, color: C.gold }]}>{email}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 32 }}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputs.current[index] = ref)}
                  style={{
                    width: 52,
                    height: 60,
                    borderRadius: 16,
                    textAlign: 'center',
                    fontSize: 20,
                    fontWeight: 'bold',
                    borderWidth: 1,
                    borderColor: digit ? C.gold : C.border,
                    backgroundColor: digit ? C.gold : C.surfaceUp,
                    color: digit ? '#000' : C.textPrimary,
                  }}
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
              buttonColor="gold"
              style={{ marginBottom: 16 }}
            />

            <TouchableOpacity style={{ alignItems: 'center' }}>
              <Text style={[T.bodySm, { color: C.textSecondary }]}>
                Didn’t receive code? <Text style={{ color: C.gold, fontWeight: 'bold' }}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        <View style={{ paddingBottom: insets.bottom + 10 }} />
      </LinearGradient>
    </View>
  );
}